"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { SectionHeader } from "@/app/m/_components/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccountGroupsSection() {
  const utils = api.useUtils();
  const [name, setName] = useState("");

  const { data: groups = [] } = api.accountGroup.list.useQuery();
  const createMutation = api.accountGroup.create.useMutation({
    onSuccess: async () => {
      setName("");
      await utils.accountGroup.invalidate();
    },
  });

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createMutation.mutate({ name: trimmed });
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Account Groups" />
      <ListCard>
        {groups.length > 0 ? (
          groups.map((group) => (
            <ListCardRow
              key={group.id}
              dot="#6366f1"
              label={group.name}
              trailing={group.description ?? "No description"}
            />
          ))
        ) : (
          <ListCardRow
            dot="#a3a3a3"
            label="No groups yet"
            trailing="Groups let you share capabilities across accounts"
          />
        )}
      </ListCard>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Corp, Wedding Co."
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Button
          onClick={handleCreate}
          disabled={!name.trim() || createMutation.isPending}
        >
          Create group
        </Button>
      </div>
    </section>
  );
}
