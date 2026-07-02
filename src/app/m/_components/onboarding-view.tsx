"use client";

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
  const [cuisine, setCuisine] = useState("");
  const [address, setAddress] = useState("");

  const createBusiness = api.business.create.useMutation({
    onSuccess: async () => {
      await utils.business.invalidate();
      router.push("/m/dashboard");
    },
  });

  return (
    <PageContent>
      <PageHeader
        title="Set up your restaurant"
        meta="Start with one location. You can connect delivery apps and share your checkout link next."
      />

      <form
        className="mt-8 flex max-w-md flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          createBusiness.mutate({
            type: "restaurant",
            name: name.trim(),
            cuisine: cuisine.trim() || undefined,
            address: address.trim() || undefined,
          });
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="restaurant-name">Restaurant name</Label>
          <Input
            id="restaurant-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Rosemary Bistro"
            className="h-10 rounded-lg"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="restaurant-cuisine">Cuisine</Label>
          <Input
            id="restaurant-cuisine"
            value={cuisine}
            onChange={(event) => setCuisine(event.target.value)}
            placeholder="Italian, brunch, wine bar"
            className="h-10 rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="restaurant-address">Address</Label>
          <Input
            id="restaurant-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="123 Main St, Austin TX"
            className="h-10 rounded-lg"
          />
        </div>
        <Button
          type="submit"
          className="mt-2 h-10 rounded-lg"
          disabled={!name.trim() || createBusiness.isPending}
          style={{ backgroundColor: "var(--landing-accent-deep)", color: "white" }}
        >
          {createBusiness.isPending ? "Creating..." : "Create restaurant"}
        </Button>
      </form>
    </PageContent>
  );
}
