// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: QR router (list/create/remove, web targets, account-scoped capabilities via resolveAccountCapabilities).
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import {
  getAvailableQrCapabilities,
  QR_CAPABILITY_IDS,
  type QrCapabilityId,
} from "@/lib/qr-capabilities";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { assertBusinessOwner } from "@/server/api/lib/assert-business-owner";
import { resolveAccountCapabilities } from "@/server/capabilities/resolve-account";
import {
  events,
  qrCodes,
  storefronts,
  webPresences,
} from "@/server/db/schema";
import { ensureMenu, uniqueSlug } from "@/server/menu/ensure-menu";

const qrCapabilitySchema = z.enum(QR_CAPABILITY_IDS);

const createQrSchema = z.object({
  businessId: z.string().uuid(),
  capability: qrCapabilitySchema,
  label: z.string().min(1).max(128),
  config: z
    .object({
      useCustomDomain: z.boolean().optional(),
      tableLabel: z.string().max(64).optional(),
    })
    .optional(),
});

async function ensureWebPresence(
  database: Parameters<typeof assertBusinessOwner>[0],
  businessId: string,
  businessName: string,
) {
  const existing = await database.query.webPresences.findFirst({
    where: (row, { eq: equals }) => equals(row.businessId, businessId),
  });
  if (existing) return existing;

  const slug = await uniqueSlug(database, "webPresences", businessName);
  const [created] = await database
    .insert(webPresences)
    .values({ businessId, slug })
    .returning();

  if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  return created;
}

type ResolveInput = {
  capability: QrCapabilityId;
  config?: { useCustomDomain?: boolean; tableLabel?: string };
  origin: string;
};

async function resolveTargetUrl(
  database: Parameters<typeof assertBusinessOwner>[0],
  business: Awaited<ReturnType<typeof assertBusinessOwner>>,
  input: ResolveInput,
) {
  const { capability, config, origin } = input;

  switch (capability) {
    case "menu": {
      const menu = await ensureMenu(database, business.id, business.name);
      const params = new URLSearchParams();
      if (config?.tableLabel?.trim()) {
        params.set("table", config.tableLabel.trim());
      }
      const query = params.toString();
      return `${origin}/menu/${menu.slug}${query ? `?${query}` : ""}`;
    }
    case "web": {
      const presence = await ensureWebPresence(database, business.id, business.name);
      if (
        config?.useCustomDomain &&
        presence.customDomain &&
        presence.domainStatus === "active"
      ) {
        return `https://${presence.customDomain}`;
      }
      return `${origin}/w/${presence.slug}`;
    }
    case "checkout": {
      if (!business.stripePaymentLinkUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Set up checkout before creating this QR code",
        });
      }
      return business.stripePaymentLinkUrl;
    }
    case "storefront": {
      const storefront = await database.query.storefronts.findFirst({
        where: (row, { eq: equals }) => equals(row.businessId, business.id),
      });
      if (!storefront) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Create a storefront before generating this QR code",
        });
      }
      return `${origin}/s/${storefront.slug}`;
    }
    case "tickets": {
      const event = await database.query.events.findFirst({
        where: (row, { eq: equals }) => equals(row.businessId, business.id),
        orderBy: [desc(events.createdAt)],
      });
      const url = event?.stripePaymentLinkUrl ?? business.stripePaymentLinkUrl;
      if (!url) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Set up ticket checkout before creating this QR code",
        });
      }
      return url;
    }
    default:
      throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown capability" });
  }
}

export const qrRouter = createTRPCRouter({
  listCapabilities: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);
      const accountCaps = await resolveAccountCapabilities(ctx.db, input.businessId);
      return getAvailableQrCapabilities(accountCaps);
    }),

  list: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);
      return ctx.db.query.qrCodes.findMany({
        where: (row, { eq: equals }) => equals(row.businessId, input.businessId),
        orderBy: [desc(qrCodes.createdAt)],
      });
    }),

  getWebTargets: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const business = await assertBusinessOwner(
        ctx.db,
        input.businessId,
        ctx.userId,
      );
      const presence = await ensureWebPresence(ctx.db, business.id, business.name);
      const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.onlume.co";

      const targets: Array<{
        id: "lume" | "custom";
        label: string;
        url: string;
      }> = [
        {
          id: "lume",
          label: "Lume site",
          url: `${origin}/w/${presence.slug}`,
        },
      ];

      if (presence.customDomain && presence.domainStatus === "active") {
        targets.push({
          id: "custom",
          label: presence.customDomain,
          url: `https://${presence.customDomain}`,
        });
      }

      return targets;
    }),

  create: protectedProcedure
    .input(createQrSchema)
    .mutation(async ({ ctx, input }) => {
      const business = await assertBusinessOwner(
        ctx.db,
        input.businessId,
        ctx.userId,
      );

      const accountCaps = await resolveAccountCapabilities(ctx.db, input.businessId);
      const available = getAvailableQrCapabilities(accountCaps);
      if (!available.some((cap) => cap.id === input.capability)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This capability is not available for your account",
        });
      }

      const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.onlume.co";
      const targetUrl = await resolveTargetUrl(ctx.db, business, {
        capability: input.capability,
        config: input.config,
        origin,
      });

      let menuId: string | undefined;
      if (input.capability === "menu") {
        const menu = await ensureMenu(ctx.db, business.id, business.name);
        menuId = menu.id;
      }

      const [created] = await ctx.db
        .insert(qrCodes)
        .values({
          businessId: input.businessId,
          label: input.label.trim(),
          capability: input.capability,
          config: {
            ...input.config,
            menuId,
          },
          targetUrl,
        })
        .returning();

      if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return created;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid(), businessId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);

      const [deleted] = await ctx.db
        .delete(qrCodes)
        .where(eq(qrCodes.id, input.id))
        .returning();

      if (!deleted || deleted.businessId !== input.businessId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return deleted;
    }),
});
