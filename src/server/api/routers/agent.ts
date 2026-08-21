import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { assertBusinessOwner } from "@/server/api/lib/assert-business-owner";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  delegations,
  purchaseIntentEvents,
  purchaseIntents,
} from "@/server/db/schema";

/**
 * Read-only view of agent commerce for one business.
 *
 * `delegations` are owned by the *buyer*, not the merchant — there is no
 * per-business agent policy column in the schema today, so nothing here writes.
 * Everything returned is real rows or an empty list.
 */
export const agentRouter = createTRPCRouter({
  /** Delegations that have actually been used to buy from this business. */
  policy: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);

      const intents = await ctx.db
        .select({
          id: purchaseIntents.id,
          status: purchaseIntents.status,
          purchaserKind: purchaseIntents.purchaserKind,
          delegationId: purchaseIntents.delegationId,
          requiresHumanConfirmation: purchaseIntents.requiresHumanConfirmation,
        })
        .from(purchaseIntents)
        .where(eq(purchaseIntents.businessId, input.businessId));

      const delegationIds = [
        ...new Set(
          intents
            .map((i) => i.delegationId)
            .filter((id): id is string => id !== null),
        ),
      ];

      const rows = delegationIds.length
        ? await ctx.db
            .select({
              id: delegations.id,
              agent: delegations.agent,
              maxTransaction: delegations.maxTransaction,
              requiresConfirmationAbove: delegations.requiresConfirmationAbove,
              categories: delegations.categories,
              expiresAt: delegations.expiresAt,
              revokedAt: delegations.revokedAt,
            })
            .from(delegations)
            .where(inArray(delegations.id, delegationIds))
        : [];

      return {
        delegations: rows,
        agentIntentCount: intents.filter((i) => i.purchaserKind !== "human")
          .length,
        awaitingConfirmationCount: intents.filter(
          (i) => i.requiresHumanConfirmation && i.status === "authorized",
        ).length,
      };
    }),

  /** Append-only audit events for this business's purchase intents. */
  activity: protectedProcedure
    .input(
      z.object({
        businessId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);

      return ctx.db
        .select({
          id: purchaseIntentEvents.id,
          intentId: purchaseIntentEvents.intentId,
          kind: purchaseIntentEvents.kind,
          fromStatus: purchaseIntentEvents.fromStatus,
          toStatus: purchaseIntentEvents.toStatus,
          actor: purchaseIntentEvents.actor,
          createdAt: purchaseIntentEvents.createdAt,
          amount: purchaseIntents.amount,
          currency: purchaseIntents.currency,
          policyReason: purchaseIntents.policyReason,
          purchaserKind: purchaseIntents.purchaserKind,
        })
        .from(purchaseIntentEvents)
        .innerJoin(
          purchaseIntents,
          eq(purchaseIntentEvents.intentId, purchaseIntents.id),
        )
        .where(eq(purchaseIntents.businessId, input.businessId))
        .orderBy(desc(purchaseIntentEvents.createdAt))
        .limit(input.limit);
    }),
});
