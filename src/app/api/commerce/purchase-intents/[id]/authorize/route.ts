import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import {
  delegations,
  purchaseIntents,
  purchaseIntentEvents,
} from "@/server/db/schema";
import { authorizeCommerceRequest } from "@/server/commerce/auth";
import {
  canTransition,
  evaluatePolicy,
  type PurchaseIntentStatus,
} from "@/server/commerce/purchase-intent";

/**
 * POST /api/commerce/purchase-intents/:id/authorize
 *
 * Evaluates the delegation policy and records the decision. Records
 * authorization only — payment execution is deliberately a follow-up so the
 * state machine can be verified in isolation.
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

  const intent = await db.query.purchaseIntents.findFirst({
    where: eq(purchaseIntents.id, id),
  });
  if (!intent) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const status = intent.status as PurchaseIntentStatus;

  // Expiry is checked before the transition so a stale quote can never be
  // authorized at a price the merchant no longer offers.
  if (intent.expiresAt && intent.expiresAt <= now) {
    if (status !== "expired") {
      await db
        .update(purchaseIntents)
        .set({ status: "expired", updatedAt: now })
        .where(eq(purchaseIntents.id, id));
      await db.insert(purchaseIntentEvents).values({
        intentId: id,
        kind: "quote_expired",
        fromStatus: status,
        toStatus: "expired",
        actor: "system",
      });
    }
    return NextResponse.json({ error: "Quote expired." }, { status: 409 });
  }

  if (!canTransition(status, "authorized")) {
    return NextResponse.json(
      { error: `Cannot authorize an intent in status "${status}".` },
      { status: 409 },
    );
  }

  const delegation = intent.delegationId
    ? ((await db.query.delegations.findFirst({
        where: eq(delegations.id, intent.delegationId),
      })) ?? null)
    : null;

  const decision = evaluatePolicy({
    amount: intent.amount ?? 0,
    category: null,
    delegation: delegation
      ? {
          agent: delegation.agent,
          maxTransaction: delegation.maxTransaction,
          requiresConfirmationAbove: delegation.requiresConfirmationAbove,
          categories: delegation.categories ?? null,
          expiresAt: delegation.expiresAt,
          revokedAt: delegation.revokedAt,
        }
      : null,
    now,
  });

  await db.insert(purchaseIntentEvents).values({
    intentId: id,
    kind: "policy_evaluated",
    fromStatus: status,
    toStatus: decision.allowed ? "authorized" : "declined",
    actor: delegation?.agent ?? intent.purchaserRef ?? intent.purchaserKind,
    detail: {
      allowed: decision.allowed,
      reason: decision.reason,
      requires_human_confirmation: decision.requiresHumanConfirmation,
      amount: intent.amount,
    },
  });

  if (!decision.allowed) {
    await db
      .update(purchaseIntents)
      .set({ status: "declined", policyReason: decision.reason, updatedAt: now })
      .where(eq(purchaseIntents.id, id));

    return NextResponse.json(
      { id, status: "declined", reason: decision.reason },
      { status: 403 },
    );
  }

  await db
    .update(purchaseIntents)
    .set({
      status: "authorized",
      policyReason: decision.reason,
      requiresHumanConfirmation: decision.requiresHumanConfirmation,
      authorizedAt: now,
      updatedAt: now,
    })
    .where(eq(purchaseIntents.id, id));

  return NextResponse.json({
    id,
    status: "authorized",
    reason: decision.reason,
    requires_human_confirmation: decision.requiresHumanConfirmation,
    amount: intent.amount,
    currency: intent.currency,
  });
}
