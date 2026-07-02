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
