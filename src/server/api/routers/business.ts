import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { createBusinessPaymentLink } from "@/server/stripe";
import { businesses } from "@/server/db/schema";

const createBusinessInput = z.object({
  name: z.string().min(1),
});

export const businessRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.businesses.findMany({
      where: (business, { eq: equals }) => equals(business.ownerId, ctx.userId),
      orderBy: (business, { desc: orderDesc }) => [orderDesc(business.updatedAt)],
    });
  }),

  getActive: protectedProcedure.query(async ({ ctx }) => {
    const business = await ctx.db.query.businesses.findFirst({
      where: (business, { eq: equals }) => equals(business.ownerId, ctx.userId),
      orderBy: (business, { desc: orderDesc }) => [orderDesc(business.updatedAt)],
    });
    return business ?? null;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const business = await ctx.db.query.businesses.findFirst({
        where: (row, { and: andWhere, eq: equals }) =>
          andWhere(equals(row.id, input.id), equals(row.ownerId, ctx.userId)),
      });

      if (!business) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return business;
    }),

  create: protectedProcedure
    .input(createBusinessInput)
    .mutation(async ({ ctx, input }) => {
      const paymentLink = await createBusinessPaymentLink(input.name);

      const [business] = await ctx.db
        .insert(businesses)
        .values({
          ownerId: ctx.userId,
          type: "account",
          name: input.name,
          stripePaymentLinkUrl: paymentLink.url,
          stripePaymentLinkId: paymentLink.id,
        })
        .returning();

      if (!business) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      return business;
    }),

  setActive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const business = await ctx.db.query.businesses.findFirst({
        where: (row, { and: andWhere, eq: equals }) =>
          andWhere(equals(row.id, input.id), equals(row.ownerId, ctx.userId)),
      });

      if (!business) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [updated] = await ctx.db
        .update(businesses)
        .set({ updatedAt: new Date() })
        .where(eq(businesses.id, input.id))
        .returning();

      return updated;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), name: z.string().min(1).max(256) }))
    .mutation(async ({ ctx, input }) => {
      const business = await ctx.db.query.businesses.findFirst({
        where: (r, { and, eq: equals }) =>
          and(equals(r.id, input.id), equals(r.ownerId, ctx.userId)),
      });
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });

      const [updated] = await ctx.db
        .update(businesses)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(businesses.id, input.id))
        .returning();
      return updated!;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const business = await ctx.db.query.businesses.findFirst({
        where: (r, { and, eq: equals }) =>
          and(equals(r.id, input.id), equals(r.ownerId, ctx.userId)),
      });
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.delete(businesses).where(eq(businesses.id, input.id));
    }),
});
