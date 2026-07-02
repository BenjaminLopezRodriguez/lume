import "server-only";

import { db } from "@/server/db";
import { ownershipEvents, ownerships } from "@/server/db/schema";
import { OWNERSHIP_EVENT } from "./ownership.events";
import { canTransition } from "./ownership.lifecycle";
import * as repo from "./ownership.repository";
import type { CreateOwnershipInput, OwnershipStatus } from "./ownership.types";

export async function createOwnership(input: CreateOwnershipInput) {
  return db.transaction(async (tx) => {
    const [ownership] = await tx
      .insert(ownerships)
      .values({
        businessId: input.businessId,
        customerName: input.customerName,
        customerEmail: input.customerEmail ?? null,
        customerPhone: input.customerPhone ?? null,
        assetType: input.assetType,
        assetId: input.assetId ?? null,
        status: "active",
        source: input.source,
        sourceRef: input.sourceRef ?? null,
        purchasedAt: input.purchasedAt ?? new Date(),
      })
      .returning();

    await tx.insert(ownershipEvents).values({
      ownershipId: ownership!.id,
      type: OWNERSHIP_EVENT.PURCHASE,
      payload: {
        source: input.source,
        sourceRef: input.sourceRef ?? null,
        assetType: input.assetType,
        assetId: input.assetId ?? null,
      },
    });

    return ownership!;
  });
}

export async function appendEvent(
  ownershipId: string,
  type: string,
  payload?: Record<string, unknown> | null,
) {
  return repo.appendEvent(ownershipId, type, payload);
}

export async function transitionStatus(ownershipId: string, newStatus: OwnershipStatus) {
  const ownership = await db.query.ownerships.findFirst({
    where: (row, { eq }) => eq(row.id, ownershipId),
  });
  if (!ownership) throw new Error(`Ownership ${ownershipId} not found`);
  if (!canTransition(ownership.status as OwnershipStatus, newStatus)) {
    throw new Error(`Cannot transition ${ownership.status} → ${newStatus}`);
  }
  const updated = await repo.updateStatus(ownershipId, newStatus);
  await repo.appendEvent(ownershipId, `status_changed_to_${newStatus}`);
  return updated;
}

export { listByBusiness, findById } from "./ownership.repository";
