// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: listForBusiness + addToAccount (merge caps into one set per account).
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { assertBusinessOwner } from "@/server/api/lib/assert-business-owner";
import { resolveAccountCapabilities } from "@/server/capabilities/resolve-account";
import { customCapabilitySets } from "@/server/db/schema";
import { CAPABILITIES } from "@/verticals/capabilities";

const capabilitySchema = z.enum(CAPABILITIES);

export const capabilitySetRouter = createTRPCRouter({
  listForBusiness: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);
      return resolveAccountCapabilities(ctx.db, input.businessId);
    }),

  addToAccount: protectedProcedure
    .input(
      z.object({
        businessId: z.string().uuid(),
        capability: capabilitySchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);

      const existing = await ctx.db.query.customCapabilitySets.findFirst({
        where: (row, { eq: equals }) => equals(row.businessId, input.businessId),
      });

      if (existing) {
        if (existing.capabilities.includes(input.capability)) {
          return existing;
        }

        const [updated] = await ctx.db
          .update(customCapabilitySets)
          .set({
            capabilities: [...existing.capabilities, input.capability],
            updatedAt: new Date(),
          })
          .where(eq(customCapabilitySets.id, existing.id))
          .returning();

        return updated!;
      }

      const [created] = await ctx.db
        .insert(customCapabilitySets)
        .values({
          ownerId: ctx.userId,
          businessId: input.businessId,
          name: "Account capabilities",
          capabilities: [input.capability],
          updatedAt: new Date(),
        })
        .returning();

      return created!;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(256),
        capabilities: z.array(z.string()).min(1),
        businessId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.businessId) {
        const business = await ctx.db.query.businesses.findFirst({
          where: (r, { and, eq: eqOp }) =>
            and(eqOp(r.id, input.businessId!), eqOp(r.ownerId, ctx.userId)),
        });
        if (!business) throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [set] = await ctx.db
        .insert(customCapabilitySets)
        .values({
          ownerId: ctx.userId,
          name: input.name,
          capabilities: input.capabilities,
          businessId: input.businessId ?? null,
          updatedAt: new Date(),
        })
        .returning();

      return set!;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.customCapabilitySets.findMany({
      where: (r, { eq: eqOp }) => eqOp(r.ownerId, ctx.userId),
      orderBy: (r, { desc }) => desc(r.createdAt),
    });
  }),
});
