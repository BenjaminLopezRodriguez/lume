# Lume — Claude Code context

## Required reading order

Before product, schema, or merchant-flow changes:

1. **[thesis.md](./thesis.md)** — north star. All decisions must align with ownership-first commerce.
2. **[PRODUCT.md](./PRODUCT.md)** + **[VERTICALS.md](./VERTICALS.md)** — operational product and vertical primitives.
3. **[docs/THESIS_MAP.md](./docs/THESIS_MAP.md)** — thesis concepts mapped to current code and gaps.

For implementation phases, see **[docs/superpowers/plans/ownership-roadmap.md](./docs/superpowers/plans/ownership-roadmap.md)**.

Session workflow: **[docs/CLAUDE_WORKFLOW.md](./docs/CLAUDE_WORKFLOW.md)**.

## Register

**Ownership starts at checkout.** Checkout is the wedge; ownership is the product.

## Stack

- **Framework:** Next.js 15 App Router, React 19, TypeScript
- **API:** tRPC 11 (`src/server/api/`)
- **DB:** PostgreSQL + Drizzle ORM (`src/server/db/schema.ts`)
- **Auth:** Kinde (`@kinde-oss/kinde-auth-nextjs`), middleware protects `/m/*`
- **Payments:** Stripe payment links (`src/server/stripe.ts`)
- **Merchant app:** `/m/*` (sidebar shell, tRPC client)
- **Public storefront:** `/s/[slug]` (Shop vertical)
- **Vertical config:** `src/verticals/types.ts` (`VERTICAL_CONFIG`, share modes)

## Commands

```bash
pnpm dev          # local dev (turbo)
pnpm typecheck    # tsc --noEmit
pnpm db:push      # push Drizzle schema to DATABASE_URL
pnpm build        # production build
```

## Non-obvious gotchas

- **tRPC queries** must return `null`, not `undefined`, when empty (e.g. `business.getActive`).
- **Stripe** is lazy-initialized; `STRIPE_SECRET_KEY` optional at build time via `SKIP_ENV_VALIDATION`.
- **Connect** nav item is restaurant-only (`app-sidebar.tsx`).
- **Active business** = most recently updated business for owner (no separate `activeBusinessId` column yet).
- Code uses `store` type; thesis/docs use **Shop** — same vertical.

## Decision rules

1. If a feature only improves checkout conversion and creates no ownership/lifecycle record, flag it as **Phase 1+** unless explicitly scoped as wedge work.
2. Never treat returns, cancellations, empty tables, or unused tickets as terminal errors only — propose a **recovery path** per thesis.
3. Do not build Lume Shop as SKU-first catalog without ownership-quality signals.
4. Do not auto-send SMS without checkpoint or recovery context.
5. Spec before code: `docs/superpowers/specs/` then `docs/superpowers/plans/` before implementation.

## Doc hierarchy

```
thesis.md                    ← why (immutable intent)
PRODUCT.md                   ← who, brand, principles
VERTICALS.md                 ← verticals + UI primitives + lifecycles
docs/THESIS_MAP.md           ← thesis ↔ code gaps
docs/superpowers/specs/      ← feature specs
docs/superpowers/plans/      ← implementation plans
```

## Audit trail

After significant doc or feature work, append one line to `.claude/memory.md`.
