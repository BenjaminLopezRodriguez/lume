import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import {
  businesses,
  purchaseIntents,
  purchaseIntentEvents,
} from "@/server/db/schema";
import { authorizeCommerceRequest } from "@/server/commerce/auth";
import { totalAmount } from "@/server/commerce/purchase-intent";

const lineItem = z.object({
  name: z.string().min(1).max(256),
  quantity: z.number().int().positive().max(999),
  /** Minor units. */
  unitAmount: z.number().int().nonnegative().max(100_000_00),
});

const createSchema = z.object({
  businessId: z.string().uuid(),
  items: z.array(lineItem).min(1).max(100),
  purchaserKind: z.enum(["human", "application", "agent"]).default("human"),
  purchaserRef: z.string().max(256).optional(),
  delegationId: z.string().uuid().optional(),
  currency: z.string().length(3).default("usd"),
  fulfillment: z.record(z.unknown()).optional(),
  /** Minutes until the quote goes stale. */
  expiresInMinutes: z.number().int().positive().max(1440).default(30),
});

/** POST /api/commerce/purchase-intents — create and immediately quote an intent. */
export async function POST(req: Request) {
  const auth = authorizeCommerceRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, input.businessId),
  });
  if (!business) {
    return NextResponse.json({ error: "Unknown merchant." }, { status: 404 });
  }

  const amount = totalAmount(input.items);
  if (amount <= 0) {
    return NextResponse.json(
      { error: "Intent total must be greater than zero." },
      { status: 400 },
    );
  }

  const expiresAt = new Date(Date.now() + input.expiresInMinutes * 60_000);

  const [intent] = await db
    .insert(purchaseIntents)
    .values({
      businessId: input.businessId,
      // Priced on creation, so it lands in `quoted` rather than `draft`.
      status: "quoted",
      purchaserKind: input.purchaserKind,
      purchaserRef: input.purchaserRef ?? null,
      delegationId: input.delegationId ?? null,
      items: input.items,
      amount,
      currency: input.currency,
      fulfillment: input.fulfillment ?? null,
      expiresAt,
    })
    .returning();

  if (!intent) {
    return NextResponse.json(
      { error: "Could not create intent." },
      { status: 500 },
    );
  }

  await db.insert(purchaseIntentEvents).values({
    intentId: intent.id,
    kind: "quote_returned",
    fromStatus: "draft",
    toStatus: "quoted",
    actor: input.purchaserRef ?? input.purchaserKind,
    detail: { amount, currency: input.currency },
  });

  return NextResponse.json(
    {
      id: intent.id,
      status: intent.status,
      merchant: { id: business.id, name: business.name },
      amount,
      currency: intent.currency,
      items: input.items,
      expires_at: expiresAt.toISOString(),
    },
    { status: 201 },
  );
}
