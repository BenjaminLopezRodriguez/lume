// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: web_presences, menus, qr_codes tables + business relations.
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import { relations } from "drizzle-orm";
import { index, pgTableCreator, uniqueIndex } from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `lume_${name}`);

export const users = createTable("user", (d) => ({
  id: d.varchar({ length: 256 }).primaryKey(),
  email: d.varchar({ length: 320 }).notNull(),
  name: d.varchar({ length: 256 }),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}));

export const accountGroups = createTable(
  "account_group",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    ownerId: d
      .varchar({ length: 256 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 256 }).notNull(),
    description: d.text(),
    createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
  }),
  (t) => [index("account_group_owner_idx").on(t.ownerId)],
);

export const customCapabilitySets = createTable(
  "custom_capability_set",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    ownerId: d
      .varchar({ length: 256 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: d
      .uuid()
      .references(() => businesses.id, { onDelete: "set null" }),
    name: d.varchar({ length: 256 }).notNull(),
    capabilities: d.jsonb().$type<string[]>().notNull().default([]),
    createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
  }),
  (t) => [index("custom_capability_set_owner_idx").on(t.ownerId)],
);

export const businesses = createTable(
  "business",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    ownerId: d
      .varchar({ length: 256 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    groupId: d
      .uuid()
      .references(() => accountGroups.id, { onDelete: "set null" }),
    type: d.varchar({ length: 32 }).notNull(),
    name: d.varchar({ length: 256 }).notNull(),
    description: d.text(),
    cuisine: d.varchar({ length: 256 }),
    address: d.varchar({ length: 512 }),
    eventDate: d.date(),
    location: d.varchar({ length: 512 }),
    capacity: d.integer(),
    stripePaymentLinkUrl: d.varchar({ length: 1024 }),
    stripePaymentLinkId: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("business_owner_idx").on(t.ownerId),
    index("business_type_idx").on(t.type),
  ],
);

export const businessLocations = createTable(
  "business_location",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 256 }).notNull(),
    address: d.varchar({ length: 512 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("business_location_business_idx").on(t.businessId)],
);

export const integrations = createTable(
  "integration",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    platform: d.varchar({ length: 32 }).notNull(),
    externalLocationId: d.varchar({ length: 256 }),
    externalLocationName: d.varchar({ length: 256 }),
    status: d.varchar({ length: 32 }).notNull().default("connected"),
    connectedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("integration_business_idx").on(t.businessId),
    uniqueIndex("integration_business_platform_idx").on(t.businessId, t.platform),
  ],
);

export const orders = createTable(
  "order",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    platform: d.varchar({ length: 32 }).notNull(),
    /**
     * Which interface the purchase came through: web | qr | payment_link | api | agent.
     * Distinct from `platform`, which records the delivery marketplace when there is
     * one. Nullable because orders predating attribution must read "Unknown" rather
     * than be guessed at.
     */
    source: d.varchar({ length: 32 }),
    externalId: d.varchar({ length: 256 }),
    label: d.varchar({ length: 512 }).notNull(),
    totalCents: d.integer().notNull(),
    status: d.varchar({ length: 32 }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("order_business_idx").on(t.businessId),
    index("order_platform_idx").on(t.platform),
    uniqueIndex("order_external_idx").on(t.businessId, t.platform, t.externalId),
  ],
);

export const customCapabilitySetsRelations = relations(customCapabilitySets, ({ one }) => ({
  owner: one(users, { fields: [customCapabilitySets.ownerId], references: [users.id] }),
  business: one(businesses, { fields: [customCapabilitySets.businessId], references: [businesses.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
  accountGroups: many(accountGroups),
  customCapabilitySets: many(customCapabilitySets),
}));

export const accountGroupsRelations = relations(accountGroups, ({ one, many }) => ({
  owner: one(users, { fields: [accountGroups.ownerId], references: [users.id] }),
  businesses: many(businesses),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  owner: one(users, { fields: [businesses.ownerId], references: [users.id] }),
  group: one(accountGroups, { fields: [businesses.groupId], references: [accountGroups.id] }),
  locations: many(businessLocations),
  integrations: many(integrations),
  orders: many(orders),
  storefronts: many(storefronts),
  webPresence: one(webPresences),
  menus: many(menus),
  qrCodes: many(qrCodes),
  products: many(products),
  serviceJobs: many(serviceJobs),
  serviceInvoices: many(serviceInvoices),
  events: many(events),
  tickets: many(tickets),
  ownerships: many(ownerships),
  ownershipCheckpoints: many(ownershipCheckpoints),
  customCapabilitySets: many(customCapabilitySets),
}));

export const businessLocationsRelations = relations(businessLocations, ({ one }) => ({
  business: one(businesses, {
    fields: [businessLocations.businessId],
    references: [businesses.id],
  }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  business: one(businesses, {
    fields: [integrations.businessId],
    references: [businesses.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  business: one(businesses, {
    fields: [orders.businessId],
    references: [businesses.id],
  }),
}));

// ─── Web presence: Lume-hosted site + custom domain ────────────────────────

export const webPresences = createTable(
  "web_presence",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    slug: d.varchar({ length: 128 }).notNull(),
    customDomain: d.varchar({ length: 256 }),
    domainStatus: d.varchar({ length: 32 }),
    dnsReminderEmail: d.varchar({ length: 256 }),
    dnsReminderAt: d.timestamp({ withTimezone: true }),
    scheme: d.varchar({ length: 32 }),
    layout: d.varchar({ length: 32 }),
    sections: d.jsonb(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("web_presence_business_idx").on(t.businessId),
    uniqueIndex("web_presence_slug_idx").on(t.slug),
    uniqueIndex("web_presence_domain_idx").on(t.customDomain),
  ],
);

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  category?: string;
};

export const menus = createTable(
  "menu",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    slug: d.varchar({ length: 128 }).notNull(),
    name: d.varchar({ length: 256 }).notNull(),
    items: d.jsonb().$type<MenuItem[]>().notNull().default([]),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("menu_business_idx").on(t.businessId),
    uniqueIndex("menu_slug_idx").on(t.slug),
  ],
);

export type QrCodeConfig = {
  useCustomDomain?: boolean;
  tableLabel?: string;
  menuId?: string;
};

export const qrCodes = createTable(
  "qr_code",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    label: d.varchar({ length: 128 }).notNull(),
    capability: d.varchar({ length: 32 }).notNull(),
    config: d.jsonb().$type<QrCodeConfig>().notNull().default({}),
    targetUrl: d.varchar({ length: 2048 }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("qr_code_business_idx").on(t.businessId)],
);

// ─── Store: catalog + storefront ───────────────────────────────────────────

export const storefronts = createTable(
  "storefront",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    slug: d.varchar({ length: 128 }).notNull(),
    name: d.varchar({ length: 256 }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("storefront_business_idx").on(t.businessId),
    uniqueIndex("storefront_slug_idx").on(t.slug),
  ],
);

export const products = createTable(
  "product",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    storefrontId: d.uuid().references(() => storefronts.id, { onDelete: "set null" }),
    name: d.varchar({ length: 256 }).notNull(),
    description: d.text(),
    priceCents: d.integer().notNull(),
    inventory: d.integer().notNull().default(0),
    stripePaymentLinkUrl: d.varchar({ length: 1024 }),
    stripePaymentLinkId: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("product_business_idx").on(t.businessId)],
);

// ─── Services: jobs + invoices ─────────────────────────────────────────────

export const serviceJobs = createTable(
  "service_job",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    clientName: d.varchar({ length: 256 }).notNull(),
    clientPhone: d.varchar({ length: 32 }),
    clientAddress: d.varchar({ length: 512 }),
    title: d.varchar({ length: 256 }).notNull(),
    description: d.text(),
    status: d.varchar({ length: 32 }).notNull().default("draft"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("service_job_business_idx").on(t.businessId)],
);

export const serviceInvoices = createTable(
  "service_invoice",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    jobId: d
      .uuid()
      .notNull()
      .references(() => serviceJobs.id, { onDelete: "cascade" }),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    status: d.varchar({ length: 32 }).notNull().default("draft"),
    totalCents: d.integer().notNull(),
    stripePaymentLinkUrl: d.varchar({ length: 1024 }),
    stripePaymentLinkId: d.varchar({ length: 256 }),
    sentAt: d.timestamp({ withTimezone: true }),
    paidAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("service_invoice_business_idx").on(t.businessId),
    index("service_invoice_job_idx").on(t.jobId),
  ],
);

export const serviceInvoiceLineItems = createTable(
  "service_invoice_line_item",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    invoiceId: d
      .uuid()
      .notNull()
      .references(() => serviceInvoices.id, { onDelete: "cascade" }),
    label: d.varchar({ length: 512 }).notNull(),
    amountCents: d.integer().notNull(),
    quantity: d.integer().notNull().default(1),
  }),
  (t) => [index("service_invoice_line_item_invoice_idx").on(t.invoiceId)],
);

// ─── Event: events + tiers + tickets ───────────────────────────────────────

export const events = createTable(
  "event",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 256 }).notNull(),
    eventDate: d.date(),
    location: d.varchar({ length: 512 }),
    capacity: d.integer(),
    depositPercent: d.integer(),
    status: d.varchar({ length: 32 }).notNull().default("draft"),
    stripePaymentLinkUrl: d.varchar({ length: 1024 }),
    stripePaymentLinkId: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("event_business_idx").on(t.businessId)],
);

export const ticketTiers = createTable(
  "ticket_tier",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    eventId: d
      .uuid()
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 128 }).notNull(),
    priceCents: d.integer().notNull(),
    capacity: d.integer().notNull(),
    soldCount: d.integer().notNull().default(0),
  }),
  (t) => [index("ticket_tier_event_idx").on(t.eventId)],
);

export const tickets = createTable(
  "ticket",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    eventId: d
      .uuid()
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    tierId: d
      .uuid()
      .notNull()
      .references(() => ticketTiers.id, { onDelete: "cascade" }),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    attendeeName: d.varchar({ length: 256 }).notNull(),
    attendeeEmail: d.varchar({ length: 320 }),
    quantity: d.integer().notNull().default(1),
    totalCents: d.integer().notNull(),
    status: d.varchar({ length: 32 }).notNull().default("pending"),
    checkInCode: d.varchar({ length: 64 }).notNull(),
    checkedInAt: d.timestamp({ withTimezone: true }),
    stripePaymentLinkUrl: d.varchar({ length: 1024 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("ticket_event_idx").on(t.eventId),
    index("ticket_business_idx").on(t.businessId),
    uniqueIndex("ticket_check_in_code_idx").on(t.checkInCode),
  ],
);

export const webPresencesRelations = relations(webPresences, ({ one }) => ({
  business: one(businesses, {
    fields: [webPresences.businessId],
    references: [businesses.id],
  }),
}));

export const menusRelations = relations(menus, ({ one }) => ({
  business: one(businesses, {
    fields: [menus.businessId],
    references: [businesses.id],
  }),
}));

export const qrCodesRelations = relations(qrCodes, ({ one }) => ({
  business: one(businesses, {
    fields: [qrCodes.businessId],
    references: [businesses.id],
  }),
}));

export const storefrontsRelations = relations(storefronts, ({ one, many }) => ({
  business: one(businesses, {
    fields: [storefronts.businessId],
    references: [businesses.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  business: one(businesses, {
    fields: [products.businessId],
    references: [businesses.id],
  }),
  storefront: one(storefronts, {
    fields: [products.storefrontId],
    references: [storefronts.id],
  }),
}));

export const serviceJobsRelations = relations(serviceJobs, ({ one, many }) => ({
  business: one(businesses, {
    fields: [serviceJobs.businessId],
    references: [businesses.id],
  }),
  invoices: many(serviceInvoices),
}));

export const serviceInvoicesRelations = relations(serviceInvoices, ({ one, many }) => ({
  job: one(serviceJobs, {
    fields: [serviceInvoices.jobId],
    references: [serviceJobs.id],
  }),
  business: one(businesses, {
    fields: [serviceInvoices.businessId],
    references: [businesses.id],
  }),
  lineItems: many(serviceInvoiceLineItems),
}));

export const serviceInvoiceLineItemsRelations = relations(
  serviceInvoiceLineItems,
  ({ one }) => ({
    invoice: one(serviceInvoices, {
      fields: [serviceInvoiceLineItems.invoiceId],
      references: [serviceInvoices.id],
    }),
  }),
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  business: one(businesses, {
    fields: [events.businessId],
    references: [businesses.id],
  }),
  tiers: many(ticketTiers),
  tickets: many(tickets),
}));

export const ticketTiersRelations = relations(ticketTiers, ({ one, many }) => ({
  event: one(events, {
    fields: [ticketTiers.eventId],
    references: [events.id],
  }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  event: one(events, {
    fields: [tickets.eventId],
    references: [events.id],
  }),
  tier: one(ticketTiers, {
    fields: [tickets.tierId],
    references: [ticketTiers.id],
  }),
  business: one(businesses, {
    fields: [tickets.businessId],
    references: [businesses.id],
  }),
}));

// ─── Ownership ────────────────────────────────────────────────────────────────

export const ownerships = createTable(
  "ownership",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    customerName: d.varchar({ length: 256 }).notNull(),
    customerEmail: d.varchar({ length: 320 }),
    customerPhone: d.varchar({ length: 32 }),
    // 'product' | 'dining_relationship' | 'completed_work' | 'attendance'
    assetType: d.varchar({ length: 32 }).notNull(),
    // polymorphic FK — no DB constraint, enforced by service
    assetId: d.varchar({ length: 256 }),
    // 'active' | 'pending_action' | 'transferred' | 'completed'
    status: d.varchar({ length: 32 }).notNull().default("active"),
    // 'stripe_checkout' | 'manual' | 'pos' | 'invoice' | 'import'
    source: d.varchar({ length: 32 }).notNull(),
    sourceRef: d.varchar({ length: 256 }),
    purchasedAt: d.timestamp({ withTimezone: true }).notNull(),
    transferredAt: d.timestamp({ withTimezone: true }),
    completedAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("ownership_business_idx").on(t.businessId),
    index("ownership_status_idx").on(t.status),
  ],
);

export const ownershipEvents = createTable(
  "ownership_event",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    ownershipId: d
      .uuid()
      .notNull()
      .references(() => ownerships.id, { onDelete: "cascade" }),
    type: d.varchar({ length: 64 }).notNull(),
    payload: d.jsonb(),
    // no updatedAt — append-only log
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("ownership_event_ownership_idx").on(t.ownershipId),
    index("ownership_event_type_idx").on(t.type),
  ],
);

export const ownershipCheckpoints = createTable(
  "ownership_checkpoint",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 256 }).notNull(),
    // 'time_after_purchase' | 'manual'
    triggerType: d.varchar({ length: 32 }).notNull(),
    triggerConfig: d.jsonb(),
    // 'reminder' | 'offer' | 'inspection'
    actionType: d.varchar({ length: 32 }).notNull(),
    actionConfig: d.jsonb(),
    active: d.boolean().notNull().default(true),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("ownership_checkpoint_business_idx").on(t.businessId)],
);

export const ownershipCheckpointRuns = createTable(
  "ownership_checkpoint_run",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    ownershipId: d
      .uuid()
      .notNull()
      .references(() => ownerships.id, { onDelete: "cascade" }),
    checkpointId: d
      .uuid()
      .notNull()
      .references(() => ownershipCheckpoints.id, { onDelete: "cascade" }),
    // 'pending' | 'sent' | 'acknowledged' | 'skipped'
    status: d.varchar({ length: 32 }).notNull().default("pending"),
    scheduledAt: d.timestamp({ withTimezone: true }).notNull(),
    completedAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("ownership_checkpoint_run_ownership_idx").on(t.ownershipId),
    index("ownership_checkpoint_run_checkpoint_idx").on(t.checkpointId),
    index("ownership_checkpoint_run_status_idx").on(t.status),
  ],
);

export const ownershipsRelations = relations(ownerships, ({ one, many }) => ({
  business: one(businesses, {
    fields: [ownerships.businessId],
    references: [businesses.id],
  }),
  events: many(ownershipEvents),
  checkpointRuns: many(ownershipCheckpointRuns),
}));

export const ownershipEventsRelations = relations(ownershipEvents, ({ one }) => ({
  ownership: one(ownerships, {
    fields: [ownershipEvents.ownershipId],
    references: [ownerships.id],
  }),
}));

export const ownershipCheckpointsRelations = relations(
  ownershipCheckpoints,
  ({ one, many }) => ({
    business: one(businesses, {
      fields: [ownershipCheckpoints.businessId],
      references: [businesses.id],
    }),
    runs: many(ownershipCheckpointRuns),
  }),
);

export const ownershipCheckpointRunsRelations = relations(
  ownershipCheckpointRuns,
  ({ one }) => ({
    ownership: one(ownerships, {
      fields: [ownershipCheckpointRuns.ownershipId],
      references: [ownerships.id],
    }),
    checkpoint: one(ownershipCheckpoints, {
      fields: [ownershipCheckpointRuns.checkpointId],
      references: [ownershipCheckpoints.id],
    }),
  }),
);


// ─── Commerce boundary: humans, apps, and agents ─────────────────────────────
// See docs/superpowers/specs/agent-commerce-boundary.md
// PurchaseIntent is the product; the checkout page is one renderer of it.

/** Authority envelope a non-human purchaser acts under. */
export const delegations = createTable(
  "delegation",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    /** The human who stays liable for whatever the agent does. */
    buyerId: d
      .varchar({ length: 256 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Opaque agent identifier, e.g. "openai:shopping-agent". */
    agent: d.varchar({ length: 256 }).notNull(),
    /** Minor units. Null means no ceiling, which we never default to. */
    maxTransaction: d.integer(),
    /** Above this amount a human must confirm, no matter what the agent asserts. */
    requiresConfirmationAbove: d.integer(),
    /** Null means unrestricted category, set explicitly. */
    categories: d.jsonb().$type<string[] | null>(),
    expiresAt: d.timestamp({ withTimezone: true }),
    revokedAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("delegation_buyer_idx").on(t.buyerId)],
);

export type PurchaseIntentLineItem = {
  name: string;
  quantity: number;
  /** Minor units. */
  unitAmount: number;
};

export type PurchaserKind = "human" | "application" | "agent";

export const purchaseIntents = createTable(
  "purchase_intent",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    /** draft | quoted | authorized | confirmed | fulfilled | declined | cancelled | expired */
    status: d.varchar({ length: 32 }).notNull().default("draft"),
    purchaserKind: d.varchar({ length: 32 }).notNull().default("human"),
    purchaserRef: d.varchar({ length: 256 }),
    /** Set when a non-human purchaser is acting under delegated authority. */
    delegationId: d.uuid().references(() => delegations.id, {
      onDelete: "set null",
    }),
    items: d.jsonb().$type<PurchaseIntentLineItem[]>(),
    /** Minor units. Re-pricing invalidates any prior authorization. */
    amount: d.integer(),
    currency: d.varchar({ length: 3 }).notNull().default("usd"),
    /** Why policy allowed or refused this. Never just a boolean. */
    policyReason: d.varchar({ length: 512 }),
    requiresHumanConfirmation: d.boolean().notNull().default(false),
    fulfillment: d.jsonb(),
    expiresAt: d.timestamp({ withTimezone: true }),
    authorizedAt: d.timestamp({ withTimezone: true }),
    confirmedAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("purchase_intent_business_idx").on(t.businessId),
    index("purchase_intent_status_idx").on(t.status),
  ],
);

/**
 * Append-only. Normal payment platforms record money movement; this records
 * commercial intent, authorization, and execution — which is the differentiator.
 */
export const purchaseIntentEvents = createTable(
  "purchase_intent_event",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    intentId: d
      .uuid()
      .notNull()
      .references(() => purchaseIntents.id, { onDelete: "cascade" }),
    /** e.g. quote_returned, policy_evaluated, human_authorized, payment_authorized */
    kind: d.varchar({ length: 64 }).notNull(),
    fromStatus: d.varchar({ length: 32 }),
    toStatus: d.varchar({ length: 32 }),
    actor: d.varchar({ length: 256 }),
    detail: d.jsonb(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("purchase_intent_event_intent_idx").on(t.intentId)],
);

export const purchaseIntentRelations = relations(
  purchaseIntents,
  ({ one, many }) => ({
    business: one(businesses, {
      fields: [purchaseIntents.businessId],
      references: [businesses.id],
    }),
    delegation: one(delegations, {
      fields: [purchaseIntents.delegationId],
      references: [delegations.id],
    }),
    events: many(purchaseIntentEvents),
  }),
);

export const purchaseIntentEventRelations = relations(
  purchaseIntentEvents,
  ({ one }) => ({
    intent: one(purchaseIntents, {
      fields: [purchaseIntentEvents.intentId],
      references: [purchaseIntents.id],
    }),
  }),
);

/**
 * Provider webhook receipts. Persisted so replays are no-ops: the provider's own
 * event id is the uniqueness boundary. Signature verification proves authenticity;
 * this table proves we have not already acted on it.
 */
export const webhookEvents = createTable(
  "webhook_event",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    provider: d.varchar({ length: 32 }).notNull(),
    /** The provider's event id, e.g. Stripe evt_… */
    eventId: d.varchar({ length: 256 }).notNull(),
    eventType: d.varchar({ length: 128 }),
    processedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [uniqueIndex("webhook_event_provider_id_idx").on(t.provider, t.eventId)],
);

/**
 * Idempotency for mutating commerce operations. Agents and mobile clients retry;
 * a duplicate request must never create a second financial operation or order.
 * The stored response is replayed verbatim on a repeat key.
 */
export const idempotencyKeys = createTable(
  "idempotency_key",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    key: d.varchar({ length: 256 }).notNull(),
    /** Scope so the same key under a different operation cannot collide. */
    operation: d.varchar({ length: 64 }).notNull(),
    /** Hash of the request body — a reused key with different input is a client bug. */
    requestHash: d.varchar({ length: 128 }).notNull(),
    responseStatus: d.integer(),
    responseBody: d.jsonb(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [uniqueIndex("idempotency_key_op_idx").on(t.operation, t.key)],
);

// ─── Merchant agent: run + tool-call audit ─────────────────────────────────

/**
 * One agent request. Records what was asked of the system, never the prompt
 * itself — merchant messages and customer data stay out of the audit trail.
 */
export const agentRuns = createTable(
  "agent_run",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: d
      .varchar({ length: 256 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Model identifier only. Never the credential. */
    model: d.varchar({ length: 64 }).notNull(),
    skill: d.varchar({ length: 64 }).notNull(),
    /** 'running' | 'completed' | 'awaiting_confirmation' | 'failed' */
    status: d.varchar({ length: 32 }).notNull().default("running"),
    startedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    completedAt: d.timestamp({ withTimezone: true }),
  }),
  (t) => [
    index("agent_run_business_idx").on(t.businessId),
    index("agent_run_user_idx").on(t.userId),
  ],
);

/**
 * One tool invocation inside a run. Arguments are stored as a hash, not in the
 * clear: enough to prove two calls were identical, not enough to leak a
 * customer name or a price the merchant considers private.
 */
export const agentToolCalls = createTable(
  "agent_tool_call",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    runId: d
      .uuid()
      .notNull()
      .references(() => agentRuns.id, { onDelete: "cascade" }),
    tool: d.varchar({ length: 64 }).notNull(),
    /** ToolClass from src/ai/policy.ts. */
    classification: d.varchar({ length: 16 }).notNull(),
    /** sha256 of the canonical arguments. */
    inputHash: d.varchar({ length: 64 }).notNull(),
    /** 'ok' | 'failed' | 'blocked' | 'awaiting_confirmation' */
    status: d.varchar({ length: 16 }).notNull(),
    /**
     * Injection phrases detected in this result by src/ai/untrusted.ts. Recorded,
     * never used to block: a real customer note may legitimately say "cancel this",
     * and withholding a merchant's own data would be the worse trade.
     */
    injectionSignals: d.jsonb().$type<string[]>(),
    /** True when boundary or role markers were neutralised in the payload. */
    hadMarkers: d.boolean().notNull().default(false),
    startedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    completedAt: d.timestamp({ withTimezone: true }),
    errorCode: d.varchar({ length: 64 }),
  }),
  (t) => [index("agent_tool_call_run_idx").on(t.runId)],
);

export const agentRunsRelations = relations(agentRuns, ({ many }) => ({
  toolCalls: many(agentToolCalls),
}));

export const agentToolCallsRelations = relations(agentToolCalls, ({ one }) => ({
  run: one(agentRuns, {
    fields: [agentToolCalls.runId],
    references: [agentRuns.id],
  }),
}));

// ─── Merchant agent: multi-turn conversations ──────────────────────────────

/**
 * One multi-turn exchange between a merchant and the agent.
 *
 * Scoped to exactly one (businessId, userId) pair. That pair is a security
 * boundary, not a convenience: src/ai/conversation.ts verifies BOTH on every
 * load, and a conversation naming another business is refused rather than
 * re-scoped to whoever asked for it.
 *
 * `task` is lightweight resumable state — the skill in play, what the merchant
 * has already supplied, and what actually ran. It is not a form engine, and
 * nothing is written into it that the server did not observe.
 */
export const agentConversations = createTable(
  "agent_conversation",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    businessId: d
      .uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: d
      .varchar({ length: 256 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** ConversationStatus in src/ai/conversation.ts. */
    status: d.varchar({ length: 32 }).notNull().default("understanding"),
    /** ConversationTask. Typed loosely here so the schema stays dependency-free. */
    task: d.jsonb().$type<Record<string, unknown>>(),
    /**
     * Deterministic, labelled digest of turns that fell out of the replay
     * window. Merchant lines and assistant lines stay distinguishable, and tool
     * output never appears — retrieved data must not become trusted context by
     * passing through a summary.
     */
    summary: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("agent_conversation_business_user_idx").on(t.businessId, t.userId),
  ],
);

/**
 * One turn of prose. Merchant messages and assistant messages only.
 *
 * Raw tool payloads are deliberately NOT stored here: execution metadata belongs
 * in agentToolCalls, which already records injection signals and neutralised
 * markers. Persisting a payload would quietly promote untrusted retrieved text
 * into replayed conversation context.
 */
export const agentMessages = createTable(
  "agent_message",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    conversationId: d
      .uuid()
      .notNull()
      .references(() => agentConversations.id, { onDelete: "cascade" }),
    /** 'user' | 'assistant' */
    role: d.varchar({ length: 16 }).notNull(),
    content: d.text().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("agent_message_conversation_idx").on(t.conversationId)],
);

export const agentConversationsRelations = relations(
  agentConversations,
  ({ many }) => ({
    messages: many(agentMessages),
  }),
);

export const agentMessagesRelations = relations(agentMessages, ({ one }) => ({
  conversation: one(agentConversations, {
    fields: [agentMessages.conversationId],
    references: [agentConversations.id],
  }),
}));
