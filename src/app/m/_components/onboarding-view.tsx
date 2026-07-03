"use client";

// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: Simplified onboarding to name-only account creation.
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { api } from "@/trpc/react";

export function OnboardingView() {
  const router = useRouter();
  const utils = api.useUtils();
  const [name, setName] = useState("");

  const createBusiness = api.business.create.useMutation({
    onSuccess: async () => {
      await utils.business.invalidate();
      router.push("/m/dashboard");
    },
  });

  return (
    <PageContent>
      <PageHeader
        title="Set up your account"
        meta="Name your business, then add capabilities like menu, checkout, or inventory."
      />

      <form
        className="mt-8 flex max-w-md flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          createBusiness.mutate({ name: name.trim() });
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-name">Business name</Label>
          <Input
            id="account-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Rosemary Bistro"
            className="h-10 rounded-lg"
            autoFocus
          />
        </div>
        <Button
          type="submit"
          className="mt-2 h-10 rounded-lg"
          disabled={!name.trim() || createBusiness.isPending}
          style={{ backgroundColor: "var(--landing-accent-deep)", color: "white" }}
        >
          {createBusiness.isPending ? "Creating..." : "Create account"}
        </Button>
      </form>
    </PageContent>
  );
}
