import { db } from "@/server/db";
import {
  businesses,
  events,
  orders,
  ownershipEvents,
  ownerships,
  products,
  serviceInvoices,
  serviceInvoiceLineItems,
  serviceJobs,
  ticketTiers,
  tickets,
} from "@/server/db/schema";

// ─── Data pools ────────────────────────────────────────────────────────────────

const CUSTOMERS = [
  ["Alice Johnson", "alice@example.com", "+15551001001"],
  ["Marcus Chen", "marcus@example.com", "+15551001002"],
  ["Sofia Rodriguez", "sofia@example.com", "+15551001003"],
  ["James Okafor", "james@example.com", "+15551001004"],
  ["Priya Nair", "priya@example.com", "+15551001005"],
  ["Tyler Brooks", "tyler@example.com", "+15551001006"],
  ["Aisha Kamara", "aisha@example.com", "+15551001007"],
  ["Liam Nguyen", "liam@example.com", "+15551001008"],
  ["Emma Walsh", "emma@example.com", "+15551001009"],
  ["David Park", "david@example.com", "+15551001010"],
  ["Nina Kowalski", "nina@example.com", "+15551001011"],
  ["Omar Hussain", "omar@example.com", "+15551001012"],
  ["Chloe Martin", "chloe@example.com", "+15551001013"],
  ["Ben Adeyemi", "ben@example.com", "+15551001014"],
  ["Sarah Kim", "sarah@example.com", "+15551001015"],
  ["Leo Petrov", "leo@example.com", "+15551001016"],
  ["Mia Tanaka", "mia@example.com", "+15551001017"],
  ["Carlos Vega", "carlos@example.com", "+15551001018"],
  ["Fatima Al-Rashid", "fatima@example.com", "+15551001019"],
  ["Ethan Moore", "ethan@example.com", "+15551001020"],
] as const;

const PRODUCTS = [
  { name: "Wireless Headphones Pro", description: "Noise-cancelling, 30hr battery", priceCents: 7999, inventory: 42 },
  { name: "Leather Wallet", description: "Full-grain leather, RFID block", priceCents: 3499, inventory: 88 },
  { name: "Ceramic Pour-Over Set", description: "Includes dripper, carafe, filters", priceCents: 5499, inventory: 23 },
  { name: "Merino Wool Beanie", description: "100% merino, one size", priceCents: 2999, inventory: 61 },
  { name: "Bamboo Cutting Board", description: "Extra-large, juice groove", priceCents: 4299, inventory: 15 },
  { name: "Glass Water Bottle", description: "32oz, silicone sleeve", priceCents: 1999, inventory: 104 },
] as const;

const JOB_TITLES = [
  "Lawn maintenance — biweekly",
  "Plumbing repair — kitchen sink",
  "House painting — exterior",
  "HVAC tune-up",
  "Tile installation — bathroom",
  "Electrical panel upgrade",
] as const;

const JOB_LINE_ITEMS: Record<string, Array<{ label: string; amountCents: number }>> = {
  "Lawn maintenance — biweekly": [{ label: "Labor (2hrs)", amountCents: 8000 }, { label: "Equipment fee", amountCents: 1500 }],
  "Plumbing repair — kitchen sink": [{ label: "Parts", amountCents: 4500 }, { label: "Labor (1.5hrs)", amountCents: 9000 }],
  "House painting — exterior": [{ label: "Paint & supplies", amountCents: 32000 }, { label: "Labor (3 days)", amountCents: 60000 }],
  "HVAC tune-up": [{ label: "Inspection", amountCents: 7500 }, { label: "Refrigerant top-up", amountCents: 4000 }],
  "Tile installation — bathroom": [{ label: "Tile & grout", amountCents: 18000 }, { label: "Labor (2 days)", amountCents: 40000 }],
  "Electrical panel upgrade": [{ label: "Panel & breakers", amountCents: 55000 }, { label: "Labor", amountCents: 25000 }],
};

const EVENT_NAMES = [
  "Summer Jazz Night",
  "Rooftop Cinema Series",
  "Chef's Table Dinner",
  "Community Art Show",
  "Live Comedy Evening",
] as const;

const RESTAURANTS = [
  { name: "Zara Bistro", cuisine: "Mediterranean", address: "42 Oak St" },
  { name: "The Noodle House", cuisine: "Japanese", address: "88 Pine Ave" },
  { name: "Casa Verde", cuisine: "Mexican", address: "15 Elm Blvd" },
] as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

function randomDaysAgo(min = 1, max = 90): Date {
  return daysAgo(Math.floor(min + Math.random() * (max - min)));
}

// Weighted status: 50% active, 30% pending_action, 20% completed
const STATUS_POOL = [
  "active", "active", "active", "active", "active",
  "pending_action", "pending_action", "pending_action",
  "completed", "completed",
] as const;

type Status = (typeof STATUS_POOL)[number];

function pickStatus(): Status {
  return pick(STATUS_POOL);
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// ─── Ownership inserter ────────────────────────────────────────────────────────

async function insertOwnership(
  businessId: string,
  assetType: "product" | "dining_relationship" | "completed_work" | "attendance",
  assetId: string | null,
  customer: (typeof CUSTOMERS)[number],
  status: Status,
  purchasedAt: Date,
) {
  const [ownership] = await db
    .insert(ownerships)
    .values({
      businessId,
      customerName: customer[0],
      customerEmail: customer[1],
      customerPhone: customer[2],
      assetType,
      assetId,
      status,
      source: "import",
      sourceRef: `seed-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      purchasedAt,
      completedAt: status === "completed" ? daysAgo(1) : null,
    })
    .returning({ id: ownerships.id });

  const ownershipId = ownership!.id;

  // Always: purchase event
  await db.insert(ownershipEvents).values({
    ownershipId,
    type: "purchase",
    payload: { source: "import", assetType, assetId },
    createdAt: purchasedAt,
  });

  if (status === "pending_action") {
    await db.insert(ownershipEvents).values({
      ownershipId,
      type: "checkpoint_triggered",
      payload: { reason: "return_requested" },
      createdAt: daysAgo(1),
    });
  }

  if (status === "completed") {
    await db.insert(ownershipEvents).values({
      ownershipId,
      type: "ownership_completed",
      payload: {},
      createdAt: daysAgo(1),
    });
  }
}

// ─── Per-vertical seeders ──────────────────────────────────────────────────────

async function seedStore(ownerId: string) {
  const [biz] = await db
    .insert(businesses)
    .values({
      ownerId,
      type: "store",
      name: "Lume Shop Demo",
      description: "Sample retail store for testing",
      updatedAt: new Date(),
    })
    .returning({ id: businesses.id });
  const bizId = biz!.id;

  // Insert products and collect IDs
  const inserted = await db
    .insert(products)
    .values(PRODUCTS.map((p) => ({ ...p, businessId: bizId })))
    .returning({ id: products.id });

  // Orders (last 7 days, multiple per day)
  const platforms = ["lume_direct", "doordash", "ubereats"] as const;
  const orderRows = Array.from({ length: 14 }, (_, i) => ({
    businessId: bizId,
    platform: pick(platforms),
    externalId: `seed-order-${i}`,
    label: `Order #${1000 + i} — ${pick(PRODUCTS).name}`,
    totalCents: 2000 + Math.floor(Math.random() * 8000),
    status: "completed",
    createdAt: daysAgo(Math.floor(i / 2)),
  }));
  await db.insert(orders).values(orderRows);

  // Ownerships — one per customer, cycling through products
  const customerPool = shuffled([...CUSTOMERS]);
  for (let i = 0; i < 15; i++) {
    const customer = customerPool[i % customerPool.length]!;
    const product = inserted[i % inserted.length]!;
    const status = pickStatus();
    await insertOwnership(bizId, "product", product.id, customer, status, randomDaysAgo(1, 60));
  }

  return bizId;
}

async function seedServices(ownerId: string) {
  const [biz] = await db
    .insert(businesses)
    .values({
      ownerId,
      type: "services",
      name: "Lume Services Demo",
      description: "Sample service business for testing",
      updatedAt: new Date(),
    })
    .returning({ id: businesses.id });
  const bizId = biz!.id;

  const customerPool = shuffled([...CUSTOMERS]);
  for (let i = 0; i < 12; i++) {
    const customer = customerPool[i % customerPool.length]!;
    const title = pick(JOB_TITLES);
    const lineItems = JOB_LINE_ITEMS[title]!;
    const totalCents = lineItems.reduce((s, li) => s + li.amountCents, 0);

    const [job] = await db
      .insert(serviceJobs)
      .values({
        businessId: bizId,
        clientName: customer[0],
        clientPhone: customer[2],
        clientAddress: "123 Main St, Springfield",
        title,
        status: pick(["draft", "scheduled", "in_progress", "completed"] as const),
        createdAt: randomDaysAgo(5, 90),
      })
      .returning({ id: serviceJobs.id });

    const [invoice] = await db
      .insert(serviceInvoices)
      .values({
        jobId: job!.id,
        businessId: bizId,
        status: pick(["sent", "paid"] as const),
        totalCents,
        paidAt: daysAgo(Math.floor(Math.random() * 30)),
        createdAt: randomDaysAgo(3, 60),
      })
      .returning({ id: serviceInvoices.id });

    await db.insert(serviceInvoiceLineItems).values(
      lineItems.map((li) => ({ invoiceId: invoice!.id, ...li, quantity: 1 })),
    );

    const status = pickStatus();
    await insertOwnership(bizId, "completed_work", invoice!.id, customer, status, randomDaysAgo(1, 60));
  }

  return bizId;
}

async function seedEvent(ownerId: string) {
  const [biz] = await db
    .insert(businesses)
    .values({
      ownerId,
      type: "event",
      name: "Lume Events Demo",
      description: "Sample event business for testing",
      updatedAt: new Date(),
    })
    .returning({ id: businesses.id });
  const bizId = biz!.id;

  for (const name of EVENT_NAMES.slice(0, 2)) {
    const [event] = await db
      .insert(events)
      .values({
        businessId: bizId,
        name,
        eventDate: new Date(Date.now() + 30 * 86_400_000).toISOString().split("T")[0],
        location: "123 Venue Ave, Downtown",
        capacity: 100,
        status: "published",
      })
      .returning({ id: events.id });

    const [tier] = await db
      .insert(ticketTiers)
      .values({ eventId: event!.id, name: "General Admission", priceCents: 2500, capacity: 100, soldCount: 0 })
      .returning({ id: ticketTiers.id });

    const customerPool = shuffled([...CUSTOMERS]);
    for (let i = 0; i < 8; i++) {
      const customer = customerPool[i]!;
      await db.insert(tickets).values({
        eventId: event!.id,
        tierId: tier!.id,
        businessId: bizId,
        attendeeName: customer[0],
        attendeeEmail: customer[1],
        quantity: 1,
        totalCents: 2500,
        status: pick(["confirmed", "pending"] as const),
        checkInCode: `CHK-${event!.id.slice(0, 6)}-${i}`,
      });

      const status = pickStatus();
      await insertOwnership(bizId, "attendance", event!.id, customer, status, randomDaysAgo(1, 30));
    }
  }

  return bizId;
}

async function seedRestaurant(ownerId: string) {
  const template = pick(RESTAURANTS);
  const [biz] = await db
    .insert(businesses)
    .values({
      ownerId,
      type: "restaurant",
      name: template.name,
      cuisine: template.cuisine,
      address: template.address,
      updatedAt: new Date(),
    })
    .returning({ id: businesses.id });
  const bizId = biz!.id;

  // Recent orders for the live order feed
  const platforms = ["ubereats", "doordash", "grubhub", "lume_direct"] as const;
  const orderRows = Array.from({ length: 20 }, (_, i) => ({
    businessId: bizId,
    platform: pick(platforms),
    externalId: `seed-resto-order-${i}`,
    label: `Table ${1 + (i % 12)} — ${pick(["Burger", "Pasta", "Salad", "Pizza", "Steak"])}`,
    totalCents: 1500 + Math.floor(Math.random() * 6000),
    status: "completed",
    createdAt: daysAgo(Math.floor(i / 4)),
  }));
  await db.insert(orders).values(orderRows);

  const customerPool = shuffled([...CUSTOMERS]);
  for (let i = 0; i < 10; i++) {
    const customer = customerPool[i]!;
    const status = pickStatus();
    await insertOwnership(bizId, "dining_relationship", null, customer, status, randomDaysAgo(1, 60));
  }

  return bizId;
}

// ─── Main entry ────────────────────────────────────────────────────────────────

export async function seedForUser(userId: string) {
  await Promise.all([
    seedStore(userId),
    seedServices(userId),
    seedEvent(userId),
    seedRestaurant(userId),
  ]);
}
