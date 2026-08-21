/**
 * Self-check for idempotency classification and request hashing.
 * Run: pnpm check:idempotency
 *
 * No framework, no database — the pure half of the module is deliberately
 * separable so retry semantics can be exercised without one.
 */

import assert from "node:assert/strict";
import {
  classifyExisting,
  hashRequest,
  idempotentResponse,
  readIdempotencyKey,
} from "./idempotency.ts";

const req = (headers: Record<string, string>) =>
  new Request("https://example.test/x", { method: "POST", headers });

// ── header reading ───────────────────────────────────────────────────────────
assert.equal(readIdempotencyKey(req({})), null, "absent key is legal");
assert.equal(readIdempotencyKey(req({ "idempotency-key": "abc" })), "abc");
assert.equal(readIdempotencyKey(req({ "idempotency-key": "  abc  " })), "abc");
assert.equal(readIdempotencyKey(req({ "idempotency-key": "   " })), null);
assert.equal(
  readIdempotencyKey(req({ "idempotency-key": "x".repeat(257) })),
  null,
  "over-long key is rejected rather than truncated",
);

// ── hashing is stable and order-independent ──────────────────────────────────
const a = { businessId: "b1", items: [{ name: "Latte", quantity: 2 }] };
const b = { items: [{ quantity: 2, name: "Latte" }], businessId: "b1" };
assert.equal(hashRequest(a), hashRequest(b), "key order must not change the hash");
assert.equal(hashRequest(a), hashRequest({ ...a }), "same input, same hash");
assert.notEqual(
  hashRequest(a),
  hashRequest({ ...a, businessId: "b2" }),
  "different input, different hash",
);
// Array order IS meaningful — two line items swapped is a different order.
assert.notEqual(
  hashRequest({ items: [1, 2] }),
  hashRequest({ items: [2, 1] }),
);
// undefined is dropped, matching JSON.stringify
assert.equal(hashRequest({ a: 1 }), hashRequest({ a: 1, b: undefined }));

// ── classification ───────────────────────────────────────────────────────────
const H = hashRequest({ ok: true });

{
  // Same key, same body, response stored → replay verbatim.
  const d = classifyExisting(
    { requestHash: H, responseStatus: 201, responseBody: { id: "pi_1" } },
    H,
  );
  assert.equal(d.kind, "replay");
  assert.equal(d.kind === "replay" && d.status, 201);
  assert.deepEqual(d.kind === "replay" && d.body, { id: "pi_1" });
}

{
  // Same key, DIFFERENT body → client bug. Must never serve the old response.
  const d = classifyExisting(
    { requestHash: H, responseStatus: 201, responseBody: { id: "pi_1" } },
    hashRequest({ ok: false }),
  );
  assert.equal(d.kind, "mismatch");
  const r = idempotentResponse(d);
  assert.equal(r.status, 409);
  assert.notDeepEqual(r.body, { id: "pi_1" }, "old response must not leak");
}

{
  // Reservation row exists but no response yet → first attempt still running.
  const d = classifyExisting(
    { requestHash: H, responseStatus: null, responseBody: null },
    H,
  );
  assert.equal(d.kind, "in_flight");
  assert.equal(idempotentResponse(d).status, 409);
}

// ── replay preserves the original status, including non-2xx ──────────────────
{
  const d = classifyExisting(
    { requestHash: H, responseStatus: 200, responseBody: { status: "confirmed" } },
    H,
  );
  assert.deepEqual(idempotentResponse(d), {
    status: 200,
    body: { status: "confirmed" },
  });
}

console.log("idempotency self-check: all assertions passed");
