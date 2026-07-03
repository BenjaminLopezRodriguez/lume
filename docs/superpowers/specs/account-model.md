# Account Model

> The operating system for Lume. Defines the platform primitives — not merchant types.

---

## The hierarchy

```
Platform
└── Account
      ├── belongs to User(s)
      ├── belongs to Account Group (optional)
      └── owns Capability Sets
              └── Capability
                      ├── Events
                      ├── Policies
                      ├── Permissions
                      └── Data
```

---

## Account

Not "merchant." Not "business." Account.

An account is any entity that uses Lume — restaurant, nonprofit, contractor, artist, franchise location. The word "merchant" is a checkout-era assumption. Accounts exist before and after a transaction.

An account:
- belongs to one or more users
- optionally belongs to an Account Group
- owns one or more Capability Sets
- produces and consumes events

---

## Account Group

Accounts that share ownership or hierarchy belong to a group. Groups enable capability inheritance and cross-account reporting.

```
McDonald's Corporate          Acme Construction       Wedding Co.
├── Store #12                 ├── Residential         ├── Catering
├── Store #13                 ├── Commercial          ├── Photography
└── Store #14                 └── Roofing             └── Rentals
```

A child account inherits the group's Capability Set by default and can extend or restrict it. Groups are optional — a solo account needs none.

---

## Capability Set

The killer abstraction. Instead of asking "what type of business are you?" ask "what capabilities do you need?"

A Capability Set is a named collection of capabilities. Predefined stacks ship out of the box:

| Stack | Capabilities |
|---|---|
| Restaurant | Checkout, Tables, Reservations, Delivery, Inventory, Kitchen, Ownership |
| Retail | Catalog, Inventory, Returns, Ownership, Resale |
| Contractor | Jobs, Invoices, Scheduling, Ownership, Maintenance |
| Artist | Checkout, Ownership, Bookings, Messaging, Gallery |
| Event Organizer | Checkout, Tickets, Ownership, Messaging |

Stacks are defaults, not constraints. Any account can add or remove capabilities.

A new vertical (veterinarian, auto shop, law firm) requires no new architecture — just a new composition.

---

## Capabilities

Each capability is a self-contained module. It owns its routes, UI, data, and event contracts.

**Core capabilities:**

| Capability | Description |
|---|---|
| `Checkout` | Payment links, sessions, conversion |
| `Ownership` | Post-purchase relationships, lifecycle, checkpoints |
| `Messaging` | Email, SMS, in-app notifications |
| `Inventory` | Stock tracking, low-inventory signals |
| `Reservations` | Tables, time slots, deposits |
| `Tickets` | Event tiers, check-in codes, capacity |
| `Invoices` | Jobs, line items, payment links |
| `Returns` | Return requests, resolution paths |
| `Buybacks` | Trade-in offers, resale signals |
| `Support` | Contact log, resolution center |
| `Analytics` | Revenue, engagement, lifecycle metrics |

Ownership appears in every stack. It is the connective tissue.

---

## Events

Capabilities do not call each other directly. They communicate through events.

```
ownership.created
    ↓ Messaging  → send welcome receipt
    ↓ Analytics  → log acquisition
    ↓ Checkpoints → schedule follow-ups
    ↓ Rewards    → credit points
    ↓ AI         → personalize next touchpoint
```

```
ownership.checkpoint_due
    ↓ Messaging → trigger SMS or email
    ↓ Support   → open resolution ticket if no response
```

Nobody depends on Checkout directly. They subscribe to what Checkout produces.

**Ownership event contracts:**

```
ownership.created
ownership.transferred
ownership.completed
ownership.checkpoint_due
ownership.buyback_requested
ownership.return_requested
```

**Lifecycle hooks (capability-level):**

```
OwnershipCapability
  beforeCreate()
  afterCreate()
  beforeTransfer()
  afterTransfer()
  beforeComplete()
  afterComplete()
```

---

## Onboarding (new model)

**Today:**
```
Create Restaurant → hardcoded type
```

**With Account Model:**
```
Create Account
  ↓
Choose Capability Set  (or compose custom)
  ↓
Customize settings
  ↓
Done
```

A veterinarian tomorrow: new Capability Set, no new architecture.

---

## Relationship to current code

| Current | Account Model equivalent |
|---|---|
| `businesses.type` | Capability Set name |
| `business` table | `accounts` table |
| vertical page views | per-capability UI modules |
| `VERTICAL_CONFIG` | Capability Set registry |
| `BUSINESS_ROUTES` | capability route map |
| ownership domain | `Ownership` capability (already built) |

The current `business.type` enum (`restaurant`, `store`, `services`, `event`) maps 1:1 to predefined stacks. Migration path: rename concept, keep data — no schema break required to introduce Account Groups and Capability Sets as additive layers.

---

## What this changes

**Lume stops being** software for restaurants, stores, and contractors.

**Lume becomes** a platform where an account assembles the capabilities it needs, and those capabilities communicate through events.

New industries don't require new architectures. They require new compositions.

That is the hallmark of a platform.

---

## Open questions

- Account Group membership: hard hierarchy or many-to-many?
- Capability Set versioning: how do breaking changes propagate to child accounts?
- Permission model: does a Capability Set define what users can do, or is that separate?
- Custom capabilities: can accounts build their own, or only compose from the registry?
