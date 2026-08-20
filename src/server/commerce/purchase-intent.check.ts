/**
 * Self-check for the commerce boundary state machine.
 * Run: pnpm check:commerce
 *
 * No framework on purpose — this is the smallest thing that fails if the
 * authorization logic breaks.
 */

import assert from "node:assert/strict";
import {
  canTransition,
  evaluatePolicy,
  isTerminal,
  repricingInvalidatesAuthorization,
  totalAmount,
  type Delegation,
} from "./purchase-intent.ts";

const now = new Date("2026-08-20T12:00:00Z");

const base: Delegation = {
  agent: "openai:shopping-agent",
  maxTransaction: 15000,
  requiresConfirmationAbove: 7500,
  categories: ["restaurants"],
  expiresAt: new Date("2026-09-01T00:00:00Z"),
  revokedAt: null,
};

// ── totals ───────────────────────────────────────────────────────────────────
assert.equal(
  totalAmount([
    { name: "Salmon bowl", quantity: 1, unitAmount: 1800 },
    { name: "Latte", quantity: 2, unitAmount: 600 },
  ]),
  3000,
);

// ── transitions ──────────────────────────────────────────────────────────────
assert.ok(canTransition("quoted", "authorized"));
assert.ok(canTransition("authorized", "confirmed"));
assert.ok(!canTransition("draft", "confirmed"), "cannot skip authorization");
assert.ok(!canTransition("fulfilled", "cancelled"), "fulfilled is terminal");
assert.ok(!canTransition("declined", "authorized"), "declined is terminal");
assert.ok(isTerminal("fulfilled") && isTerminal("expired"));
// Re-quoting an authorized intent is allowed; that is how re-pricing recovers.
assert.ok(canTransition("authorized", "quoted"));

// ── policy: direct human purchase ────────────────────────────────────────────
{
  const d = evaluatePolicy({ amount: 99999, delegation: null, now });
  assert.ok(d.allowed, "a human buying directly is not policy-limited");
  assert.ok(!d.requiresHumanConfirmation);
}

// ── policy: within limits ────────────────────────────────────────────────────
{
  const d = evaluatePolicy({
    amount: 5000,
    category: "restaurants",
    delegation: base,
    now,
  });
  assert.ok(d.allowed);
  assert.ok(!d.requiresHumanConfirmation, "below threshold needs no confirm");
}

// ── policy: confirmation threshold ───────────────────────────────────────────
{
  const d = evaluatePolicy({
    amount: 11642, // the $116.42 dinner from the spec
    category: "restaurants",
    delegation: base,
    now,
  });
  assert.ok(d.allowed);
  assert.ok(d.requiresHumanConfirmation, "above threshold must ask a human");
}

// ── policy: over the ceiling ─────────────────────────────────────────────────
{
  const d = evaluatePolicy({
    amount: 20000,
    category: "restaurants",
    delegation: base,
    now,
  });
  assert.ok(!d.allowed);
  assert.match(d.reason, /exceeds the delegated limit/);
}

// ── policy: wrong category ───────────────────────────────────────────────────
{
  const d = evaluatePolicy({
    amount: 1000,
    category: "electronics",
    delegation: base,
    now,
  });
  assert.ok(!d.allowed, "category restriction is enforced");
}
{
  const d = evaluatePolicy({ amount: 1000, delegation: base, now });
  assert.ok(!d.allowed, "missing category fails a category-restricted delegation");
}

// ── policy: expired and revoked ──────────────────────────────────────────────
{
  const expired = { ...base, expiresAt: new Date("2026-08-01T00:00:00Z") };
  assert.ok(!evaluatePolicy({ amount: 100, category: "restaurants", delegation: expired, now }).allowed);

  const revoked = { ...base, revokedAt: new Date("2026-08-19T00:00:00Z") };
  assert.ok(!evaluatePolicy({ amount: 100, category: "restaurants", delegation: revoked, now }).allowed);
}

// ── policy: zero and negative amounts ────────────────────────────────────────
assert.ok(!evaluatePolicy({ amount: 0, delegation: null, now }).allowed);
assert.ok(!evaluatePolicy({ amount: -500, delegation: null, now }).allowed);

// ── re-pricing invalidates authorization ─────────────────────────────────────
// The whole point: authorized $58 must never become a paid $92.
assert.ok(repricingInvalidatesAuthorization("authorized", 5800, 9200));
assert.ok(repricingInvalidatesAuthorization("confirmed", 5800, 9200));
assert.ok(!repricingInvalidatesAuthorization("quoted", 5800, 9200));
assert.ok(!repricingInvalidatesAuthorization("authorized", 5800, 5800), "same price is not a re-price");

console.log("commerce boundary self-check: all assertions passed");
