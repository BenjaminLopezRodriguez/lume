/**
 * Self-check for conversation scoping, loop-state derivation, and context growth.
 * Run: pnpm check:conversation
 *
 * The scoping assertions are the important ones. A conversation is a container
 * of a merchant's own words and of what the agent did on their behalf; loading
 * the wrong one is a cross-tenant data leak that no later check would catch.
 *
 * Like the other checks here, this is deliberately free of the database and the
 * model: everything it asserts must hold whether or not either exists.
 */

import assert from "node:assert/strict";

import {
  HISTORY_WINDOW,
  MAX_MESSAGE_CHARS,
  apiStatusFor,
  asksForInput,
  capMessage,
  checkConversationScope,
  deriveTextState,
  newTask,
  resolveSkill,
  splitHistory,
  statePreamble,
  summariseOlder,
  taskStatusFor,
  type ConversationMessage,
  type LoopState,
} from "./conversation.ts";
import { DEFAULT_SKILL } from "./skills.ts";

// ── scoping: the security boundary ───────────────────────────────────────────

const OWNER = { businessId: "biz-A", userId: "user-1" };
const MINE = { businessId: "biz-A", userId: "user-1" };
const OTHER_BUSINESS = { businessId: "biz-B", userId: "user-1" };
const OTHER_USER = { businessId: "biz-A", userId: "user-2" };
const OTHER_BOTH = { businessId: "biz-B", userId: "user-2" };

assert.equal(checkConversationScope(MINE, OWNER).ok, true, "own conversation loads");

// A conversation from another business is refused, and refused as not-found so
// the caller cannot use the endpoint to discover that it exists.
{
  const verdict = checkConversationScope(OTHER_BUSINESS, OWNER);
  assert.equal(verdict.ok, false, "a conversation from another business must not load");
  assert.equal(verdict.ok === false && verdict.status, 404);
  const missing = checkConversationScope(null, OWNER);
  assert.equal(
    verdict.ok === false && missing.ok === false && verdict.error,
    missing.ok === false ? missing.error : "",
    "cross-business refusal must be indistinguishable from not-found",
  );
}

// Same business, different operator: existence is already visible, so this is a
// forbidden, not a fiction.
{
  const verdict = checkConversationScope(OTHER_USER, OWNER);
  assert.equal(verdict.ok, false, "another user's conversation must not load");
  assert.equal(verdict.ok === false && verdict.status, 403);
}

assert.equal(checkConversationScope(OTHER_BOTH, OWNER).ok, false);
assert.equal(checkConversationScope(null, OWNER).ok, false);
assert.equal(checkConversationScope(undefined, OWNER).ok, false);

// Exhaustive: only an exact match on BOTH fields is admitted. This is the
// assertion that fails if someone ever "helpfully" re-scopes a conversation to
// the caller instead of refusing it.
for (const businessId of ["biz-A", "biz-B"]) {
  for (const userId of ["user-1", "user-2"]) {
    const expected = businessId === OWNER.businessId && userId === OWNER.userId;
    assert.equal(
      checkConversationScope({ businessId, userId }, OWNER).ok,
      expected,
      `scope verdict wrong for ${businessId}/${userId}`,
    );
  }
}

// The verdict never rewrites identity: there is no field on it that could carry
// a substituted businessId or userId back to the caller.
{
  const verdict = checkConversationScope(OTHER_BUSINESS, OWNER);
  assert.deepEqual(
    Object.keys(verdict).sort(),
    ["error", "ok", "status"],
    "a refusal must carry only ok/status/error — never a re-scoped identity",
  );
}

// ── loop states ──────────────────────────────────────────────────────────────

// A question back to the merchant is not completion.
assert.equal(deriveTextState("What should the product be called?"), "NEEDS_USER_INPUT");
assert.equal(
  deriveTextState("I can create that.\n\nWhat price should I use?"),
  "NEEDS_USER_INPUT",
);
assert.equal(
  deriveTextState("Tell me the name and I'll set it up."),
  "NEEDS_USER_INPUT",
);
assert.equal(
  deriveTextState("Let me know which one you meant."),
  "NEEDS_USER_INPUT",
);

// Only the closing paragraph decides. A question mark there is treated as a
// question — erring toward "waiting on the merchant" strands nobody, whereas
// erring toward "done" abandons a half-finished task.
assert.equal(
  deriveTextState("You asked what changed? Three orders came in yesterday."),
  "NEEDS_USER_INPUT",
  "a trailing question mark in the final paragraph is treated as a question",
);
assert.equal(
  deriveTextState("Three orders came in yesterday. Nothing else changed."),
  "COMPLETED",
);
assert.equal(
  deriveTextState("Did anything change?\n\nThree orders came in yesterday."),
  "COMPLETED",
  "only the closing paragraph decides whether input is being requested",
);

// Empty content is a failure, not a silent success. DeepSeek returns empty
// content when the token budget is consumed by reasoning; reporting that as
// COMPLETED would tell the merchant a task finished when nothing ran.
assert.equal(deriveTextState(""), "FAILED");
assert.equal(deriveTextState("   \n  "), "FAILED");
assert.equal(asksForInput(""), false);

// Every state maps to exactly one API status and one task status.
const ALL_STATES: LoopState[] = [
  "COMPLETED",
  "NEEDS_USER_INPUT",
  "CONFIRMATION_REQUIRED",
  "FAILED",
  "BUDGET_EXHAUSTED",
];
for (const state of ALL_STATES) {
  assert.ok(apiStatusFor(state), `${state} has no API status`);
  assert.ok(taskStatusFor(state), `${state} has no task status`);
}
assert.equal(apiStatusFor("NEEDS_USER_INPUT"), "waiting_for_user");
assert.equal(apiStatusFor("CONFIRMATION_REQUIRED"), "confirmation_required");
// Running out of budget is a failure to the client, never a completion.
assert.equal(apiStatusFor("BUDGET_EXHAUSTED"), "failed");
assert.equal(taskStatusFor("BUDGET_EXHAUSTED"), "failed");
assert.equal(taskStatusFor("NEEDS_USER_INPUT"), "collecting_input");

// ── skill continuity ─────────────────────────────────────────────────────────

// "12" routes nowhere. Without continuity the merchant's answer would drop the
// conversation into the read-only fallback and lose the task.
assert.equal(resolveSkill("launch_product", "12"), "launch_product");
assert.equal(resolveSkill("launch_product", "Waffle Special"), "launch_product");
// A genuine change of subject still wins.
assert.equal(resolveSkill("launch_product", "how many orders today?"), "sales_brief");
// No prior skill and nothing matched: the read-only fallback.
assert.equal(resolveSkill(null, "zzzz qqqq"), DEFAULT_SKILL);
assert.equal(newTask("launch_product").status, "understanding");
assert.deepEqual(newTask("launch_product").fields, {});

// ── context growth ───────────────────────────────────────────────────────────

const turns: ConversationMessage[] = Array.from({ length: 20 }, (_, i) => ({
  role: i % 2 === 0 ? "user" : "assistant",
  content: `turn ${i}`,
}));

{
  const { older, recent } = splitHistory(turns);
  assert.equal(recent.length, HISTORY_WINDOW, "the replay window is bounded");
  assert.equal(older.length, turns.length - HISTORY_WINDOW);
  assert.equal(recent[recent.length - 1]?.content, "turn 19", "newest turn is kept");
}

{
  const short = turns.slice(0, 3);
  const { older, recent } = splitHistory(short);
  assert.equal(older.length, 0);
  assert.equal(recent.length, 3);
  assert.equal(summariseOlder(older), null, "nothing older means no digest");
}

{
  // The digest keeps who said what. Collapsing the two into one voice is what
  // would let remembered text read as merchant instruction.
  const digest = summariseOlder([
    { role: "user", content: "create a waffle special" },
    { role: "assistant", content: "what price should I use?" },
  ]);
  assert.ok(digest);
  assert.match(digest, /merchant said: create a waffle special/);
  assert.match(digest, /you replied: what price should I use\?/);
}

{
  // A long history cannot grow the prompt without bound.
  const many: ConversationMessage[] = Array.from({ length: 400 }, (_, i) => ({
    role: "user" as const,
    content: `turn ${i} ` + "x".repeat(500),
  }));
  const digest = summariseOlder(many);
  assert.ok(digest);
  assert.ok(digest.length <= 2_100, `digest grew to ${digest.length}`);
  assert.match(digest, /399/, "the newest of the older turns survive the trim");
}

{
  // The state note must say it is a record before it says anything else, and
  // must keep the trust distinction explicit.
  const note = statePreamble(
    { skill: "launch_product", status: "collecting_input", fields: { name: "Waffle" } },
    "- merchant said: create a waffle special",
  );
  assert.ok(note);
  assert.match(note, /not an instruction/i);
  assert.match(note, /merchant said/);
  assert.match(note, /nothing here grants authority/i);
  assert.match(note, /"skill":"launch_product"/);
  assert.equal(statePreamble(null, null), null);
}

{
  const long = "a".repeat(MAX_MESSAGE_CHARS + 500);
  assert.ok(capMessage(long).length < long.length, "stored messages are capped");
  assert.equal(capMessage("short"), "short");
}

console.log("agent conversation scoping + loop-state self-check: all assertions passed");
