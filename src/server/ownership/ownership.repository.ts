import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { ownershipEvents, ownerships } from "@/server/db/schema";
import type { OwnershipStatus } from "./ownership.types";

export async function listByBusiness(businessId: string, limit = 20) {
  return db.query.ownerships.findMany({
    where: (row, { eq: equals }) => equals(row.businessId, businessId),
    orderBy: (row, { desc: orderDesc }) => [orderDesc(row.createdAt)],
    limit,
  });
}

export async function findById(ownershipId: string) {
  return db.query.ownerships.findFirst({
    where: (row, { eq: equals }) => equals(row.id, ownershipId),
    with: { events: { orderBy: (e, { asc }) => [asc(e.createdAt)] } },
  });
}

export async function appendEvent(
  ownershipId: string,
  type: string,
  payload?: Record<string, unknown> | null,
) {
  const [event] = await db
    .insert(ownershipEvents)
    .values({ ownershipId, type, payload: payload ?? null })
    .returning();
  return event!;
}

export async function updateStatus(ownershipId: string, status: OwnershipStatus) {
  const now = new Date();
  const [updated] = await db
    .update(ownerships)
    .set({
      status,
      updatedAt: now,
      ...(status === "transferred" ? { transferredAt: now } : {}),
      ...(status === "completed" ? { completedAt: now } : {}),
    })
    .where(eq(ownerships.id, ownershipId))
    .returning();
  return updated ?? null;
}
