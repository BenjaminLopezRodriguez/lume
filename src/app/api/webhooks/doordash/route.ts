import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/env";
import { ingestDoorDashOrder } from "@/server/orders/ingest-doordash";

const doorDashWebhookSchema = z.object({
  event_type: z.literal("order.created"),
  external_location_id: z.string(),
  order: z.object({
    id: z.string(),
    label: z.string(),
    total_cents: z.number().int().positive(),
    status: z.string().default("new"),
  }),
});

function verifySignature(body: string, signature: string | null) {
  if (!env.DOORDASH_WEBHOOK_SECRET) return true;
  if (!signature) return false;

  const expected = createHmac("sha256", env.DOORDASH_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-doordash-signature");

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: z.infer<typeof doorDashWebhookSchema>;
  try {
    payload = doorDashWebhookSchema.parse(JSON.parse(body));
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await ingestDoorDashOrder(payload);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ received: true, orderId: result.orderId });
}
