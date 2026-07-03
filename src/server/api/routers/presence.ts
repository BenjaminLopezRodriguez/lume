// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: Web presence router (slug, custom domain connect/verify/disconnect).
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { assertBusinessOwner } from "@/server/api/lib/assert-business-owner";
import { webPresences } from "@/server/db/schema";
import { env } from "@/env";
import { resend } from "@/server/resend";

const VERCEL_A_RECORD = "76.76.21.21";

async function registerVercelDomain(domain: string) {
  if (!env.VERCEL_TOKEN || !env.VERCEL_PROJECT_ID) return;
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${env.VERCEL_PROJECT_ID}/domains`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    },
  );
  // 409 = already registered (fine). Log anything unexpected.
  if (!res.ok && res.status !== 409) {
    const body = await res.text().catch(() => "");
    console.error(`[presence] Vercel domain registration failed ${res.status}:`, body);
  }
}

async function checkDnsResolvesToVercel(domain: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`,
      { headers: { Accept: "application/dns-json" } },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { Answer?: { data: string }[] };
    return (data.Answer ?? []).some((r) => r.data === VERCEL_A_RECORD);
  } catch {
    return false;
  }
}

export const LUME_SITES_HOST = "sites.onlume.co";

const domainSchema = z
  .string()
  .min(3)
  .max(253)
  .transform(normalizeDomain)
  .refine(isValidDomain, "Enter a valid domain like yourbusiness.com");

function normalizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

function isValidDomain(domain: string) {
  return /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(domain);
}

function slugifyPresence(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "site"
  );
}

async function ensureUniqueSlug(
  database: Parameters<typeof assertBusinessOwner>[0],
  base: string,
) {
  let slug = slugifyPresence(base);
  let attempt = 0;

  while (attempt < 20) {
    const taken = await database.query.webPresences.findFirst({
      where: (row, { eq: equals }) => equals(row.slug, slug),
    });
    if (!taken) return slug;
    attempt += 1;
    slug = `${slugifyPresence(base)}-${attempt}`;
  }

  return `${slugifyPresence(base)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const presenceRouter = createTRPCRouter({
  get: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const business = await assertBusinessOwner(
        ctx.db,
        input.businessId,
        ctx.userId,
      );

      const presence = await ctx.db.query.webPresences.findFirst({
        where: (row, { eq: equals }) => equals(row.businessId, input.businessId),
      });

      if (presence) return presence;

      const slug = await ensureUniqueSlug(ctx.db, business.name);
      const [created] = await ctx.db
        .insert(webPresences)
        .values({
          businessId: input.businessId,
          slug,
        })
        .returning();

      return created ?? null;
    }),

  connectDomain: protectedProcedure
    .input(
      z.object({
        businessId: z.string().uuid(),
        domain: domainSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);

      const taken = await ctx.db.query.webPresences.findFirst({
        where: (row, { and: andWhere, eq: equals, ne: notEquals }) =>
          andWhere(
            equals(row.customDomain, input.domain),
            notEquals(row.businessId, input.businessId),
          ),
      });

      if (taken) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This domain is already connected to another account",
        });
      }

      const [updated] = await ctx.db
        .update(webPresences)
        .set({
          customDomain: input.domain,
          domainStatus: "pending_dns",
          updatedAt: new Date(),
        })
        .where(eq(webPresences.businessId, input.businessId))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Web presence not found" });
      }

      await registerVercelDomain(input.domain);

      return updated;
    }),

  verifyDomain: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);

      const presence = await ctx.db.query.webPresences.findFirst({
        where: (row, { eq: equals }) => equals(row.businessId, input.businessId),
      });

      if (!presence?.customDomain) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Connect a domain before verifying",
        });
      }

      // Ensure domain is registered with Vercel — idempotent, 409 = already there
      await registerVercelDomain(presence.customDomain);

      const dnsOk = await checkDnsResolvesToVercel(presence.customDomain);
      if (!dnsOk) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "DNS not pointing to Lume yet. Make sure the A record (@ → 76.76.21.21) is saved and set to DNS-only if using Cloudflare. Changes can take a few minutes.",
        });
      }

      const [updated] = await ctx.db
        .update(webPresences)
        .set({
          domainStatus: "active",
          updatedAt: new Date(),
        })
        .where(eq(webPresences.businessId, input.businessId))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updated;
    }),

  scheduleReminder: protectedProcedure
    .input(z.object({ businessId: z.string().uuid(), email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);

      await ctx.db
        .update(webPresences)
        .set({
          dnsReminderEmail: input.email,
          dnsReminderAt: new Date(Date.now() + 60 * 60 * 1000),
          updatedAt: new Date(),
        })
        .where(eq(webPresences.businessId, input.businessId));
    }),

  disconnectDomain: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);

      const [updated] = await ctx.db
        .update(webPresences)
        .set({
          customDomain: null,
          domainStatus: null,
          updatedAt: new Date(),
        })
        .where(eq(webPresences.businessId, input.businessId))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updated;
    }),
});
