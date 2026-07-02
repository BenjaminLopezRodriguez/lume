# Thesis ↔ Code map

Reconciles [thesis.md](../thesis.md) with the current Lume codebase. Update this file when schema or features change.

**Legend:** ✅ exists · 🟡 partial · ❌ not built

---

## Core thesis concepts

| Thesis concept | Current artifact | Status | Gap |
|----------------|------------------|--------|-----|
| **Ownership** primitive | `orders`, `businesses`, vertical tables | 🟡 | No unified `ownerships` record linking merchant + customer + asset |
| **Purchase → ownership begins** | Stripe payment links on create | 🟡 | Pay link exists; no webhook → ownership transition |
| **Lifecycle events** | — | ❌ | No `lifecycle_events` table or timeline UI |
| **Checkpoints** (merchant-defined) | — | ❌ | No triggers/actions engine |
| **Recovery paths** | — | ❌ | Failures are terminal in UI; no fork workflows |
| **Receipt** (lifecycle) | Share URLs, Stripe receipt | 🟡 | No Lume receipt object; no "forgot receipt" SMS |
| **Warranty / support / maintenance** | — | ❌ | Not modeled |
| **Lume Shop** (ownership-quality discovery) | Landing marketing (`landing.tsx`) | 🟡 | No shopper app; no ownership ranking |
| **SMS proactive** | `paymentReminder` share label | 🟡 | Label only; no Twilio/send |
| **AI ownership intelligence** | — | ❌ | No prediction/recommendation layer |

---

## First principles → code

| Principle | Code signal | Status |
|-----------|-------------|--------|
| Every transaction has a lifecycle | Orders stop at `createdAt`; no post-purchase | ❌ |
| Every failure state is an opportunity | No recovery state machines | ❌ |
| Ownership actively managed | No checkpoints | ❌ |
| Recover lost value | No overstock/waitlist/buyback flows | ❌ |
| Compete on ownership quality | Merchant pages are checkout/ops focused | 🟡 |

---

## Vertical asset mapping

Thesis name → code type → tables → entry primitive → lifecycle (thesis)

### Shop (code: `store`)

| | |
|---|---|
| **Asset** | Physical product |
| **Tables** | `lume_storefront`, `lume_product`, `lume_business` |
| **Routes** | `/m/store`, `/s/[slug]` |
| **Entry** | `CatalogCheckout` — Stripe link per product |
| **Lifecycle (thesis)** | Returns, warranty, accessories, trade-ins, resale |
| **Status** | Catalog + storefront ✅; lifecycle ❌ |

### Restaurant (code: `restaurant`)

| | |
|---|---|
| **Asset** | Dining relationship |
| **Tables** | `lume_business`, `lume_order`, `lume_integration`, `lume_business_location` |
| **Routes** | `/m/restaurant`, `/m/connect`, `/m/dashboard` |
| **Entry** | `PlatformManagement` + direct `MenuCheckout` |
| **Lifecycle (thesis)** | Reorders, reservations, happy hour, loyalty, direct ordering, special menus |
| **Status** | Orders + integrations 🟡; lifecycle ❌ |

### Services (code: `services`)

| | |
|---|---|
| **Asset** | Completed work |
| **Tables** | `lume_service_job`, `lume_service_invoice`, `lume_service_invoice_line_item` |
| **Routes** | `/m/services` |
| **Entry** | `InvoiceCheckout` — pay after job |
| **Lifecycle (thesis)** | Invoices, maintenance, follow-up inspections, repeat service, seasonal reminders |
| **Status** | Jobs + invoices ✅; lifecycle after pay ❌ |

### Events (code: `event`)

| | |
|---|---|
| **Asset** | Attendance |
| **Tables** | `lume_event`, `lume_ticket_tier`, `lume_ticket` |
| **Routes** | `/m/event` |
| **Entry** | `TicketCheckout` + `checkInCode` |
| **Lifecycle (thesis)** | Ticket transfer, future events, recordings, merchandise, VIP upgrades |
| **Status** | Create + check-in 🟡; transfer/resale ❌ |

---

## Shared infrastructure

| Layer | Path | Role in thesis |
|-------|------|----------------|
| Auth | Kinde, `src/server/auth.ts` | Merchant identity |
| Payments | `src/server/stripe.ts` | Purchase event (should create ownership) |
| Webhooks | `src/app/api/webhooks/doordash/` | Order ingest (restaurant); need Stripe ownership webhook |
| Merchant shell | `src/app/m/_components/` | Will host `OwnershipTimeline`, checkpoints |
| Vertical config | `src/verticals/types.ts` | Add `lifecycleModes[]` in Phase 2 |
| Share | `share-page-view.tsx` | Entry distribution; becomes lifecycle touchpoint |

---

## Proposed schema (Phase 1 — not built)

```
ownerships          — merchant + customer + assetType + assetId + status
lifecycle_events    — ownershipId + type + payload
checkpoints         — merchant-defined trigger + action templates
checkpoint_runs     — scheduled instances per ownership
recovery_templates  — failure → next-best-outcome (Phase 3)
recovery_runs       — instances (Phase 3)
```

---

## Phase readiness

| Phase | Focus | Blocked by |
|-------|-------|------------|
| 0 | Docs + Claude CLI | — (complete) |
| 1 | Ownership primitive + Stripe webhook | Schema migration |
| 2 | Lifecycle UI per vertical | Phase 1 |
| 3 | Recovery paths | Phase 1–2 |
| 4 | SMS | Phase 3 checkpoints/recovery |
| 5 | Lume Shop discovery | Ownership signals public |
| 6 | AI | `lifecycle_events` history |
| 7 | Landing narrative | Copy pass |

---

## Naming

| Thesis | Code today | Notes |
|--------|------------|-------|
| Shop | `store` | Docs use Shop; rename optional in Phase 2 |
| Ownership | — | New `src/server/ownership/` module |
| Checkout | Stripe payment links | Becomes `lifecycle_event: purchase` |
