# Spec — The commerce boundary (humans, apps, agents)

Status: **phase 1 in progress** · Supersedes nothing · See [thesis.md](../../../thesis.md)

## Why this exists

Lume's checkout currently assumes a human holding a phone. The initiator is
increasingly not a human: an assistant books dinner, a procurement system
reorders stock, a vertical agent buys on a delegated budget.

The merchant should not have to care which interface started the transaction.

## Thesis alignment

This does **not** replace the ownership thesis. It composes with it:

```
discover → quote → authorize → transact → fulfill → prove
                                            │
                                            └─→ ownership begins here
```

thesis.md says ownership begins at checkout. This spec defines *what crosses the
boundary into checkout* and, critically, **what proof survives it**. The audit
trail is the handoff: an `Ownership` record created from a `PurchaseIntent`
inherits a verifiable account of who asked, who authorized, and under what limit.

Agentic commerce makes the ownership thesis *more* load-bearing, not less — when
a buyer never saw the merchant, the post-purchase record is the entire
relationship.

## The core abstraction

The web page is not the product. `PurchaseIntent` is the product; the checkout
page is one renderer of it.

```
PurchaseIntent
  merchant        business the intent is against
  items           line items + amounts
  purchaser       human | application | agent
  delegation      nullable — the authority the purchaser is acting under
  authorization   policy evaluation + payment authorization
  fulfillment     how and when
  status          state machine below
```

An agent does not need HTML. A browser does. A QR code points to one. A wallet
authorizes one. Same object.

## State machine

```
  draft ──▶ quoted ──▶ authorized ──▶ confirmed ──▶ fulfilled
              │            │              │
              ├──▶ declined│              └──▶ cancelled
              └──▶ expired └──▶ declined
```

Transitions are append-only; every one writes a `PurchaseIntentEvent`. Nothing
is mutated in place, because the audit trail is the differentiator.

| From | To | Trigger | Guard |
|------|-----|---------|-------|
| draft | quoted | merchant returns priced items | items non-empty, amount > 0 |
| quoted | authorized | policy + payment approval | within delegation limits |
| quoted | declined | policy evaluation fails | — |
| quoted | expired | `expiresAt` passes | — |
| authorized | confirmed | human confirmation, or auto below threshold | — |
| authorized | declined | human rejects | — |
| confirmed | fulfilled | merchant marks delivered | — |
| confirmed | cancelled | either party cancels | before fulfillment |

**Amount changes after quote invalidate authorization.** If the merchant
re-prices, the intent returns to `quoted` and must be re-authorized. This is the
whole point: an agent authorized $58 must not end up paying $92.

## Delegation

A delegation is the authority envelope a non-human purchaser acts under.

```jsonc
{
  "buyer": "usr_...",                       // the human who remains liable
  "agent": "openai:shopping-agent",         // opaque agent identifier
  "permissions": {
    "max_transaction": 15000,               // minor units
    "categories": ["restaurants"],
    "requires_confirmation_above": 7500,
    "expires_at": "2026-09-01T00:00:00Z"
  }
}
```

Policy evaluation on `authorize` is deterministic and produces a reason, not a
boolean — the merchant and the buyer both need to know *why*.

## Phase 1 scope (this change)

Built:

- `purchase_intent`, `delegation`, `purchase_intent_event` tables
- State machine + deterministic policy evaluation
- `GET  /.well-known/lume-commerce` — capability discovery
- `POST /api/commerce/purchase-intents`
- `POST /api/commerce/purchase-intents/:id/authorize`
- `POST /api/commerce/purchase-intents/:id/confirm`
- `GET  /api/commerce/purchase-intents/:id`

Deliberately **not** built yet:

- Payment execution on confirm (currently records authorization only; Stripe
  wiring is a follow-up so the state machine can be verified in isolation)
- `search()` / `reserve()` / `refund()` verbs
- MCP adapter — protocols move, the state machine is the moat. MCP becomes a
  thin adapter over these endpoints, never the interface itself.
- Agent marketing on the landing page. It ships when the flow it depicts
  actually executes.

## Discovery

`/.well-known/lume-commerce` lets an agent learn what a Lume merchant supports
without a human reading docs:

```jsonc
{
  "version": "2026-08-20",
  "checkout": true,
  "quotes": true,
  "agent_purchase": true,
  "human_confirmation": "over_100_usd",
  "endpoints": { "purchase_intents": "/api/commerce/purchase-intents" }
}
```

## Non-goals

- Do not design around MCP. Support it as an adapter.
- Do not expose merchant catalogs publicly until per-merchant opt-in exists.
- Do not auto-confirm above a delegation's confirmation threshold, ever, even
  when the agent asserts prior consent.
