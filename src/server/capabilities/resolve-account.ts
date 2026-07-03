// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: resolveAccountCapabilities from custom_capability_sets (not business.type).
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import type { Capability } from "@/verticals/capabilities";
import { CAPABILITIES } from "@/verticals/capabilities";
import type { db } from "@/server/db";

type Database = typeof db;

export function normalizeCapabilities(values: string[]): Capability[] {
  const allowed = new Set<string>(CAPABILITIES);
  return [...new Set(values)].filter((v): v is Capability => allowed.has(v));
}

export async function resolveAccountCapabilities(
  database: Database,
  businessId: string,
): Promise<Capability[]> {
  const sets = await database.query.customCapabilitySets.findMany({
    where: (row, { eq: equals }) => equals(row.businessId, businessId),
  });

  const merged: string[] = [];
  for (const set of sets) {
    merged.push(...set.capabilities);
  }

  return normalizeCapabilities(merged);
}
