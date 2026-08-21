/**
 * Self-check for agent block rendering.
 * Run: pnpm check:blocks
 *
 * Regression guard: a mismatch between the server's block shape
 * ({ kind, tool, data }) and the client's assumption ({ type, items })
 * crashed the merchant app in production with
 * "undefined is not an object (evaluating 'e.items.map')".
 * No input may throw.
 */

import assert from "node:assert/strict";
import { blockRows, toRow } from "./agent-blocks.ts";

// ── the exact shape the server sends ─────────────────────────────────────────
{
  const rows = blockRows({
    kind: "tool_result",
    tool: "order_list",
    data: {
      hasData: true,
      count: 2,
      items: [
        { id: "ord_1", label: "Waffle Combo", status: "paid", source: "qr" },
        { id: "ord_2", label: "Latte", status: "pending" },
      ],
    },
  });
  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.label, "Waffle Combo");
  assert.equal(rows[0]?.detail, "paid · qr");
  assert.equal(rows[1]?.detail, "pending");
}

// ── the shapes that crashed, and every neighbour of them ────────────────────
for (const hostile of [
  undefined,
  null,
  {},
  { data: null },
  { data: {} },
  { data: { items: null } },
  { data: { items: "not an array" } },
  { data: { hasData: false, count: 0, items: [] } },
  { type: "list", items: [{ id: "x", label: "y" }] }, // the OLD client shape
  { kind: "tool_result", tool: "order_list" }, // data missing entirely
  "a string",
  42,
  [],
]) {
  assert.doesNotThrow(() => blockRows(hostile), `threw on ${JSON.stringify(hostile)}`);
  assert.ok(Array.isArray(blockRows(hostile)), "always returns an array");
}

// An empty result renders nothing rather than an empty container.
assert.deepEqual(blockRows({ data: { hasData: false, items: [] } }), []);

// ── rows without anything renderable are dropped, not rendered blank ────────
{
  const rows = blockRows({
    data: { items: [{ amount: 100 }, null, undefined, { id: "ok", label: "Fine" }] },
  });
  assert.equal(rows.length, 1, "only the renderable row survives");
  assert.equal(rows[0]?.label, "Fine");
}

// ── label falls back through name/title/id ──────────────────────────────────
assert.equal(toRow({ name: "By name" }, 0)?.label, "By name");
assert.equal(toRow({ title: "By title" }, 0)?.label, "By title");
assert.equal(toRow({ id: "by_id" }, 0)?.label, "by_id");
assert.equal(toRow({ label: "wins", name: "loses" }, 0)?.label, "wins");

// ── keys are stable and unique enough for React ─────────────────────────────
{
  const rows = blockRows({ data: { items: [{ label: "a" }, { label: "b" }] } });
  assert.notEqual(rows[0]?.key, rows[1]?.key, "keys must differ");
}

console.log("agent block rendering self-check: all assertions passed");
