/**
 * The commerce boundary state machine.
 * See docs/superpowers/specs/agent-commerce-boundary.md
 *
 * Transitions are append-only: every one writes a PurchaseIntentEvent. The audit
 * trail is the product, so nothing here mutates status without recording why.
 */

import type { PurchaseIntentLineItem } from "@/server/db/schema";

export type PurchaseIntentStatus =
  | "draft"
  | "quoted"
  | "authorized"
  | "confirmed"
  | "fulfilled"
  | "declined"
  | "cancelled"
  | "expired";

const TRANSITIONS: Record<PurchaseIntentStatus, PurchaseIntentStatus[]> = {
  draft: ["quoted", "cancelled", "expired"],
  quoted: ["quoted", "authorized", "declined", "expired", "cancelled"],
  authorized: ["confirmed", "declined", "cancelled", "quoted"],
  confirmed: ["fulfilled", "cancelled"],
  fulfilled: [],
  declined: [],
  cancelled: [],
  expired: [],
};

export function canTransition(
  from: PurchaseIntentStatus,
  to: PurchaseIntentStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isTerminal(status: PurchaseIntentStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export function totalAmount(items: PurchaseIntentLineItem[]): number {
  return items.reduce((sum, i) => sum + i.unitAmount * i.quantity, 0);
}

export type Delegation = {
  agent: string;
  maxTransaction: number | null;
  requiresConfirmationAbove: number | null;
  categories: string[] | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

export type PolicyDecision = {
  allowed: boolean;
  /** Always a reason, never a bare boolean — merchant and buyer both need why. */
  reason: string;
  requiresHumanConfirmation: boolean;
};

/**
 * Deterministic policy evaluation. No network, no clock reads beyond `now`, so
 * the same inputs always produce the same decision and it can be replayed from
 * the audit log.
 */
export function evaluatePolicy(params: {
  amount: number;
  category?: string | null;
  delegation: Delegation | null;
  now: Date;
}): PolicyDecision {
  const { amount, category, delegation, now } = params;

  if (amount <= 0) {
    return {
      allowed: false,
      reason: "Amount must be greater than zero.",
      requiresHumanConfirmation: false,
    };
  }

  // A human buying directly authorizes by their own action.
  if (!delegation) {
    return {
      allowed: true,
      reason: "Direct purchase by the account holder.",
      requiresHumanConfirmation: false,
    };
  }

  if (delegation.revokedAt) {
    return {
      allowed: false,
      reason: "Delegation has been revoked.",
      requiresHumanConfirmation: false,
    };
  }

  if (delegation.expiresAt && delegation.expiresAt <= now) {
    return {
      allowed: false,
      reason: "Delegation expired.",
      requiresHumanConfirmation: false,
    };
  }

  if (delegation.maxTransaction !== null && amount > delegation.maxTransaction) {
    return {
      allowed: false,
      reason: `Amount exceeds the delegated limit for ${delegation.agent}.`,
      requiresHumanConfirmation: false,
    };
  }

  if (
    delegation.categories !== null &&
    (!category || !delegation.categories.includes(category))
  ) {
    return {
      allowed: false,
      reason: category
        ? `Category "${category}" is outside this delegation.`
        : "Delegation restricts categories but none was supplied.",
      requiresHumanConfirmation: false,
    };
  }

  // Above the threshold a human must confirm — an agent asserting prior consent
  // never satisfies this.
  const needsConfirmation =
    delegation.requiresConfirmationAbove !== null &&
    amount > delegation.requiresConfirmationAbove;

  return {
    allowed: true,
    reason: needsConfirmation
      ? "Within delegated limits; human confirmation required."
      : "Within delegated limits.",
    requiresHumanConfirmation: needsConfirmation,
  };
}

/**
 * Re-pricing after authorization invalidates it. An agent authorized $58 must
 * never end up paying $92, so the intent drops back to `quoted`.
 */
export function repricingInvalidatesAuthorization(
  status: PurchaseIntentStatus,
  previousAmount: number | null,
  nextAmount: number,
): boolean {
  if (previousAmount === null) return false;
  if (nextAmount === previousAmount) return false;
  return status === "authorized" || status === "confirmed";
}
