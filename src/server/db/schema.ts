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

export const businesses = createTable(
  "business",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    ownerId: d
      .varchar({ length: 256 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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

export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  owner: one(users, { fields: [businesses.ownerId], references: [users.id] }),
  locations: many(businessLocations),
  integrations: many(integrations),
  orders: many(orders),
  storefronts: many(storefronts),
  products: many(products),
  serviceJobs: many(serviceJobs),
  serviceInvoices: many(serviceInvoices),
  events: many(events),
  tickets: many(tickets),
  ownerships: many(ownerships),
  ownershipCheckpoints: many(ownershipCheckpoints),
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

