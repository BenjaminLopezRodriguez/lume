"use client";

import { useState } from "react";
import { SectionHeader } from "@/app/m/_components/section-header";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { VERTICAL_CONFIG } from "@/verticals/types";
import type { BusinessType } from "@/verticals/types";

const TYPE_COLORS: Record<BusinessType, string> = {
  account: "#6366f1",
  store: "#6366f1",
  services: "#2d5be3",
  restaurant: "#e85d04",
  event: "#e85d9b",
};

export function AccountsSection() {
  const utils = api.useUtils();
  const { data: businesses = [] } = api.business.list.useQuery();

  const updateBusiness = api.business.update.useMutation({
    onSuccess: () => utils.business.invalidate(),
  });
  const deleteBusiness = api.business.delete.useMutation({
    onSuccess: () => utils.business.invalidate(),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function startEdit(id: string, name: string) {
    setEditingId(id);
    setEditName(name);
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    await updateBusiness.mutateAsync({ id, name: editName.trim() });
    setEditingId(null);
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Accounts" />
      <ListCard>
        {businesses.length > 0 ? (
          businesses.map((b) => (
            <div key={b.id} className="flex items-center gap-3 px-5 py-3">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    TYPE_COLORS[b.type as BusinessType] ?? "#a3a3a3",
                }}
              />
              {editingId === b.id ? (
                <Input
                  className="h-8 flex-1 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveEdit(b.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                />
              ) : (
                <span className="flex-1 truncate text-sm text-neutral-900">
                  {b.name}
                </span>
              )}
              <span className="shrink-0 text-xs capitalize text-neutral-400">
                {VERTICAL_CONFIG[b.type as BusinessType]?.label ?? b.type}
              </span>
              {editingId === b.id ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => void saveEdit(b.id)}
                  disabled={updateBusiness.isPending}
                >
                  Save
                </Button>
              ) : (
                <button
                  type="button"
                  className="text-xs text-neutral-400 hover:text-neutral-700"
                  onClick={() => startEdit(b.id, b.name)}
                >
                  Rename
                </button>
              )}
              <button
                type="button"
                className="text-xs text-red-400 hover:text-red-600"
                onClick={() => void deleteBusiness.mutateAsync({ id: b.id })}
                disabled={deleteBusiness.isPending}
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <ListCardRow
            dot="#a3a3a3"
            label="No accounts yet"
            trailing="Create one with +"
          />
        )}
      </ListCard>
    </section>
  );
}
