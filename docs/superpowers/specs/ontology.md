# Spec — Lume ontology

Status: **authoritative vocabulary** · Companion to [agent-commerce-boundary.md](./agent-commerce-boundary.md)

The product was organized around *ways of entering Lume* (Entry Points, Share,
Connect In/Out). That forced merchants to reverse-engineer internal
product-design terms. This fixes the ontology first; the UX follows from it.

## Six nouns

| Noun | Means | Merchant nav |
|------|-------|--------------|
| **Catalog** | what can be purchased | Catalog |
| **Channels** | where purchases originate | Channels |
| **Orders** | what is being purchased | Orders |
| **Customers** | who the purchase belongs to | Customers |
| **Agents** | who can act for customers | Agents |
| **Connections** | external systems Lume talks to | Integrations |

```
              LUME
Catalog ────────────────┐
                        │
Channels ───────────→ Orders ←──────── Agents
                        │
                        ↓
                    Customers
                        │
                        ↓
                    Payments
                        │
                        ↓
                   Connections
```

Every channel — website, payment link, QR, POS, API, agent — creates or
manipulates the same primitives. Agent commerce is structurally equivalent to
browser commerce, not a separate AI product bolted on.

## PurchaseIntent and Order are one pipeline

Two nouns, one lifecycle, with the boundary at **confirm**:

```
PurchaseIntent  (pre-purchase)        Order  (post-purchase)
  draft                                 confirmed
  quoted              ──── confirm ───▶ fulfilled
  authorized                            cancelled
  declined / expired                    refunded
```

- Before confirm, the thing is a **PurchaseIntent**: negotiable, re-priceable,
  subject to policy evaluation. This is what an agent manipulates.
- At confirm it becomes an **Order**: a commitment with a customer, a payment,
  and a fulfillment. This is what a merchant manages.

So: the agent-facing API says `purchase-intents`, the merchant UI says
**Orders**, and neither is renamed to match the other. They are different
phases, not competing names for one thing.

Ownership begins where the Order lands — see [thesis.md](../../../thesis.md).

## Internal primitives are not navigation labels

The recurring principle:

> Interesting internal primitives don't necessarily make good navigation labels.

`Ownership` is a genuinely useful primitive and stays as the domain module,
tables, and thesis vocabulary. Merchants never see the word — they see
**Customers**, and the ownership record is what powers that screen.

Applied renames (user-facing only, no server/table/type renames):

| Was | Problem | Now |
|-----|---------|-----|
| Share | an action, not an object | Checkout |
| Entry Points | internal product-design term | Channels |
| Ownership | ambiguous to a merchant | Customers |
| Connect → In / Out | not inferable | Integrations |

## Merchant vocabulary vs internal vocabulary

The merchant is not the audience for the commerce engine. They think in Shopify
terms; the engine keeps its own names underneath.

| Merchant sees | Backed by |
|---------------|-----------|
| Home | dashboard |
| Orders | `orders` + `source` attribution |
| Products | `products`, `storefronts` |
| Customers | `ownerships` |
| Sales channels → Online store / Payment links / QR codes | `webPresences`, `qrCodes` |
| Agents | `delegations` + `evaluatePolicy` |
| "Approval required", "Order confirmed" | `purchaseIntents.status` |

A merchant must be able to use Lume without knowing what a PurchaseIntent, an API,
MCP, or ACP is. Infrastructure vocabulary appears only when someone deliberately
enters a developer or advanced surface.

**A control ships only if flipping it changes server-side behaviour.** A toggle with
no backing field is a lie about capability, and so is a protocol badge reading
"Active" for something unimplemented.

## Order source attribution

`orders.source` is the channel the purchase came through — `web`, `qr`,
`payment_link`, `api`, `agent`. It is deliberately separate from `orders.platform`,
which records the delivery marketplace when there is one. Source is nullable: orders
predating attribution render "Unknown" rather than being guessed at.

## Convergence target

Routes, API resources, permissions, event types and agent tools should
converge on this vocabulary:

```
/catalog  /channels  /orders  /customers  /agents  /connections
```

with tools named `catalog.search`, `order.quote`, `order.create`,
`order.cancel`, `customer.authorize_agent`, `agent.request_purchase`.

## Not yet built

Orders, Catalog, Agents, and API & webhooks have no merchant pages. They are
**deliberately absent from the sidebar** rather than linked — this repo shipped
24 dead `href="#"` links earlier and the fix is not to re-create them under
better names. Nav grows when the destination exists.
