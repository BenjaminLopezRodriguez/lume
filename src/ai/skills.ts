/**
 * Skill registry.
 *
 * Tools are atomic capabilities; skills are the narrow tool sets a given goal
 * needs. Routing to a skill first means the model sees ~4 tools instead of all
 * of them, which is faster, cheaper, and materially more reliable on a Flash-tier
 * model.
 *
 * Routing is a deterministic keyword match, not a model call: an extra round trip
 * to decide which tools to offer would cost more than it saves, and a wrong route
 * should be debuggable rather than probabilistic.
 */

import type { ToolName } from "./policy";

export type LumeSkill = {
  name: string;
  description: string;
  /** Only these tools are bound to the model when this skill is selected. */
  tools: ToolName[];
  /** Appended to the system prompt. Says what to do, never what to claim. */
  instructions: string;
  /** Lowercase keywords; longest match wins. */
  intents: string[];
};

export const SKILLS = {
  sales_brief: {
    name: "sales_brief",
    description: "Explain recent performance using real recorded orders.",
    tools: ["order_list", "analytics_orders_by_channel", "business_get"],
    instructions:
      "Report only figures returned by tools. If a tool returns no rows, say there is no data for that period — never estimate, extrapolate, or supply a plausible number. An empty result means the data does not exist; do not repeat a figure from an earlier answer. Lume does not currently attribute revenue, only order counts, so never present a count as revenue.",
    intents: [
      "how many orders",
      "orders today",
      "sales",
      "revenue",
      "performance",
      "how am i doing",
      "what changed",
      "this week",
      "compared",
    ],
  },

  find_orders: {
    name: "find_orders",
    description: "Look up orders and identify which need attention.",
    tools: ["order_list", "customer_list"],
    instructions:
      "Return the orders the tool actually reports. Quote amounts and statuses exactly as returned. If asked to refund or cancel, explain that Lume cannot do that yet — do not claim to have done it.",
    intents: [
      "order",
      "orders",
      "needs attention",
      "unpaid",
      "refund",
      "cancel",
      "who bought",
    ],
  },

  launch_product: {
    name: "launch_product",
    description: "Add something to sell and make it reachable by customers.",
    tools: ["product_list", "product_create", "store_get", "qr_create"],
    instructions:
      "Never guess a price, name, or description the merchant did not give you — ask instead. Creating a product and creating a QR code both change merchant data, so both require confirmation before they run.",
    intents: [
      "create a product",
      "add a product",
      "new product",
      "sell",
      "add an item",
      "menu item",
      "special",
      "qr code",
      "make a qr",
    ],
  },

  diagnose_setup: {
    name: "diagnose_setup",
    description: "Find what is stopping this merchant from selling.",
    tools: [
      "diagnostics_setup",
      "business_get_setup_status",
      "store_get",
      "qr_list",
    ],
    instructions:
      "Report the real configuration state the tools return. Name what is missing and what to do about it. Do not describe something as configured when the tool says it is not.",
    intents: [
      "what's broken",
      "whats broken",
      "not working",
      "why don't i",
      "why dont i",
      "get ready",
      "first order",
      "setup",
      "missing",
      "help me start",
    ],
  },

  /**
   * Reached when nothing matches. Read-only by construction, and its instructions
   * give the model an explicit way to say the router missed rather than forcing a
   * nearby tool. V4 Flash reports that a mismatched skill makes it repurpose
   * whatever tools it was handed, so the escape hatch is the guard.
   */
  unrouted: {
    name: "unrouted",
    description: "Nothing matched. Answer if a read tool can; otherwise ask.",
    tools: ["business_get", "diagnostics_setup"],
    instructions:
      "You may have been given tools that do not fit what was asked. If so, say plainly that you cannot do it here and ask what they meant — never repurpose an unrelated tool to look useful, and never take an action to seem responsive.",
    intents: [],
  },

  browse_customers: {
    name: "browse_customers",
    description: "Look up customers and their history.",
    tools: ["customer_list", "order_list"],
    instructions:
      "Return only customers the tool reports. Share the minimum needed to answer — do not volunteer contact details that were not asked for.",
    intents: ["customer", "customers", "repeat", "who hasn't", "who hasnt"],
  },
} as const satisfies Record<string, LumeSkill>;

export type SkillName = keyof typeof SKILLS;

/** Fallback when nothing matches: read-only, so an unroutable ask cannot mutate. */
export const DEFAULT_SKILL: SkillName = "unrouted";

/**
 * Longest keyword match wins, so "create a product" beats the bare "product".
 * Ties resolve to the earlier skill in declaration order for stability.
 */
export function routeSkill(message: string): SkillName {
  const text = message.toLowerCase();
  let best: SkillName | null = null;
  let bestLength = 0;

  for (const skill of Object.values(SKILLS)) {
    for (const intent of skill.intents) {
      if (text.includes(intent) && intent.length > bestLength) {
        best = skill.name as SkillName;
        bestLength = intent.length;
      }
    }
  }
  return best ?? DEFAULT_SKILL;
}

export function skillTools(name: SkillName): ToolName[] {
  return [...SKILLS[name].tools];
}
