# Ownership roadmap

Phased build plan from [thesis.md](../../thesis.md). See [THESIS_MAP.md](../THESIS_MAP.md) for current code status.

**Strategic shift:** Checkout is the on-ramp; **ownership** is the primitive. Stripe formalized payments. Shopify formalized storefronts. Lume formalizes ownership.

---

## Phase 0 — Docs + Claude CLI (complete)

- [x] `thesis.md` at repo root
- [x] `CLAUDE.md` — thesis-first context for Claude Code
- [x] `docs/THESIS_MAP.md` — thesis ↔ code gaps
- [x] `docs/CLAUDE_WORKFLOW.md` — spec-before-code sessions
- [x] `PRODUCT.md` / `VERTICALS.md` — subordinate to thesis
- [x] This roadmap document

---

## Phase 1 — Ownership primitive (schema foundation)

**Goal:** One object represents "customer owns / participates in asset after pay."

### Proposed schema

```
ownerships
  id, businessId, customerId (or phone/email hash)
  assetType: product | dining_relationship | completed_work | attendance
  assetId (FK to product/job/event/ticket/order)
  status: active | transferred | end_of_life
  purchasedAt, transferredAt

lifecycle_events
  id, ownershipId, type (purchase|receipt|warranty|return|checkpoint|recovery|...)
  payload JSON, createdAt

checkpoints (merchant-defined templates)
  id, businessId, triggerType (time|usage|season|...)
  triggerConfig JSON, actionType (reminder|offer|inspection|...)
  actionConfig JSON

checkpoint_runs (instances per ownership)
  id, ownershipId, checkpointId, status, scheduledAt, completedAt
```

### Wedge

On Stripe webhook `checkout.session.completed`, create `ownership` + `lifecycle_event(purchase)`.

### Files (future)

- `src/server/db/schema.ts` — new tables
- `src/server/ownership/` — domain logic
- Stripe webhook route
- `src/app/m/_components/dashboard-page-view.tsx` — active ownerships

### Spec to write first

`docs/superpowers/specs/ownership-primitive.md`

---

## Phase 2 — Lifecycle UI per vertical

Extend merchant pages (do not replace checkout UI):

| Vertical | Page | New sections |
|----------|------|--------------|
| Shop (`/m/store`) | Returns, warranty, trade-in eligibility |
| Restaurant (`/m/restaurant`) | Reorder cadence, empty-table promos, loyalty |
| Services (`/m/services`) | Follow-up inspections, seasonal reminders, repeat booking |
| Event (`/m/event`) | Transfer, waitlist resale, post-event merch |

### Shared components (`src/verticals/shared/`)

- `OwnershipTimeline`
- `CheckpointEditor`
- `RecoveryPathCard`

### Config

Add `lifecycleModes[]` to `src/verticals/types.ts` alongside `shareModes[]`.

---

## Phase 3 — Recovery paths

No terminal failures — every dead end offers a fork.

| Failure state | Recovery path | Vertical |
|---------------|---------------|----------|
| Return window expired | Merchant buyback | Shop |
| Table empty | Happy hour / promo | Restaurant |
| Appointment cancelled | Fill from waitlist | Services |
| Ticket unused | Waitlist resale | Event |
| Receipt forgotten | SMS tonight | All |
| Customer inactive N days | Lifecycle outreach | All |

**Schema:** `recovery_templates` + `recovery_runs` linked to `ownershipId`.

**UI:** `/m/settings` or per-vertical Recovery section.

---

## Phase 4 — SMS proactive layer

Thesis: merchants and customers should not need to remember Lume.

- SMS provider (Twilio or similar) — `src/server/sms/`
- Triggers from `checkpoint_runs` and `recovery_runs`
- Wire `paymentReminder` share mode to real sends
- Default templates from thesis examples; per-business overrides in DB

---

## Phase 5 — Lume Shop (ownership-quality discovery)

Not SKU-first ecommerce — **merchant discovery by ownership experience**.

- Shopper routes (e.g. `/shop`)
- Profiles ranked by lifecycle signals (warranty, buyback, response time)
- Ownership badges on merchant cards
- Shopper identity across merchants (Kinde shopper role or phone wallet)

---

## Phase 6 — AI ownership intelligence

AI assists merchants; does not replace them.

**Predict:** resale value, maintenance timing, churn, reorder likelihood, demand.

**Recommend:** next checkpoint, best recovery path, merchant inventory matches.

**Implementation:** `src/server/ai/`, Vercel AI Gateway, cron via `CRON_SECRET`. Dashboard suggestion cards — dismissible, not auto-execute.

---

## Phase 7 — Landing narrative

Update `src/app/_components/landing.tsx`:

- Hero: ownership begins at checkout
- Features: lifecycle, recovery, checkpoints — not only conversion speed
- Lume Shop: ownership-quality discovery
- Keep speed/trust principles as supporting ownership

---

## Execution order

1. Phase 0 ✅
2. Phase 1 spec → build (ownership + Stripe webhook)
3. Phase 2–3 (lifecycle UI + one recovery path per vertical)
4. Phase 4 (SMS)
5. Phase 5–6 (Lume Shop + AI, parallel once ownership data exists)
6. Phase 7 (landing copy)

---

## Claude CLI guardrails

Do not without thesis check:

- Ship features that end at payment with no ownership record
- Treat failures as terminal only
- Build Lume Shop as SKU catalog without ownership signals
- Auto-send messages without checkpoint/recovery context

See [CLAUDE_WORKFLOW.md](../CLAUDE_WORKFLOW.md).
