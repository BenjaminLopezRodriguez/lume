# Ownership

Ownership is the core abstraction of Lume.

Every purchase creates an Ownership.

Every meaningful action after checkout occurs through Ownership.

Ownership is not an order.

Ownership is not a payment.

Ownership is not a receipt.

Ownership is the living relationship between:

Merchant

↓

Customer

↓

Asset

---

# Why Ownership Exists

Traditional commerce software models payments.

Lume models relationships.

Payments end.

Ownership continues.

Examples:

A purchased laptop

↓

Battery degrades

↓

Warranty expires

↓

Customer upgrades

↓

Old laptop traded in

↓

Ownership transfers

The payment happened once.

Ownership evolved for years.

---

# Ownership Lifecycle

Every Ownership progresses through states.

```
Checkout

↓

Created

↓

Active

↓

Maintained

↓

Modified

↓

Transferred

↓

Completed
```

Individual verticals may introduce additional states.

The lifecycle always remains finite.

---

# Ownership States

## Created

Ownership has been established.

Payment succeeded.

Receipt generated.

Customer now owns an asset.

---

## Active

The customer currently possesses the asset.

Most ownership exists here.

Examples:

Using a product

Living with an appliance

Regular restaurant customer

Maintained service

---

## Pending Action

Ownership requires attention.

Examples:

Maintenance due

Warranty expiring

Battery degrading

Inspection required

Customer has not acknowledged checkpoint

---

## Transferred

Ownership moved.

Examples:

Resale

Gift

Trade-In

Buyback

Ticket transfer

Transfer creates a new Ownership.

---

## Completed

Ownership no longer exists.

Examples:

Consumed

Destroyed

Expired

Recycled

Disposed

Completed ownership remains historically important.

History is never deleted.

---

# Ownership Properties

Every Ownership contains:

Merchant

Customer

Asset

Purchase

Current State

Lifecycle

Events

Checkpoints

Condition Reports

Offers

Relationships

History

Recommendations

Recovery Path

Ownership is a chronological record.

Example:

Purchase

↓

Receipt

↓

Delivery

↓

Battery Check

↓

Maintenance

↓

Trade-In Offer

↓

Transfer

↓

Completed

Every event becomes permanent history.

---

# Ownership Events

Events mutate ownership.

Examples:

Purchase

Delivery

Warranty Registered

Inspection Completed

Battery Health Submitted

Maintenance Scheduled

Support Conversation

Trade-In Offered

Ownership Transferred

Ownership Completed

Events never replace history.

They append history.

---

# Ownership Checkpoints

Ownership contains merchant-defined checkpoints.

Example:

Purchase

↓

30 Days

Customer Satisfaction

↓

180 Days

Battery Check

↓

365 Days

Trade-In Opportunity

↓

730 Days

Replacement Offer

Ownership should become progressively more valuable.

Not progressively forgotten.

---

# Ownership Policies

Every merchant defines ownership behavior.

Examples:

Return window

Warranty duration

Maintenance schedule

Trade-In eligibility

Buyback eligibility

Inspection requirements

Communication preferences

Policies shape the lifecycle.

---

# Ownership Intelligence

AI reasons over Ownership.

Examples:

Predict battery degradation.

Predict customer churn.

Predict maintenance timing.

Predict resale value.

Predict replacement likelihood.

Predict reorder probability.

AI never operates directly on payments.

AI operates on ownership.

---

# Ownership Relationships

One customer

↓

Many ownerships

One merchant

↓

Many ownerships

One asset

↓

Multiple ownerships over time

Ownership connects every participant.

---

# Ownership Transfer

Transfer does not modify ownership.

Transfer ends one Ownership.

Transfer creates another.

Example:

Customer

↓

Trade-In

↓

Merchant

↓

Resale

↓

New Customer

Three ownerships.

One asset.

Continuous history.

---

# Ownership History

History belongs to the asset.

Not merely the owner.

Examples:

Manufactured

Purchased

Maintained

Battery replaced

Inspection passed

Transferred

Repair completed

Future owners benefit from previous history.

---

# Ownership Identity

Every Ownership receives a globally unique identifier.

Ownership IDs should never change.

Ownership survives:

Payment changes

Address changes

Customer profile changes

Lifecycle changes

Ownership is permanent.

---

# Ownership API

Every capability should begin with Ownership.

Instead of:

Get Orders

Think:

Get Ownerships

Instead of:

Create Warranty

Think:

Attach Warranty to Ownership

Instead of:

Create Trade-In

Think:

Create Transfer for Ownership

Ownership is the API surface.

Not Orders.

---

# Vertical Examples

## Retail

Ownership

↓

Warranty

↓

Maintenance

↓

Trade-In

↓

Resale

---

## Restaurant

Relationship

↓

Reservation

↓

Dining History

↓

Reorders

↓

Special Events

↓

Loyalty

Ownership represents the ongoing dining relationship.

---

## Services

Completed Work

↓

Inspection

↓

Maintenance

↓

Renewal

↓

Replacement

Ownership represents responsibility after completion.

---

## Events

Ticket

↓

Attendance

↓

Media

↓

Future Invitations

↓

Membership

Ownership extends beyond attendance.

---

# Engineering Rules

Never attach long-term concepts directly to Orders.

Attach them to Ownership.

Orders disappear.

Ownership compounds.

---

# Product Rule

Every feature proposal should answer:

How does this improve Ownership?

If the answer is unclear,

the feature probably belongs somewhere else.

---

# The Mental Model

Traditional Commerce

Payment

↓

Done

---

Lume

Payment

↓

Ownership Begins

↓

Lifecycle

↓

Events

↓

Checkpoints

↓

Recovery

↓

Transfer

↓

Future Ownership

Commerce does not end.

It evolves.
