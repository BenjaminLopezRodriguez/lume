// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: account BusinessType + VERTICAL_CONFIG + BUSINESS_ROUTES.account.
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

export type BusinessType = "account" | "store" | "services" | "restaurant" | "event";

export type PrimaryPrimitive =
  | "catalogCheckout"
  | "invoiceCheckout"
  | "platformManagement"
  | "ticketCheckout";

export type ShareMode =
  | "productLink"
  | "storefront"
  | "embedButton"
  | "invoiceLink"
  | "quoteLink"
  | "paymentReminder"
  | "tableQr"
  | "checkoutLink"
  | "textToGuest"
  | "ticketLink"
  | "depositLink";

export type ShareModeConfig = {
  id: ShareMode;
  label: string;
  trailing: string;
};

export type VerticalConfig = {
  label: string;
  accent: string;
  primaryPrimitive: PrimaryPrimitive;
  primaryNoun: string;
  shareModes: ShareMode[];
  shareMeta: string;
  checkoutLinkLabel: string;
  comingSoon: boolean;
  showConnect: boolean;
};

export const SHARE_MODE_CONFIG: Record<ShareMode, ShareModeConfig> = {
  productLink: { id: "productLink", label: "Product link", trailing: "Share a SKU" },
  storefront: { id: "storefront", label: "Storefront URL", trailing: "Public catalog" },
  embedButton: { id: "embedButton", label: "Embed button", trailing: "Add to your site" },
  invoiceLink: { id: "invoiceLink", label: "Invoice link", trailing: "Send after the job" },
  quoteLink: { id: "quoteLink", label: "Quote link", trailing: "Approve before work" },
  paymentReminder: {
    id: "paymentReminder",
    label: "Payment reminder",
    trailing: "Send by SMS",
  },
  tableQr: { id: "tableQr", label: "Table QR", trailing: "Print for dine-in" },
  checkoutLink: { id: "checkoutLink", label: "Checkout link", trailing: "Share online" },
  textToGuest: { id: "textToGuest", label: "Text to guest", trailing: "Send by SMS" },
  ticketLink: { id: "ticketLink", label: "Ticket link", trailing: "Sell seats" },
  depositLink: { id: "depositLink", label: "Deposit link", trailing: "Hold with partial pay" },
};

export const VERTICAL_CONFIG: Record<BusinessType, VerticalConfig> = {
  account: {
    label: "Account",
    accent: "#6366f1",
    primaryPrimitive: "catalogCheckout",
    primaryNoun: "sale",
    shareModes: ["checkoutLink"],
    shareMeta: "Add capabilities to unlock menus, storefronts, and more",
    checkoutLinkLabel: "Checkout link",
    comingSoon: false,
    showConnect: false,
  },
  store: {
    label: "Store",
    accent: "#6366f1",
    primaryPrimitive: "catalogCheckout",
    primaryNoun: "product",
    shareModes: ["productLink", "storefront", "embedButton"],
    shareMeta: "Share product links and your public storefront",
    checkoutLinkLabel: "Storefront link",
    comingSoon: false,
    showConnect: false,
  },
  services: {
    label: "Services",
    accent: "#2d5be3",
    primaryPrimitive: "invoiceCheckout",
    primaryNoun: "job",
    shareModes: ["invoiceLink", "quoteLink", "paymentReminder"],
    shareMeta: "Send invoices and quotes when the work is done",
    checkoutLinkLabel: "Latest invoice link",
    comingSoon: false,
    showConnect: false,
  },
  restaurant: {
    label: "Restaurant",
    accent: "#e85d04",
    primaryPrimitive: "platformManagement",
    primaryNoun: "order",
    shareModes: ["tableQr", "checkoutLink", "textToGuest"],
    shareMeta: "Guests scan or tap your link to order and pay direct",
    checkoutLinkLabel: "Checkout link",
    comingSoon: false,
    showConnect: true,
  },
  event: {
    label: "Event",
    accent: "#e85d9b",
    primaryPrimitive: "ticketCheckout",
    primaryNoun: "ticket",
    shareModes: ["ticketLink", "depositLink"],
    shareMeta: "Sell tickets and deposits for your next event",
    checkoutLinkLabel: "Ticket checkout link",
    comingSoon: false,
    showConnect: false,
  },
};

export const BUSINESS_ROUTES: Record<BusinessType, string> = {
  account: "/m/dashboard",
  store: "/m/store",
  services: "/m/services",
  restaurant: "/m/restaurant",
  event: "/m/event",
};

export function getVerticalConfig(type: string | undefined | null): VerticalConfig {
  if (type && type in VERTICAL_CONFIG) {
    return VERTICAL_CONFIG[type as BusinessType];
  }
  return VERTICAL_CONFIG.account;
}

export function getShareModesForVertical(type: string | undefined | null): ShareModeConfig[] {
  const config = getVerticalConfig(type);
  return config.shareModes.map((mode) => SHARE_MODE_CONFIG[mode]);
}
