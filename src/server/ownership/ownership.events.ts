export const OWNERSHIP_EVENT = {
  PURCHASE: "purchase",
  RECEIPT: "receipt",
  DELIVERY: "delivery",
  WARRANTY_REGISTERED: "warranty_registered",
  INSPECTION_COMPLETED: "inspection_completed",
  MAINTENANCE_SCHEDULED: "maintenance_scheduled",
  SUPPORT_CONTACT: "support_contact",
  CHECKPOINT_TRIGGERED: "checkpoint_triggered",
  CHECKPOINT_ACKNOWLEDGED: "checkpoint_acknowledged",
  TRADE_IN_OFFERED: "trade_in_offered",
  TRANSFER_INITIATED: "transfer_initiated",
  TRANSFER_COMPLETED: "transfer_completed",
  OWNERSHIP_COMPLETED: "ownership_completed",
} as const;

export type OwnershipEventType =
  (typeof OWNERSHIP_EVENT)[keyof typeof OWNERSHIP_EVENT];
