import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { purchaseIntents, purchaseIntentEvents } from "@/server/db/schema";
import { authorizeCommerceRequest } from "@/server/commerce/auth";
import {
  canTransition,
  type PurchaseIntentStatus,
} from "@/server/commerce/purchase-intent";
import {
  claimIdempotencyKey,
  hashRequest,
  idempotentResponse,
  readIdempotencyKey,
  recordIdempotentResponse,
  releaseIdempotencyKey,
} from "@/server/commerce/idempotency";

const OPERATION = "purchase_intent.confirm" as const;

const confirmSchema = z.object({
  /** Identifier of the human confirming. Required when policy demanded one. */
  confirmedBy: z.string().max(256).optional(),
  /** Guards against confirming a price other than the one authorized. */
  expectedAmount: z.number().int().nonnegative().optional(),
});

/**
 * POST /api/commerce/purchase-intents/:id/confirm
 *
 * An agent asserting prior consent never satisfies a confirmation requirement —
 * `confirmedBy` must be present when policy demanded a human.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authorizeCommerceRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const now = new Date();

  let body: unknown = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Retries must never confirm twice. The intent id is part of the hash, so one
  // key reused against a different intent is a mismatch, not a replay.
  const idemKey = readIdempotencyKey(req);
  if (idemKey) {
    const claim = await claimIdempotencyKey(
      OPERATION,
      idemKey,
      hashRequest({ id, ...parsed.data }),
    );
    if (claim.kind !== "proceed") {
      const replay = idempotentResponse(claim);
      return NextResponse.json(replay.body, { status: replay.status });
    }
  }

  /** Stores the response under the key, then returns it. */
  const respond = async (payload: unknown, status: number) => {
    if (idemKey) {
      if (status >= 200 && status < 300) {
        await recordIdempotentResponse(OPERATION, idemKey, status, payload);
      } else {
        await releaseIdempotencyKey(OPERATION, idemKey);
      }
    }
    return NextResponse.json(payload, { status });
  };

  const intent = await db.query.purchaseIntents.findFirst({
    where: eq(purchaseIntents.id, id),
  });
  if (!intent) {
    return respond({ error: "Not found." }, 404);
  }

  const status = intent.status as PurchaseIntentStatus;
  if (!canTransition(status, "confirmed")) {
    return respond(
      { error: `Cannot confirm an intent in status "${status}".` },
      409,
    );
  }

  // The core guarantee: authorized $58 must never become a paid $92.
  if (
    parsed.data.expectedAmount !== undefined &&
    parsed.data.expectedAmount !== intent.amount
  ) {
    await db.insert(purchaseIntentEvents).values({
      intentId: id,
      kind: "amount_mismatch_rejected",
      fromStatus: status,
      toStatus: status,
      actor: parsed.data.confirmedBy ?? "unknown",
      detail: { expected: parsed.data.expectedAmount, actual: intent.amount },
    });
    return respond(
      {
        error: "Amount has changed since authorization. Re-authorize required.",
        expected: parsed.data.expectedAmount,
        actual: intent.amount,
      },
      409,
    );
  }

  if (intent.requiresHumanConfirmation && !parsed.data.confirmedBy) {
    return respond(
      {
        error:
          "This intent requires human confirmation. Supply confirmedBy identifying the person who approved.",
      },
      403,
    );
  }

  await db
    .update(purchaseIntents)
    .set({ status: "confirmed", confirmedAt: now, updatedAt: now })
    .where(eq(purchaseIntents.id, id));

  await db.insert(purchaseIntentEvents).values({
    intentId: id,
    kind: intent.requiresHumanConfirmation
      ? "human_confirmed"
      : "auto_confirmed",
    fromStatus: status,
    toStatus: "confirmed",
    actor: parsed.data.confirmedBy ?? intent.purchaserKind,
    detail: { amount: intent.amount, currency: intent.currency },
  });

  return respond(
    {
      id,
      status: "confirmed",
      amount: intent.amount,
      currency: intent.currency,
      confirmed_at: now.toISOString(),
    },
    200,
  );
}
