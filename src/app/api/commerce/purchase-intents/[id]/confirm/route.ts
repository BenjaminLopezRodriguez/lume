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

  const intent = await db.query.purchaseIntents.findFirst({
    where: eq(purchaseIntents.id, id),
  });
  if (!intent) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const status = intent.status as PurchaseIntentStatus;
  if (!canTransition(status, "confirmed")) {
    return NextResponse.json(
      { error: `Cannot confirm an intent in status "${status}".` },
      { status: 409 },
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
    return NextResponse.json(
      {
        error: "Amount has changed since authorization. Re-authorize required.",
        expected: parsed.data.expectedAmount,
        actual: intent.amount,
      },
      { status: 409 },
    );
  }

  if (intent.requiresHumanConfirmation && !parsed.data.confirmedBy) {
    return NextResponse.json(
      {
        error:
          "This intent requires human confirmation. Supply confirmedBy identifying the person who approved.",
      },
      { status: 403 },
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

  return NextResponse.json({
    id,
    status: "confirmed",
    amount: intent.amount,
    currency: intent.currency,
    confirmed_at: now.toISOString(),
  });
}
