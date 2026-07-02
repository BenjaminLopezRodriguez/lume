import "server-only";

import Stripe from "stripe";

import { env } from "@/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function createBusinessPaymentLink(businessName: string) {
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Order from ${businessName}`,
          },
          unit_amount: 1000,
        },
        quantity: 1,
        adjustable_quantity: { enabled: true, minimum: 1, maximum: 99 },
      },
    ],
    metadata: {
      businessName,
    },
  });

  return paymentLink;
}
