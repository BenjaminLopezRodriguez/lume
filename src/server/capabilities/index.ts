import "server-only";

export { CAPABILITY_EVENTS, subscribe, emit } from "./events";
export type { CapabilityEvent, CapabilityEventType } from "./events";

// Lifecycle hook interface for capability implementors
export type CapabilityHooks = {
  beforeCreate?: () => void | Promise<void>;
  afterCreate?: () => void | Promise<void>;
  beforeTransfer?: () => void | Promise<void>;
  afterTransfer?: () => void | Promise<void>;
  beforeComplete?: () => void | Promise<void>;
  afterComplete?: () => void | Promise<void>;
};
