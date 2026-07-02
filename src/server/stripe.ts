import "server-only";

import Stripe from "stripe";

import { env } from "@/env";

let stripeClient: Stripe | null = null;

function getStripe() {
  if (!stripeClient) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

type LineItemInput = {
  label: string;
  amountCents: number;
  quantity?: number;
};

async function createPaymentLinkFromLineItems(
  title: string,
  lineItems: LineItemInput[],
  metadata: Record<string, string>,
) {
  const stripe = getStripe();
  const paymentLink = await stripe.paymentLinks.create({
    line_items: lineItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.label },
        unit_amount: item.amountCents,
      },
      quantity: item.quantity ?? 1,
    })),
    metadata: { title, ...metadata },
  });
  return paymentLink;
}

export async function createBusinessPaymentLink(businessName: string) {
  return createPaymentLinkFromLineItems(
    businessName,
    [{ label: `Order from ${businessName}`, amountCents: 1000, quantity: 1 }],
    { businessName },
  );
}

export async function createProductPaymentLink(
  productName: string,
  priceCents: number,
  metadata: Record<string, string>,
) {
  return createPaymentLinkFromLineItems(
    productName,
    [{ label: productName, amountCents: priceCents, quantity: 1 }],
    { type: "product", ...metadata },
  );
}

export async function createInvoicePaymentLink(
  jobTitle: string,
  lineItems: LineItemInput[],
  metadata: Record<string, string>,
) {
  return createPaymentLinkFromLineItems(jobTitle, lineItems, {
    type: "invoice",
    ...metadata,
  });
}

export async function createTicketPaymentLink(
  eventName: string,
  tierName: string,
  priceCents: number,
  quantity: number,
  metadata: Record<string, string>,
) {
  return createPaymentLinkFromLineItems(
    `${eventName} — ${tierName}`,
    [{ label: `${tierName} ticket`, amountCents: priceCents, quantity }],
    { type: "ticket", ...metadata },
  );
}

export function generateCheckInCode() {
  return `LUME-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function slugifyStorefront(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "store"}-${suffix}`;
}
