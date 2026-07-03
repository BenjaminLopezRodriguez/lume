// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: Menu router (get with ensureMenu + default items).
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { assertBusinessOwner } from "@/server/api/lib/assert-business-owner";
import { ensureMenu } from "@/server/menu/ensure-menu";

export const menuRouter = createTRPCRouter({
  get: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const business = await assertBusinessOwner(
        ctx.db,
        input.businessId,
        ctx.userId,
      );
      return ensureMenu(ctx.db, business.id, business.name);
    }),
});
