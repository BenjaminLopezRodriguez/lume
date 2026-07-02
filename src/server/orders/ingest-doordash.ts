import { db } from "@/server/db";
import { integrations, orders } from "@/server/db/schema";

type DoorDashWebhookPayload = {
  event_type: "order.created";
  external_location_id: string;
  order: {
    id: string;
    label: string;
    total_cents: number;
    status: string;
  };
};

export async function ingestDoorDashOrder(payload: DoorDashWebhookPayload) {
  const integration = await db.query.integrations.findFirst({
    where: (row, { and: andWhere, eq: equals }) =>
      andWhere(
        equals(row.platform, "doordash"),
        equals(row.externalLocationId, payload.external_location_id),
      ),
  });

  if (!integration) {
    return { ok: false as const, status: 404, error: "Integration not found" };
  }

  const [order] = await db
    .insert(orders)
    .values({
      businessId: integration.businessId,
      platform: "doordash",
      externalId: payload.order.id,
      label: payload.order.label,
      totalCents: payload.order.total_cents,
      status: payload.order.status,
    })
    .onConflictDoNothing({
      target: [orders.businessId, orders.platform, orders.externalId],
    })
    .returning();

  return {
    ok: true as const,
    orderId: order?.id ?? null,
  };
}
