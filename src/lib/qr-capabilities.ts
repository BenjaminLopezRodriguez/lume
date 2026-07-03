// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: QR capability config + getAvailableQrCapabilities (account-attached caps).
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import type { Capability } from "@/verticals/capabilities";

export const QR_CAPABILITY_IDS = [
  "menu",
  "web",
  "checkout",
  "storefront",
  "tickets",
] as const;

export type QrCapabilityId = (typeof QR_CAPABILITY_IDS)[number];

export type QrCapabilityConfig = {
  id: QrCapabilityId;
  label: string;
  description: string;
  requiredCapabilities: readonly Capability[];
};

export const QR_CAPABILITY_CONFIG: Record<QrCapabilityId, QrCapabilityConfig> = {
  menu: {
    id: "menu",
    label: "Menu",
    description: "Guests scan to browse your menu and place orders",
    requiredCapabilities: ["menu"],
  },
  web: {
    id: "web",
    label: "Website",
    description: "Point to your Lume-hosted site or a connected domain",
    requiredCapabilities: [],
  },
  checkout: {
    id: "checkout",
    label: "Checkout",
    description: "Direct payment or order link",
    requiredCapabilities: ["checkout"],
  },
  storefront: {
    id: "storefront",
    label: "Storefront",
    description: "Product catalog with checkout",
    requiredCapabilities: ["inventory"],
  },
  tickets: {
    id: "tickets",
    label: "Tickets",
    description: "Event ticket sales and check-in",
    requiredCapabilities: ["tickets"],
  },
};

export function getAvailableQrCapabilities(
  accountCaps: readonly Capability[],
): QrCapabilityConfig[] {
  const available = QR_CAPABILITY_IDS.map((id) => QR_CAPABILITY_CONFIG[id]).filter(
    (config) => {
      if (config.requiredCapabilities.length === 0) return true;
      return config.requiredCapabilities.every((cap) => accountCaps.includes(cap));
    },
  );

  if (accountCaps.includes("menu")) {
    return available.sort((a, b) => {
      if (a.id === "menu") return -1;
      if (b.id === "menu") return 1;
      return 0;
    });
  }

  return available;
}

export function accountHasMenuCapability(
  accountCaps: readonly Capability[],
): boolean {
  return accountCaps.includes("menu");
}
