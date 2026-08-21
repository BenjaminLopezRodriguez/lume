/**
 * Self-check for tool classification, run budgets, and skill routing.
 * Run: pnpm check:agent
 *
 * These are the safety rails that must hold whether or not a model key exists,
 * so they are deliberately free of the model and the database.
 */

import assert from "node:assert/strict";
import {
  TOOL_CLASS,
  checkBudget,
  isKnownTool,
  newTally,
  recordCall,
  requireClass,
  requiresConfirmation,
  RUN_LIMITS,
} from "./policy.ts";
import { DEFAULT_SKILL, SKILLS, routeSkill, skillTools } from "./skills.ts";

// ── classification ───────────────────────────────────────────────────────────
assert.equal(requireClass("order_list"), "READ");
assert.equal(requireClass("product_create"), "WRITE");
assert.equal(requireClass("qr_remove"), "DESTRUCTIVE");

// An unclassified tool must throw, never silently default to runnable.
assert.throws(() => requireClass("order_refund"), /Unclassified tool/);
assert.throws(() => requireClass("definitely_not_a_tool"), /Unclassified tool/);
assert.equal(isKnownTool("order_refund"), false, "refund is deferred, not built");

// ── confirmation policy ──────────────────────────────────────────────────────
assert.equal(requiresConfirmation("order_list"), false, "reads run unattended");
assert.equal(requiresConfirmation("product_create"), true);
assert.equal(requiresConfirmation("qr_remove"), true);

// Every non-READ tool in the registry must require confirmation. This is the
// invariant that stops a new tool from quietly shipping as unconfirmed.
for (const [name, cls] of Object.entries(TOOL_CLASS)) {
  assert.equal(
    requiresConfirmation(name),
    cls !== "READ",
    `${name} (${cls}) has the wrong confirmation requirement`,
  );
}

// ── budgets ──────────────────────────────────────────────────────────────────
{
  let tally = newTally(0);
  for (let i = 0; i < RUN_LIMITS.maxToolCalls; i++) {
    assert.equal(checkBudget(tally, "order_list", 0).ok, true);
    tally = recordCall(tally, "order_list");
  }
  const verdict = checkBudget(tally, "order_list", 0);
  assert.equal(verdict.ok, false, "tool-call ceiling must stop the loop");
  assert.match(verdict.ok === false ? verdict.reason : "", /tool-call limit/);
}

{
  // Mutations have their own, lower ceiling.
  let tally = newTally(0);
  for (let i = 0; i < RUN_LIMITS.maxMutations; i++) {
    assert.equal(checkBudget(tally, "product_create", 0).ok, true);
    tally = recordCall(tally, "product_create");
  }
  assert.equal(checkBudget(tally, "product_create", 0).ok, false);
  // Reads are still allowed after the mutation ceiling is hit.
  assert.equal(checkBudget(tally, "order_list", 0).ok, true);
}

{
  // Wall-clock ceiling, independent of call count.
  const tally = newTally(0);
  assert.equal(checkBudget(tally, "order_list", RUN_LIMITS.maxRuntimeMs).ok, false);
}

// Reads must not count against the mutation budget.
{
  const tally = recordCall(newTally(0), "order_list");
  assert.equal(tally.mutations, 0);
  assert.equal(tally.toolCalls, 1);
}

// ── skill routing ────────────────────────────────────────────────────────────
assert.equal(routeSkill("How many orders did I get today?"), "sales_brief");
assert.equal(routeSkill("Create a $12 waffle special"), "launch_product");
assert.equal(routeSkill("What's broken in my setup?"), "diagnose_setup");
assert.equal(routeSkill("Who hasn't ordered recently?"), "browse_customers");

// Longest match wins: "create a product" must beat the bare "product".
assert.equal(routeSkill("create a product"), "launch_product");

// Unroutable input falls back to a read-only skill, so it cannot mutate.
const fallback = routeSkill("zzzz qqqq");
assert.equal(fallback, DEFAULT_SKILL);
assert.ok(
  skillTools(fallback).every((t) => !requiresConfirmation(t)),
  "the fallback skill must expose read-only tools",
);

// ── every skill's tools are classified, and narrow ───────────────────────────
for (const skill of Object.values(SKILLS)) {
  assert.ok(skill.tools.length > 0, `${skill.name} offers no tools`);
  assert.ok(
    skill.tools.length <= 6,
    `${skill.name} offers ${skill.tools.length} tools — too broad to route reliably`,
  );
  for (const tool of skill.tools) {
    assert.ok(isKnownTool(tool), `${skill.name} offers unknown tool ${tool}`);
  }
}

// No skill may offer a tool that does not exist in the registry — this is what
// stops a skill from advertising a deferred capability like refunds.
const offered = new Set(Object.values(SKILLS).flatMap((s) => s.tools));
for (const tool of offered) {
  assert.ok(isKnownTool(tool), `skills offer unregistered tool ${tool}`);
}

console.log("agent policy + skill-routing self-check: all assertions passed");
