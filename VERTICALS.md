# Lume Vertical Primitives

Lume is one **ownership layer** with four commerce shapes. Checkout is how ownership begins; each vertical differs in **asset type**, **when money moves**, and **lifecycle** after purchase.

**North star:** [thesis.md](./thesis.md) · **Product:** [PRODUCT.md](./PRODUCT.md) · **Code map:** [docs/THESIS_MAP.md](./docs/THESIS_MAP.md)

## Shared foundation

| Primitive | Role |
|-----------|------|
| `PageHeader` | Business name + operational meta |
| `SectionHeader` | Section label above list or chart |
| `ListCard` / `ListCardRow` | Status rows with dot + trailing value |
| `SalesBarGraph` | Weekly performance snapshot |
| `ShareSurface` | Copy link / QR / SMS distribution |
| `CheckoutButton` | Shopper-facing pay CTA — **lifecycle event: purchase** |
| `OwnershipTimeline` | Lifecycle events after purchase (Phase 2) |
| `PaymentStatusChip` | Status badges across jobs, invoices, tickets |

**Design tokens (merchant app):** white canvas, `#ebebeb` borders, `#e2f1af` active nav. Vertical identity = accent color + icon + primary noun.

**Doc naming:** Thesis uses **Shop**; code type is `store` (same vertical).

---

## Shop (code: `store`)

**Asset:** Physical product

**What:** Retail catalog commerce. Price known before checkout.

**Entry primitive:** `CatalogCheckout` — money upfront, tied to cart or SKU.

**Accent:** `#6366f1` · **Route:** `/m/store` · **Public:** `/s/[slug]`

### Checkout primitives

| Primitive | Merchant UI | Shopper UI |
|-----------|-------------|------------|
| `ProductCard` | Catalog list row | Storefront grid |
| `CheckoutButton` | Copy product link | Sticky pay button |
| `StorefrontEndpoint` | Preview + slug | Browse + cart |
| `FulfillmentBadge` | Order status row | Receipt |

### Lifecycle (thesis)

Returns · Warranty · Accessories · Trade-ins · Resale · Buyback (recovery when return denied)

**Recovery examples:** Return expired → merchant buyback; overstock → merchant exchange

---

## Services (code: `services`)

**Asset:** Completed work

**What:** Work-delivered commerce. Invoice after job completion.

**Entry primitive:** `InvoiceCheckout` — money after delivery, tied to invoice.

**Accent:** `#2d5be3` · **Route:** `/m/services`

### Checkout primitives

| Primitive | Merchant UI | Shopper UI |
|-----------|-------------|------------|
| `JobCard` | Client + service status | — |
| `QuoteBuilder` | Editable line items | Read-only quote |
| `InvoiceCheckout` | Send invoice link | Pay invoice button |
| `PaymentStatusChip` | draft / sent / paid | Confirmation |

### Lifecycle (thesis)

Invoices · Maintenance · Follow-up inspections · Repeat service · Seasonal reminders

**Recovery examples:** Appointment cancelled → fill schedule; customer inactive → lifecycle outreach

---

## Restaurant (code: `restaurant`)

**Asset:** Dining relationship

**What:** Food service + third-party delivery aggregation.

**Entry primitive:** `PlatformManagement` — aggregate 3P orders + direct checkout (`MenuCheckout`).

**Accent:** `#e85d04` · **Route:** `/m/restaurant`

### Checkout primitives

| Primitive | Merchant UI | Shopper UI |
|-----------|-------------|------------|
| `PlatformConnectStepper` | OAuth + location | — |
| `LiveOrderRow` | Dashboard orders | — |
| `MenuCheckout` | Table QR in Share | Menu + pay |
| `CommissionCallout` | $0 commission meta | — |

### Lifecycle (thesis)

Reorders · Reservations · Happy hour · Loyalty · Direct ordering · Special menus

**Recovery examples:** Restaurant empty → promotion / happy hour; receipt forgotten → SMS reminder

---

## Event (code: `event`)

**Asset:** Attendance

**What:** Time-bound, capacity-limited access (dinners, classes, concerts).

**Entry primitive:** `TicketCheckout` — money upfront, tied to seat/tier.

**Accent:** `#e85d9b` · **Route:** `/m/event`

### Checkout primitives

| Primitive | Merchant UI | Shopper UI |
|-----------|-------------|------------|
| `EventCard` | Event list row | Event hero |
| `CapacityMeter` | Seats sold / total | "12 left" |
| `TicketCheckout` | Share ticket link | Pay + qty |
| `TicketReceipt` | Attendee check-in | QR ticket |

### Lifecycle (thesis)

Ticket transfer · Future events · Recordings · Merchandise · VIP upgrades

**Recovery examples:** Unused ticket → waitlist resale

---

## Comparison

| | Shop | Services | Restaurant | Event |
|---|------|----------|------------|-------|
| **Asset** | Physical product | Completed work | Dining relationship | Attendance |
| **When pay** | Before fulfillment | After work | Before/at pickup | Before attendance |
| **Entry primitive** | CatalogCheckout | InvoiceCheckout | PlatformManagement | TicketCheckout |
| **Lifecycle focus** | Returns, trade-in | Maintenance, repeat | Reorders, loyalty | Transfer, resale |
| **Dashboard focus** | Sales by SKU | Unpaid invoices | Live orders + channels | Sales by event |

---

## Share surface variants

| Vertical | Share modes |
|----------|-------------|
| Shop | Product link, Storefront URL, Embed button |
| Services | Invoice link, Quote link, Payment reminder SMS |
| Restaurant | Table QR, Checkout link, Text to guest |
| Event | Ticket link, Deposit link |

Configuration: [`src/verticals/types.ts`](src/verticals/types.ts). Planned: `lifecycleModes[]` in Phase 2.

---

## Roadmap

Implementation phases: [docs/superpowers/plans/ownership-roadmap.md](docs/superpowers/plans/ownership-roadmap.md)
