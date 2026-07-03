import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { accountGroups, businesses } from "@/server/db/schema";

export const accountGroupRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(256), description: z.string().max(512).optional() }))
    .mutation(async ({ ctx, input }) => {
      const [group] = await ctx.db
        .insert(accountGroups)
        .values({ ownerId: ctx.userId, name: input.name, description: input.description ?? null, updatedAt: new Date() })
        .returning();
      return group!;
    }),

  list: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.query.accountGroups.findMany({
        where: (r, { eq: eqOp }) => eqOp(r.ownerId, ctx.userId),
        orderBy: (r, { asc }) => asc(r.createdAt),
      });
    }),

  attachBusiness: protectedProcedure
    .input(z.object({ groupId: z.string().uuid(), businessId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify both group and business belong to this user
      const group = await ctx.db.query.accountGroups.findFirst({
        where: (r, { and, eq: eqOp }) => and(eqOp(r.id, input.groupId), eqOp(r.ownerId, ctx.userId)),
      });
      if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });

      const business = await ctx.db.query.businesses.findFirst({
        where: (r, { and, eq: eqOp }) => and(eqOp(r.id, input.businessId), eqOp(r.ownerId, ctx.userId)),
      });
      if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });

      await ctx.db
        .update(businesses)
        .set({ groupId: input.groupId, updatedAt: new Date() })
        .where(eq(businesses.id, input.businessId));
    }),
});
