import type {
  ownershipCheckpointRuns,
  ownershipCheckpoints,
  ownershipEvents,
  ownerships,
} from "@/server/db/schema";

export type Ownership = typeof ownerships.$inferSelect;
export type OwnershipInsert = typeof ownerships.$inferInsert;
export type OwnershipEvent = typeof ownershipEvents.$inferSelect;
export type OwnershipEventInsert = typeof ownershipEvents.$inferInsert;
export type OwnershipCheckpoint = typeof ownershipCheckpoints.$inferSelect;
export type OwnershipCheckpointRun = typeof ownershipCheckpointRuns.$inferSelect;
