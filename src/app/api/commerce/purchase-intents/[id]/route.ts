import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";

import { db } from "@/server/db";
import { purchaseIntents, purchaseIntentEvents } from "@/server/db/schema";
import { authorizeCommerceRequest } from "@/server/commerce/auth";

/**
 * GET /api/commerce/purchase-intents/:id
 * Returns the intent plus its full audit timeline — who asked, who authorized,
 * under what limit. Normal payment platforms record money movement; this records
 * commercial intent, authorization, and execution.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authorizeCommerceRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  const intent = await db.query.purchaseIntents.findFirst({
    where: eq(purchaseIntents.id, id),
  });
  if (!intent) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const events = await db
    .select()
    .from(purchaseIntentEvents)
    .where(eq(purchaseIntentEvents.intentId, id))
    .orderBy(asc(purchaseIntentEvents.createdAt));

  return NextResponse.json({
    id: intent.id,
    status: intent.status,
    amount: intent.amount,
    currency: intent.currency,
    items: intent.items,
    purchaser: { kind: intent.purchaserKind, ref: intent.purchaserRef },
    policy_reason: intent.policyReason,
    requires_human_confirmation: intent.requiresHumanConfirmation,
    authorized_at: intent.authorizedAt?.toISOString() ?? null,
    confirmed_at: intent.confirmedAt?.toISOString() ?? null,
    expires_at: intent.expiresAt?.toISOString() ?? null,
    timeline: events.map((e) => ({
      at: e.createdAt.toISOString(),
      kind: e.kind,
      from: e.fromStatus,
      to: e.toStatus,
      actor: e.actor,
      detail: e.detail,
    })),
  });
}
