import { z } from "zod";

import { assertBusinessOwner } from "@/server/api/lib/assert-business-owner";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { listByBusiness } from "@/server/ownership";

export const ownershipRouter = createTRPCRouter({
  listByBusiness: protectedProcedure
    .input(
      z.object({
        businessId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);
      return listByBusiness(input.businessId, input.limit);
    }),
});
