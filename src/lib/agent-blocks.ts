/**
 * Shape-probing for agent response blocks.
 *
 * The server types a block's `data` as `unknown`, so the client may assume
 * nothing about it. A previous build called `block.items.map(...)` on a payload
 * whose real shape was `{ kind, tool, data }`, which crashed the whole merchant
 * app in production. Everything here returns a value rather than throwing.
 */

export type AgentRow = { key: string; label: string; detail?: string };

/** Extracts renderable rows from a block of any shape. Never throws. */
export function blockRows(block: unknown): AgentRow[] {
  if (!block || typeof block !== "object") return [];

  const data = (block as { data?: unknown }).data;
  if (!data || typeof data !== "object") return [];

  const items = (data as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => toRow(item, index))
    .filter((row): row is AgentRow => row !== null);
}

export function toRow(value: unknown, index: number): AgentRow | null {
  if (value === null || value === undefined) return null;

  if (typeof value !== "object") {
    return { key: String(index), label: String(value) };
  }

  const record = value as Record<string, unknown>;
  const label = record.label ?? record.name ?? record.title ?? record.id;
  if (label === null || label === undefined) return null;

  const detail = [record.status, record.source, record.detail]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(" \u00b7 ");

  return {
    key: typeof record.id === "string" ? record.id : String(index),
    label: String(label),
    detail: detail.length > 0 ? detail : undefined,
  };
}
