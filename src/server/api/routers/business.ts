import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { createBusinessPaymentLink } from "@/server/stripe";
import { businesses, businessLocations } from "@/server/db/schema";

const businessTypeSchema = z.enum(["store", "restaurant", "event"]);

const createBusinessInput = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("store"),
    name: z.string().min(1),
    description: z.string().optional(),
  }),
  z.object({
    type: z.literal("restaurant"),
    name: z.string().min(1),
    cuisine: z.string().optional(),
    address: z.string().optional(),
  }),
  z.object({
    type: z.literal("event"),
    name: z.string().min(1),
    date: z.string().optional(),
    location: z.string().optional(),
    capacity: z.coerce.number().int().positive().optional(),
  }),
]);

export const businessRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.businesses.findMany({
      where: (business, { eq: equals }) => equals(business.ownerId, ctx.userId),
      orderBy: (business, { desc: orderDesc }) => [orderDesc(business.updatedAt)],
    });
  }),

  getActive: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.businesses.findFirst({
      where: (business, { eq: equals }) => equals(business.ownerId, ctx.userId),
      orderBy: (business, { desc: orderDesc }) => [orderDesc(business.updatedAt)],
    });
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
          type: input.type,
          name: input.name,
          description: input.type === "store" ? input.description ?? null : null,
          cuisine: input.type === "restaurant" ? input.cuisine ?? null : null,
          address: input.type === "restaurant" ? input.address ?? null : null,
          eventDate: input.type === "event" && input.date ? input.date : null,
          location: input.type === "event" ? input.location ?? null : null,
          capacity: input.type === "event" ? input.capacity ?? null : null,
          stripePaymentLinkUrl: paymentLink.url,
          stripePaymentLinkId: paymentLink.id,
        })
        .returning();

      if (!business) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      if (input.type === "restaurant" && input.address) {
        await ctx.db.insert(businessLocations).values({
          businessId: business.id,
          name: input.name,
          address: input.address,
        });
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
});
