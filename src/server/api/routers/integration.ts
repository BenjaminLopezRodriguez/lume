import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { integrations } from "@/server/db/schema";

const platformSchema = z.enum(["ubereats", "doordash", "grubhub"]);

export const integrationRouter = createTRPCRouter({
  list: protectedProcedure
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

      return ctx.db.query.integrations.findMany({
        where: (row, { eq: equals }) => equals(row.businessId, input.businessId),
      });
    }),

  connect: protectedProcedure
    .input(
      z.object({
        businessId: z.string().uuid(),
        platform: platformSchema,
        externalLocationId: z.string().min(1),
        externalLocationName: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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

      const [integration] = await ctx.db
        .insert(integrations)
        .values({
          businessId: input.businessId,
          platform: input.platform,
          externalLocationId: input.externalLocationId,
          externalLocationName: input.externalLocationName,
          status: "connected",
        })
        .onConflictDoUpdate({
          target: [integrations.businessId, integrations.platform],
          set: {
            externalLocationId: input.externalLocationId,
            externalLocationName: input.externalLocationName,
            status: "connected",
            connectedAt: new Date(),
          },
        })
        .returning();

      return integration;
    }),
});
