// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: menu capability, account: [] stack, restaurant includes menu.
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import type { BusinessType, VerticalConfig } from "./types";
import { VERTICAL_CONFIG } from "./types";

// All capability slugs — lower-snake-case
export const CAPABILITIES = [
  "checkout",
  "ownership",
  "messaging",
  "inventory",
  "menu",
  "reservations",
  "tickets",
  "invoices",
  "returns",
  "buybacks",
  "support",
  "analytics",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

// Which capabilities each existing stack has
// Keys must match BusinessType: "store" | "services" | "restaurant" | "event"
export const CAPABILITY_SETS: Record<BusinessType, readonly Capability[]> = {
  account: [],
  store: ["checkout", "inventory", "returns", "ownership", "analytics"],
  services: ["invoices", "ownership", "support", "analytics"],
  restaurant: ["menu", "checkout", "reservations", "inventory", "ownership", "analytics"],
  event: ["checkout", "tickets", "ownership", "messaging"],
};

// Extends the existing VerticalConfig from src/verticals/types.ts with capabilities
export type CapabilitySetConfig = VerticalConfig & {
  capabilities: readonly Capability[];
};

// Merges VERTICAL_CONFIG with capability arrays — no fields removed or renamed
export const CAPABILITY_SET_CONFIG: Record<
  BusinessType,
  CapabilitySetConfig
> = {
  account: {
    label: "Account",
    accent: "#6366f1",
    primaryPrimitive: "catalogCheckout",
    primaryNoun: "sale",
    shareModes: ["checkoutLink"],
    shareMeta: "Add capabilities to unlock checkout, menus, and more",
    checkoutLinkLabel: "Checkout link",
    comingSoon: false,
    showConnect: false,
    capabilities: CAPABILITY_SETS.account,
  },
  store: {
    ...VERTICAL_CONFIG.store,
    capabilities: CAPABILITY_SETS.store,
  },
  services: {
    ...VERTICAL_CONFIG.services,
    capabilities: CAPABILITY_SETS.services,
  },
  restaurant: {
    ...VERTICAL_CONFIG.restaurant,
    capabilities: CAPABILITY_SETS.restaurant,
  },
  event: {
    ...VERTICAL_CONFIG.event,
    capabilities: CAPABILITY_SETS.event,
  },
};
