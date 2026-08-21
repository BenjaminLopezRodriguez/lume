import { createHash } from "node:crypto";

/**
 * Idempotency for mutating commerce operations.
 *
 * Agents and mobile clients retry. A retry must never produce a second charge or
 * a second order, so the first response is stored and replayed verbatim.
 *
 * The race is settled by the unique index on (operation, key) — never by a
 * read-then-write check, which two concurrent requests both pass.
 *
 * The pure half (hashing + classification) is deliberately free of the database
 * so it can be exercised by idempotency.check.ts without one.
 */

/** Operations are scoped so the same key under two operations cannot collide. */
export type IdempotentOperation =
  | "purchase_intent.create"
  | "purchase_intent.confirm"
  /**
   * A merchant-agent action proposed by the model and awaiting human
   * confirmation. Shares this table for its unique (operation, key) index, but
   * uses the single-use helpers below rather than the claim/record cycle: a
   * proposal is written once and consumed once, not retried.
   */
  | "agent.proposal";

const MAX_KEY_LENGTH = 256;

/**
 * Loaded lazily so the pure half of this module (hashing, classification) can be
 * imported and self-checked without a database or the Next path aliases.
 */
async function store() {
  const [{ and, eq }, { db }, { idempotencyKeys }] = await Promise.all([
    import("drizzle-orm"),
    import("@/server/db"),
    import("@/server/db/schema"),
  ]);
  const scope = (operation: string, key: string) =>
    and(eq(idempotencyKeys.operation, operation), eq(idempotencyKeys.key, key));
  return { db, idempotencyKeys, scope };
}

/** Reads and validates the Idempotency-Key header. Absent is legal — for now. */
export function readIdempotencyKey(req: Request): string | null {
  const raw = req.headers.get("idempotency-key");
  if (raw === null) return null;
  const key = raw.trim();
  if (!key || key.length > MAX_KEY_LENGTH) return null;
  return key;
}

/**
 * Key-order-independent JSON, so `{a,b}` and `{b,a}` hash identically.
 * Undefined values are dropped exactly as JSON.stringify drops them.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
    .join(",")}}`;
}

/** Stable fingerprint of the request payload. */
export function hashRequest(body: unknown): string {
  return createHash("sha256").update(stableStringify(body)).digest("hex");
}

export type StoredIdempotencyRecord = {
  requestHash: string;
  responseStatus: number | null;
  responseBody: unknown;
};

export type IdempotencyDecision =
  /** Same key, same body, response already stored — replay it verbatim. */
  | { kind: "replay"; status: number; body: unknown }
  /** Same key, different body — a client bug. Never serve the old response. */
  | { kind: "mismatch" }
  /** Same key, same body, first attempt still running — do not execute twice. */
  | { kind: "in_flight" };

/** Pure: what to do when a row for (operation, key) already exists. */
export function classifyExisting(
  existing: StoredIdempotencyRecord,
  requestHash: string,
): IdempotencyDecision {
  if (existing.requestHash !== requestHash) return { kind: "mismatch" };
  if (existing.responseStatus === null) return { kind: "in_flight" };
  return {
    kind: "replay",
    status: existing.responseStatus,
    body: existing.responseBody,
  };
}

/** Postgres unique_violation. */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === "23505"
  );
}

export type IdempotencyClaim =
  /** Nothing stored yet — the caller owns this operation and must execute it. */
  | { kind: "proceed" }
  | IdempotencyDecision;

/**
 * Claims (operation, key) by inserting a reservation row. Losing the insert race
 * means someone else already owns the operation; we then read their row.
 */
export async function claimIdempotencyKey(
  operation: IdempotentOperation,
  key: string,
  requestHash: string,
): Promise<IdempotencyClaim> {
  const { db, idempotencyKeys, scope } = await store();

  try {
    await db.insert(idempotencyKeys).values({ operation, key, requestHash });
    return { kind: "proceed" };
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
  }

  const existing = await db.query.idempotencyKeys.findFirst({
    where: scope(operation, key),
  });
  // Vanishingly rare: the row was removed between the conflict and the read.
  if (!existing) return { kind: "in_flight" };

  return classifyExisting(
    {
      requestHash: existing.requestHash,
      responseStatus: existing.responseStatus,
      responseBody: existing.responseBody,
    },
    requestHash,
  );
}

/** Stores the response so the next retry replays it instead of re-executing. */
export async function recordIdempotentResponse(
  operation: IdempotentOperation,
  key: string,
  status: number,
  body: unknown,
): Promise<void> {
  const { db, idempotencyKeys, scope } = await store();
  await db
    .update(idempotencyKeys)
    .set({ responseStatus: status, responseBody: body })
    .where(scope(operation, key));
}

/**
 * Releases a claim whose operation failed before storing a response, so the
 * client's retry is not permanently wedged behind an in-flight reservation.
 */
export async function releaseIdempotencyKey(
  operation: IdempotentOperation,
  key: string,
): Promise<void> {
  const { db, idempotencyKeys, scope } = await store();
  await db.delete(idempotencyKeys).where(scope(operation, key));
}

/**
 * Pure: the HTTP shape of a non-proceed claim. Kept here so both routes answer a
 * reused key identically. A mismatched body is 409 and never the old response.
 */
export function idempotentResponse(decision: IdempotencyDecision): {
  status: number;
  body: unknown;
} {
  if (decision.kind === "replay") {
    return { status: decision.status, body: decision.body };
  }
  if (decision.kind === "mismatch") {
    return {
      status: 409,
      body: {
        error:
          "Idempotency-Key was already used with a different request body.",
      },
    };
  }
  return {
    status: 409,
    body: {
      error:
        "A request with this Idempotency-Key is still in progress. Retry shortly.",
    },
  };
}


/* ─── Single-use records ──────────────────────────────────────────────────────
 * A different shape from the claim/replay cycle above. A retried request wants
 * the SAME answer twice; a confirmation must execute exactly ONCE and fail the
 * second time. Both live here so there is one implementation over this table.
 */

/** Writes a payload that may be consumed exactly once. Returns its opaque id. */
export async function storeSingleUse(
  operation: IdempotentOperation,
  payload: unknown,
  requestHash: string,
): Promise<string> {
  const { db, idempotencyKeys } = await store();
  const { randomUUID } = await import("node:crypto");
  const key = randomUUID();

  await db.insert(idempotencyKeys).values({
    key,
    operation,
    requestHash,
    // Null marks it unconsumed — the conditional update below is the lock.
    responseStatus: null,
    responseBody: payload,
  });
  return key;
}

export type ConsumeResult<T> =
  | { ok: true; payload: T }
  | { ok: false; reason: "unknown" | "already_used" };

/**
 * Consumes a single-use record. The conditional UPDATE is the lock: two
 * concurrent confirms race on `responseStatus IS NULL` and exactly one wins,
 * so this is never a read-then-write check that both could pass.
 */
export async function consumeSingleUse<T>(
  operation: IdempotentOperation,
  key: string,
): Promise<ConsumeResult<T>> {
  const { db, idempotencyKeys, scope } = await store();
  const { and, isNull } = await import("drizzle-orm");

  const existing = await db.query.idempotencyKeys.findFirst({
    where: scope(operation, key),
  });
  if (!existing) return { ok: false, reason: "unknown" };

  const [claimed] = await db
    .update(idempotencyKeys)
    .set({ responseStatus: 200 })
    .where(and(scope(operation, key), isNull(idempotencyKeys.responseStatus)))
    .returning({ id: idempotencyKeys.id });

  if (!claimed) return { ok: false, reason: "already_used" };
  return { ok: true, payload: existing.responseBody as T };
}
