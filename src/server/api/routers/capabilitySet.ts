import "server-only";

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { customCapabilitySets } from "@/server/db/schema";

export const capabilitySetRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(256),
        capabilities: z.array(z.string()).min(1),
        businessId: z.string().uuid().optional(), // undefined = global
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.businessId) {
        // Verify ownership
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
