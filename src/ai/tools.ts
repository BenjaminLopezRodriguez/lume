import "server-only";

import type { StructuredToolParams } from "@langchain/core/tools";
import { z } from "zod";

import { QR_CAPABILITY_IDS } from "@/lib/qr-capabilities";

import type { AgentContext } from "./context";
import { requireClass, type ToolName } from "./policy";

/**
 * The twelve capabilities the merchant agent has, and nothing else.
 *
 * Rules that hold for every tool here:
 *
 * 1. No schema contains `businessId`. Scope comes from AgentContext, which was
 *    ownership-checked before the model was ever called. The model cannot
 *    address another merchant's data because it has no field in which to say so.
 * 2. No tool writes its own SQL. Every one goes through the tRPC caller, which
 *    re-asserts ownership per procedure.
 * 3. At most three arguments, never nested, and the argument names and types are
 *    repeated in the description string. A Flash-tier model misbinds arguments it
 *    has to infer from a verbose schema — telling it twice is cheaper than a
 *    wrong id in a delete.
 * 4. Every read returns `{ hasData, ... }`. An empty result must look empty. A
 *    bare `[]` or a `{ success: true }` is the exact shape that invites a
 *    plausible invented number.
 *
 * Outputs are shaped down to what a merchant would read aloud. Stripe link ids,
 * marketplace ids, row ids no tool consumes, and customer contact details are
 * dropped on the way out — the model never sees them, so it cannot repeat them.
 */

export type ToolDef<S extends z.ZodTypeAny = z.ZodTypeAny> = {
  name: ToolName;
  description: string;
  schema: S;
  /** Human sentence shown on a confirmation card. Must describe the real effect. */
  summarize: (args: z.infer<S>) => string;
  /**
   * Identity-bound token for confirmable tools. The client must echo it back
   * verbatim; the server recomputes it from the arguments and refuses a mismatch.
   * A yes/no cannot drift onto a different row — the token names the row.
   */
  confirmText?: (args: z.infer<S>) => string;
  execute: (ctx: AgentContext, args: z.infer<S>) => Promise<unknown>;
};

/**
 * The registry's view of a tool: schema-erased, because a heterogeneous map of
 * differently-shaped schemas cannot be indexed generically. Arguments are
 * re-validated through `schema` at the call site, so erasing the static type
 * here costs nothing at runtime.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type AnyToolDef = {
  name: ToolName;
  description: string;
  schema: z.ZodTypeAny;
  summarize: (args: any) => string;
  confirmText?: (args: any) => string;
  execute: (ctx: AgentContext, args: any) => Promise<unknown>;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const empty = z.object({});

const money = (cents: number) => (cents / 100).toFixed(2);

const token = (...parts: (string | number)[]) =>
  parts
    .join("_")
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80)
    .toUpperCase();

/** Every read answers the "is there anything here?" question first. */
const list = <T>(items: T[]) => ({
  hasData: items.length > 0,
  count: items.length,
  items,
});

// ─── Shared setup signals ──────────────────────────────────────────────────

/**
 * One pass over the things that must exist before a merchant can take money.
 * Shared by business_get_setup_status (facts) and diagnostics_setup (verdict)
 * so the two can never disagree.
 */
async function collectSetupSignals(ctx: AgentContext) {
  const [business, storefront, products, qrCodes, recentOrders] =
    await Promise.all([
      ctx.caller.business.getById({ id: ctx.businessId }),
      ctx.caller.store.getStorefront({ businessId: ctx.businessId }),
      ctx.caller.store.listProducts({ businessId: ctx.businessId }),
      ctx.caller.qr.list({ businessId: ctx.businessId }),
      ctx.caller.order.list({ businessId: ctx.businessId, limit: 1 }),
    ]);

  return {
    businessType: business.type,
    checkoutReady: Boolean(business.stripePaymentLinkUrl),
    storefrontReady: Boolean(storefront),
    productCount: products.length,
    qrCodeCount: qrCodes.length,
    hasAnyOrder: recentOrders.length > 0,
  };
}

// ─── Tool definitions ──────────────────────────────────────────────────────

const business_get: ToolDef<typeof empty> = {
  name: "business_get",
  description:
    "business_get — args: none. Returns this business's name, vertical type, address, and whether checkout is set up.",
  schema: empty,
  summarize: () => "Read the business profile.",
  execute: async (ctx) => {
    const business = await ctx.caller.business.getById({ id: ctx.businessId });
    return {
      hasData: true,
      business: {
        name: business.name,
        type: business.type,
        description: business.description,
        address: business.address,
        checkoutReady: Boolean(business.stripePaymentLinkUrl),
      },
    };
  },
};

const business_get_setup_status: ToolDef<typeof empty> = {
  name: "business_get_setup_status",
  description:
    "business_get_setup_status — args: none. Returns which parts of this business are configured: checkout, storefront, product count, QR code count, and whether any order exists.",
  schema: empty,
  summarize: () => "Read the setup status.",
  execute: async (ctx) => ({ hasData: true, setup: await collectSetupSignals(ctx) }),
};

const product_list: ToolDef<typeof empty> = {
  name: "product_list",
  description:
    "product_list — args: none. Returns { hasData, count, items } of products this business sells, newest first.",
  schema: empty,
  summarize: () => "List products.",
  execute: async (ctx) => {
    const products = await ctx.caller.store.listProducts({
      businessId: ctx.businessId,
    });
    return list(
      products.map((p) => ({
        name: p.name,
        description: p.description,
        price: money(p.priceCents),
        inventory: p.inventory,
        buyable: Boolean(p.stripePaymentLinkUrl),
      })),
    );
  },
};

const productCreateSchema = z.object({
  name: z.string().min(1).max(256),
  priceCents: z.number().int().positive(),
  inventory: z.number().int().min(0).default(0),
});

const product_create: ToolDef<typeof productCreateSchema> = {
  name: "product_create",
  description:
    "product_create — args: name (string), priceCents (integer, cents: 1250 means $12.50), inventory (integer, default 0). Creates a product for sale. Use the merchant's exact name and price; never invent either.",
  schema: productCreateSchema,
  summarize: (a) =>
    `Create the product "${a.name}" at $${money(a.priceCents)}${
      a.inventory ? ` with ${a.inventory} in stock` : ""
    }.`,
  confirmText: (a) => token("CREATE_PRODUCT", a.name, a.priceCents),
  execute: async (ctx, a) => {
    const product = await ctx.caller.store.createProduct({
      businessId: ctx.businessId,
      name: a.name,
      priceCents: a.priceCents,
      inventory: a.inventory,
    });
    return {
      hasData: true,
      product: {
        name: product.name,
        price: money(product.priceCents),
        inventory: product.inventory,
        buyable: Boolean(product.stripePaymentLinkUrl),
      },
    };
  },
};

const limitSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
});

const order_list: ToolDef<typeof limitSchema> = {
  name: "order_list",
  description:
    "order_list — args: limit (integer, 1-50, default 20). Returns { hasData, count, items } of recorded orders, newest first, each with total, status, platform, source, placedAt.",
  schema: limitSchema,
  summarize: (a) => `List the ${a.limit} most recent orders.`,
  execute: async (ctx, a) => {
    const orders = await ctx.caller.order.list({
      businessId: ctx.businessId,
      limit: a.limit,
    });
    return list(
      orders.map((o) => ({
        // Order labels arrive from checkout and marketplace webhooks. They are
        // attacker-influenced; containment happens once, centrally, in
        // src/ai/untrusted.ts on the way to the model.
        label: o.label,
        total: money(o.totalCents),
        status: o.status,
        platform: o.platform,
        source: o.source ?? "unknown",
        placedAt: o.createdAt.toISOString(),
      })),
    );
  },
};

const customer_list: ToolDef<typeof limitSchema> = {
  name: "customer_list",
  description:
    "customer_list — args: limit (integer, 1-50, default 20). Returns { hasData, count, items } of customers and what they own, newest first. Contact details are never returned.",
  schema: limitSchema,
  summarize: (a) => `List the ${a.limit} most recent customers.`,
  execute: async (ctx, a) => {
    const rows = await ctx.caller.ownership.listByBusiness({
      businessId: ctx.businessId,
      limit: a.limit,
    });
    // Email and phone are deliberately not returned. The agent answers questions
    // about customers; it does not hand out their contact details.
    return list(
      rows.map((r) => ({
        customerName: r.customerName,
        owns: r.assetType,
        status: r.status,
        source: r.source,
        purchasedAt: r.purchasedAt.toISOString(),
      })),
    );
  },
};

const qr_list: ToolDef<typeof empty> = {
  name: "qr_list",
  description:
    "qr_list — args: none. Returns { hasData, count, items } of QR codes, each with id (uuid, required by qr_remove), label, capability, targetUrl.",
  schema: empty,
  summarize: () => "List QR codes.",
  execute: async (ctx) => {
    const codes = await ctx.caller.qr.list({ businessId: ctx.businessId });
    return list(
      codes.map((c) => ({
        // Kept because qr_remove needs it. No other tool exposes a row id.
        id: c.id,
        label: c.label,
        capability: c.capability,
        targetUrl: c.targetUrl,
        createdAt: c.createdAt.toISOString(),
      })),
    );
  },
};

const qrCreateSchema = z.object({
  capability: z.enum(QR_CAPABILITY_IDS),
  label: z.string().min(1).max(128),
  tableLabel: z.string().max(64).optional(),
});

const qr_create: ToolDef<typeof qrCreateSchema> = {
  name: "qr_create",
  description:
    "qr_create — args: capability (enum: menu|web|checkout|storefront|tickets), label (string), tableLabel (string, optional, menu only). Creates a QR code pointing at one of this business's live surfaces.",
  schema: qrCreateSchema,
  summarize: (a) =>
    `Create a ${a.capability} QR code labelled "${a.label}"${
      a.tableLabel ? ` for table ${a.tableLabel}` : ""
    }.`,
  confirmText: (a) => token("CREATE_QR", a.capability, a.label),
  execute: async (ctx, a) => {
    const created = await ctx.caller.qr.create({
      businessId: ctx.businessId,
      capability: a.capability,
      label: a.label,
      config: { tableLabel: a.tableLabel },
    });
    return {
      hasData: true,
      qrCode: {
        id: created.id,
        label: created.label,
        capability: created.capability,
        targetUrl: created.targetUrl,
      },
    };
  },
};

const qrRemoveSchema = z.object({
  id: z.string().uuid(),
});

const qr_remove: ToolDef<typeof qrRemoveSchema> = {
  name: "qr_remove",
  description:
    "qr_remove — args: id (uuid, must come from the id field of a qr_list result in this same conversation). Deletes a QR code; printed copies stop working immediately.",
  schema: qrRemoveSchema,
  summarize: (a) => `Delete the QR code ${a.id}. Printed copies stop working.`,
  confirmText: (a) => token("DELETE_QR", a.id),
  execute: async (ctx, a) => {
    const removed = await ctx.caller.qr.remove({
      id: a.id,
      businessId: ctx.businessId,
    });
    return {
      hasData: true,
      removed: { label: removed.label, capability: removed.capability },
    };
  },
};

const store_get: ToolDef<typeof empty> = {
  name: "store_get",
  description:
    "store_get — args: none. Returns { hasData } and, when a storefront exists, its name, slug, public path, and product count.",
  schema: empty,
  summarize: () => "Read the storefront.",
  execute: async (ctx) => {
    const storefront = await ctx.caller.store.getStorefront({
      businessId: ctx.businessId,
    });
    if (!storefront) return { hasData: false };
    return {
      hasData: true,
      storefront: {
        name: storefront.name,
        slug: storefront.slug,
        publicPath: `/s/${storefront.slug}`,
        productCount: storefront.products.length,
      },
    };
  },
};

const analytics_orders_by_channel: ToolDef<typeof empty> = {
  name: "analytics_orders_by_channel",
  description:
    "analytics_orders_by_channel — args: none. Returns order COUNTS per channel (ubereats, doordash, grubhub, lume_direct, total). Counts, never revenue: Lume does not attribute revenue by channel.",
  schema: empty,
  summarize: () => "Count orders by channel.",
  execute: async (ctx) => {
    const stats = await ctx.caller.order.channelStats({
      businessId: ctx.businessId,
    });
    return { hasData: stats.total > 0, unit: "orders", byChannel: stats };
  },
};

const diagnostics_setup: ToolDef<typeof empty> = {
  name: "diagnostics_setup",
  description:
    "diagnostics_setup — args: none. Returns { hasData, ready, blockers } naming what is stopping this business from taking its next order, each blocker with an issue and a fix.",
  schema: empty,
  summarize: () => "Diagnose setup blockers.",
  execute: async (ctx) => {
    const s = await collectSetupSignals(ctx);
    const blockers: { issue: string; fix: string }[] = [];

    if (!s.checkoutReady) {
      blockers.push({
        issue: "Checkout is not set up, so nothing can be paid for.",
        fix: "Connect payments for this business.",
      });
    }
    if (s.productCount === 0) {
      blockers.push({
        issue: "There is nothing to sell — no products exist.",
        fix: "Add at least one product with a name and a price.",
      });
    }
    if (!s.storefrontReady) {
      blockers.push({
        issue:
          "No storefront exists, so there is no public page to send buyers to.",
        fix: "Create the storefront.",
      });
    }
    if (s.qrCodeCount === 0) {
      blockers.push({
        issue:
          "No QR code exists, so there is no in-person way to reach checkout.",
        fix: "Create a QR code once there is something to point it at.",
      });
    }

    return { hasData: true, setup: s, ready: blockers.length === 0, blockers };
  },
};

export const TOOLS = {
  business_get,
  business_get_setup_status,
  product_list,
  product_create,
  order_list,
  customer_list,
  qr_list,
  qr_create,
  qr_remove,
  store_get,
  analytics_orders_by_channel,
  diagnostics_setup,
} satisfies Record<ToolName, AnyToolDef>;

export function toolDef(name: ToolName): AnyToolDef {
  return TOOLS[name];
}

/**
 * The subset of tools handed to the model for one run. Called with the skill's
 * tool list, never with every tool: a model that cannot see a tool cannot call it.
 */
export function bindableTools(names: ToolName[]): StructuredToolParams[] {
  return names.map((name) => {
    const def = TOOLS[name];
    // Touching the class here means an unclassified tool throws at bind time,
    // before the model is ever offered it.
    requireClass(def.name);
    return {
      name: def.name,
      description: def.description,
      schema: def.schema,
    };
  });
}
