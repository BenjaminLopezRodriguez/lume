/**
 * Tool classification and confirmation policy.
 *
 * Pure and deterministic: the same tool always lands in the same class, and the
 * class alone decides whether a human must confirm. Kept free of the database
 * and the model so it can be exercised by policy.check.ts.
 *
 * The model proposes. This decides what may run without asking.
 */

export type ToolClass =
  /** Reads only. Safe to run without asking. */
  | "READ"
  /** Creates or edits merchant data. Confirm before running. */
  | "WRITE"
  /** Moves money. Always confirm, without exception. */
  | "FINANCIAL"
  /** Removes or archives. Always confirm. */
  | "DESTRUCTIVE"
  /** Touches an external system (DNS, provider config). Always confirm. */
  | "EXTERNAL";

/**
 * Every tool the model can be offered, and its class. A tool absent from this
 * map cannot be executed — see requireClass. That is deliberate: an unclassified
 * tool would otherwise default to running unconfirmed.
 */
export const TOOL_CLASS = {
  // Business
  business_get: "READ",
  business_get_setup_status: "READ",
  // Catalog
  product_list: "READ",
  product_create: "WRITE",
  // Orders — read only. No refund/cancel domain capability exists yet.
  order_list: "READ",
  // Customers
  customer_list: "READ",
  // Channels
  qr_list: "READ",
  qr_create: "WRITE",
  qr_remove: "DESTRUCTIVE",
  store_get: "READ",
  // Analytics — order counts only; revenue attribution does not exist yet.
  analytics_orders_by_channel: "READ",
  // Diagnostics
  diagnostics_setup: "READ",
} as const satisfies Record<string, ToolClass>;

export type ToolName = keyof typeof TOOL_CLASS;

export function isKnownTool(name: string): name is ToolName {
  return Object.hasOwn(TOOL_CLASS, name);
}

/** Throws for an unclassified tool rather than assuming it is safe. */
export function requireClass(name: string): ToolClass {
  if (!isKnownTool(name)) {
    throw new Error(`Unclassified tool: ${name}`);
  }
  return TOOL_CLASS[name];
}

/**
 * Only READ runs unattended. Everything that changes merchant state, moves
 * money, deletes, or reaches an external system waits for a human.
 */
export function requiresConfirmation(name: string): boolean {
  return requireClass(name) !== "READ";
}

/** Per-run limits. A runaway loop is a bug that costs the merchant money. */
export const RUN_LIMITS = {
  maxToolCalls: 15,
  maxMutations: 5,
  maxRuntimeMs: 60_000,
} as const;

export type RunTally = { toolCalls: number; mutations: number; startedAt: number };

export function newTally(now: number): RunTally {
  return { toolCalls: 0, mutations: 0, startedAt: now };
}

export type BudgetVerdict = { ok: true } | { ok: false; reason: string };

/** Checked before every tool call, not merely at the end of a run. */
export function checkBudget(
  tally: RunTally,
  name: string,
  now: number,
): BudgetVerdict {
  if (tally.toolCalls >= RUN_LIMITS.maxToolCalls) {
    return { ok: false, reason: "Reached the tool-call limit for one request." };
  }
  if (now - tally.startedAt >= RUN_LIMITS.maxRuntimeMs) {
    return { ok: false, reason: "Reached the time limit for one request." };
  }
  if (requiresConfirmation(name) && tally.mutations >= RUN_LIMITS.maxMutations) {
    return { ok: false, reason: "Reached the change limit for one request." };
  }
  return { ok: true };
}

export function recordCall(tally: RunTally, name: string): RunTally {
  return {
    ...tally,
    toolCalls: tally.toolCalls + 1,
    mutations: tally.mutations + (requiresConfirmation(name) ? 1 : 0),
  };
}
