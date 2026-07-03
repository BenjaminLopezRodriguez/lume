import type { BusinessType, VerticalConfig } from "./types";
import { VERTICAL_CONFIG } from "./types";

// All capability slugs — lower-snake-case
export const CAPABILITIES = [
  "checkout",
  "ownership",
  "messaging",
  "inventory",
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
  store: ["checkout", "inventory", "returns", "ownership", "analytics"],
  services: ["invoices", "ownership", "support", "analytics"],
  restaurant: ["checkout", "reservations", "inventory", "ownership", "analytics"],
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
