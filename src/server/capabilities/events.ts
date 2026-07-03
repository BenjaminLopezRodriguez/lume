import "server-only";

// All ownership event type slugs per account-model spec
export const CAPABILITY_EVENTS = {
  OWNERSHIP_CREATED: "ownership.created",
  OWNERSHIP_TRANSFERRED: "ownership.transferred",
  OWNERSHIP_COMPLETED: "ownership.completed",
  OWNERSHIP_CHECKPOINT_DUE: "ownership.checkpoint_due",
  OWNERSHIP_BUYBACK_REQUESTED: "ownership.buyback_requested",
  OWNERSHIP_RETURN_REQUESTED: "ownership.return_requested",
} as const;

export type CapabilityEventType = (typeof CAPABILITY_EVENTS)[keyof typeof CAPABILITY_EVENTS];

export type CapabilityEvent = {
  type: CapabilityEventType;
  payload: Record<string, unknown>;
};

type Handler = (event: CapabilityEvent) => void | Promise<void>;

// In-process pub/sub — no external deps, no persistence
const subscribers = new Map<string, Set<Handler>>();

export function subscribe(type: CapabilityEventType, handler: Handler): () => void {
  if (!subscribers.has(type)) subscribers.set(type, new Set());
  subscribers.get(type)!.add(handler);
  // returns unsubscribe fn
  return () => subscribers.get(type)?.delete(handler);
}

export async function emit(type: CapabilityEventType, payload: Record<string, unknown>): Promise<void> {
  const handlers = subscribers.get(type);
  if (!handlers) return;
  await Promise.all([...handlers].map((h) => h({ type, payload })));
}
