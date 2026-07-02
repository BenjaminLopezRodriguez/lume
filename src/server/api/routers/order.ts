import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { orders } from "@/server/db/schema";

export const orderRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        businessId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const business = await ctx.db.query.businesses.findFirst({
        where: (row, { and: andWhere, eq: equals }) =>
          andWhere(
            equals(row.id, input.businessId),
            equals(row.ownerId, ctx.userId),
          ),
      });

      if (!business) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.query.orders.findMany({
        where: (order, { eq: equals }) => equals(order.businessId, input.businessId),
        orderBy: (order, { desc: orderDesc }) => [orderDesc(order.createdAt)],
        limit: input.limit,
      });
    }),

  channelStats: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const business = await ctx.db.query.businesses.findFirst({
        where: (row, { and: andWhere, eq: equals }) =>
          andWhere(
            equals(row.id, input.businessId),
            equals(row.ownerId, ctx.userId),
          ),
      });

      if (!business) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const orderRows = await ctx.db.query.orders.findMany({
        where: (order, { eq: equals }) => equals(order.businessId, input.businessId),
      });

      const counts = orderRows.reduce<Record<string, number>>((acc, order) => {
        acc[order.platform] = (acc[order.platform] ?? 0) + 1;
        return acc;
      }, {});

      return {
        ubereats: counts.ubereats ?? 0,
        doordash: counts.doordash ?? 0,
        grubhub: counts.grubhub ?? 0,
        lume_direct: counts.lume_direct ?? 0,
        total: orderRows.length,
      };
    }),

  salesByDay: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const business = await ctx.db.query.businesses.findFirst({
        where: (row, { and: andWhere, eq: equals }) =>
          andWhere(
            equals(row.id, input.businessId),
            equals(row.ownerId, ctx.userId),
          ),
      });

      if (!business) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const orderRows = await ctx.db.query.orders.findMany({
        where: (order, { eq: equals }) => equals(order.businessId, input.businessId),
        orderBy: (order, { desc: orderDesc }) => [orderDesc(order.createdAt)],
      });

      const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
      const totals = new Array(7).fill(0) as number[];

      for (const order of orderRows) {
        const day = order.createdAt.getDay();
        totals[day] = (totals[day] ?? 0) + order.totalCents / 100;
      }

      const orderedDays = [1, 2, 3, 4, 5, 6, 0];

      return orderedDays.map((dayIndex) => ({
        label: dayLabels[dayIndex] ?? "—",
        value: Math.round(totals[dayIndex] ?? 0),
      }));
    }),
});
