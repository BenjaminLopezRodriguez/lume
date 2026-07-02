import type { OwnershipStatus } from "./ownership.types";

const VALID_TRANSITIONS: Record<OwnershipStatus, OwnershipStatus[]> = {
  active: ["pending_action", "transferred", "completed"],
  pending_action: ["active", "transferred", "completed"],
  transferred: [],
  completed: [],
};

export function canTransition(from: OwnershipStatus, to: OwnershipStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function isTerminal(status: OwnershipStatus): boolean {
  return status === "transferred" || status === "completed";
}
