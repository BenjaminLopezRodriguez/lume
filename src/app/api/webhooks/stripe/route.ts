import "server-only";

import Stripe from "stripe";
import { NextResponse } from "next/server";

import { db } from "@/server/db";
import { env } from "@/env";
import { webhookEvents } from "@/server/db/schema";
import { createOwnership } from "@/server/ownership";
import type { AssetType } from "@/server/ownership";

function stripe() {
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(env.STRIPE_SECRET_KEY);
}

async function resolveAsset(
  paymentLinkId: string | null,
  metaType: string | null,
  metaEventId: string | null,
): Promise<{ businessId: string; assetType: AssetType; assetId: string | null } | null> {
  if (!paymentLinkId) return null;

  if (metaType === "product") {
    const product = await db.query.products.findFirst({
      where: (r, { eq }) => eq(r.stripePaymentLinkId, paymentLinkId),
    });
    if (!product) return null;
    return { businessId: product.businessId, assetType: "product", assetId: product.id };
  }

  if (metaType === "invoice") {
    const invoice = await db.query.serviceInvoices.findFirst({
      where: (r, { eq }) => eq(r.stripePaymentLinkId, paymentLinkId),
    });
    if (!invoice) return null;
    return { businessId: invoice.businessId, assetType: "completed_work", assetId: invoice.id };
  }

  if (metaType === "ticket") {
    // event-level link
    const event = await db.query.events.findFirst({
      where: (r, { eq }) => eq(r.stripePaymentLinkId, paymentLinkId),
    });
    if (event) return { businessId: event.businessId, assetType: "attendance", assetId: event.id };

    // per-ticket link — resolve via eventId in metadata
    if (metaEventId) {
      const ev = await db.query.events.findFirst({
        where: (r, { eq }) => eq(r.id, metaEventId),
      });
      if (ev) return { businessId: ev.businessId, assetType: "attendance", assetId: ev.id };
    }
    return null;
  }

  // business-level link (restaurant)
  const business = await db.query.businesses.findFirst({
    where: (r, { eq }) => eq(r.stripePaymentLinkId, paymentLinkId),
  });
  if (!business) return null;
  return { businessId: business.id, assetType: "dining_relationship", assetId: null };
}

export async function POST(request: Request) {
  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const s = stripe();

  // Fail closed. Without a configured secret we cannot prove Stripe sent this,
  // and an unsigned body would let anyone forge a completed checkout.
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(body, sig ?? "", env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Replay safety: the unique index on (provider, eventId) is the boundary, so a
  // redelivered event changes state exactly once. 200 so Stripe stops retrying.
  try {
    await db.insert(webhookEvents).values({
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
    });
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: unknown }).code === "23505"
    ) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw err;
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const resolved = await resolveAsset(
    session.payment_link as string | null,
    session.metadata?.type ?? null,
    session.metadata?.eventId ?? null,
  );

  if (!resolved) {
    return NextResponse.json({ received: true, skipped: "asset not found" });
  }

  await createOwnership({
    businessId: resolved.businessId,
    customerName: session.customer_details?.name ?? "Customer",
    customerEmail: session.customer_details?.email ?? null,
    customerPhone: session.customer_details?.phone ?? null,
    assetType: resolved.assetType,
    assetId: resolved.assetId,
    source: "stripe_checkout",
    sourceRef: session.id,
    purchasedAt: new Date(session.created * 1000),
  });

  return NextResponse.json({ received: true });
}
