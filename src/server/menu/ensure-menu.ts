// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: ensureMenu, uniqueSlug, defaultMenuItems shared by menu + QR flows.
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import { TRPCError } from "@trpc/server";

import type { assertBusinessOwner } from "@/server/api/lib/assert-business-owner";
import { menus, webPresences, type MenuItem } from "@/server/db/schema";

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "site"
  );
}

export async function uniqueSlug(
  database: Parameters<typeof assertBusinessOwner>[0],
  table: "menus" | "webPresences",
  base: string,
) {
  let slug = slugify(base);
  let attempt = 0;

  while (attempt < 20) {
    const taken =
      table === "menus"
        ? await database.query.menus.findFirst({
            where: (row, { eq: equals }) => equals(row.slug, slug),
          })
        : await database.query.webPresences.findFirst({
            where: (row, { eq: equals }) => equals(row.slug, slug),
          });
    if (!taken) return slug;
    attempt += 1;
    slug = `${slugify(base)}-${attempt}`;
  }

  return `${slugify(base)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function defaultMenuItems(): MenuItem[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "House Special",
      description: "Chef's selection of the day",
      priceCents: 1800,
      category: "Mains",
    },
    {
      id: crypto.randomUUID(),
      name: "Seasonal Salad",
      description: "Local greens, citrus vinaigrette",
      priceCents: 1200,
      category: "Starters",
    },
    {
      id: crypto.randomUUID(),
      name: "Craft Beverage",
      description: "Ask your server for today's options",
      priceCents: 600,
      category: "Drinks",
    },
  ];
}

export async function ensureMenu(
  database: Parameters<typeof assertBusinessOwner>[0],
  businessId: string,
  businessName: string,
) {
  const existing = await database.query.menus.findFirst({
    where: (row, { eq: equals }) => equals(row.businessId, businessId),
  });
  if (existing) return existing;

  const slug = await uniqueSlug(database, "menus", `${businessName}-menu`);
  const [created] = await database
    .insert(menus)
    .values({
      businessId,
      slug,
      name: `${businessName} Menu`,
      items: defaultMenuItems(),
    })
    .returning();

  if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  return created;
}
