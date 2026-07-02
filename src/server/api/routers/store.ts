import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { assertBusinessOwner } from "@/server/api/lib/assert-business-owner";
import { products, storefronts } from "@/server/db/schema";
import { createProductPaymentLink, slugifyStorefront } from "@/server/stripe";

export const storeRouter = createTRPCRouter({
  getStorefront: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);
      const storefront = await ctx.db.query.storefronts.findFirst({
        where: (row, { eq: equals }) => equals(row.businessId, input.businessId),
        with: { products: true },
      });
      return storefront ?? null;
    }),

  ensureStorefront: protectedProcedure
    .input(z.object({ businessId: z.string().uuid(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const business = await assertBusinessOwner(
        ctx.db,
        input.businessId,
        ctx.userId,
      );

      const existing = await ctx.db.query.storefronts.findFirst({
        where: (row, { eq: equals }) => equals(row.businessId, input.businessId),
      });
      if (existing) return existing;

      const [storefront] = await ctx.db
        .insert(storefronts)
        .values({
          businessId: input.businessId,
          slug: slugifyStorefront(business.name),
          name: input.name,
        })
        .returning();

      if (!storefront) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return storefront;
    }),

  listProducts: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);
      return ctx.db.query.products.findMany({
        where: (row, { eq: equals }) => equals(row.businessId, input.businessId),
        orderBy: (row, { desc: orderDesc }) => [orderDesc(row.createdAt)],
      });
    }),

  createProduct: protectedProcedure
    .input(
      z.object({
        businessId: z.string().uuid(),
        name: z.string().min(1),
        description: z.string().optional(),
        priceCents: z.number().int().positive(),
        inventory: z.number().int().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);

      const storefront = await ctx.db.query.storefronts.findFirst({
        where: (row, { eq: equals }) => equals(row.businessId, input.businessId),
      });

      const paymentLink = await createProductPaymentLink(
        input.name,
        input.priceCents,
        { businessId: input.businessId },
      );

      const [product] = await ctx.db
        .insert(products)
        .values({
          businessId: input.businessId,
          storefrontId: storefront?.id ?? null,
          name: input.name,
          description: input.description ?? null,
          priceCents: input.priceCents,
          inventory: input.inventory,
          stripePaymentLinkUrl: paymentLink.url,
          stripePaymentLinkId: paymentLink.id,
        })
        .returning();

      if (!product) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return product;
    }),
});
