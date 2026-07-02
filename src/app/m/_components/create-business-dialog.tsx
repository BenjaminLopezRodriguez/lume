"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarStar,
  ForkKnife,
  Plus,
  Storefront,
} from "@phosphor-icons/react";
import type { BusinessType } from "@/app/m/_lib/business-types";
import { BUSINESS_ROUTES } from "@/app/m/_lib/business-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

const CREATE_OPTIONS = [
  {
    type: "store" as const,
    label: "Store",
    desc: "Link-based checkout for retail",
    Icon: Storefront,
    comingSoon: true,
  },
  {
    type: "restaurant" as const,
    label: "Restaurant",
    desc: "QR ordering and kitchen sync",
    Icon: ForkKnife,
    comingSoon: false,
  },
  {
    type: "event" as const,
    label: "Event",
    desc: "Ticket sales and deposits",
    Icon: CalendarStar,
    comingSoon: true,
  },
] as const;

type Step = "pick" | "form";

const EMPTY_RESTAURANT = { name: "", cuisine: "", address: "" };

export function CreateBusinessDialog() {
  const router = useRouter();
  const utils = api.useUtils();
  const createBusiness = api.business.create.useMutation({
    onSuccess: async () => {
      await utils.business.invalidate();
    },
  });
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);
  const [restaurantForm, setRestaurantForm] = useState(EMPTY_RESTAURANT);

  function resetDialog() {
    setStep("pick");
    setSelectedType(null);
    setRestaurantForm(EMPTY_RESTAURANT);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetDialog();
  }

  function selectType(type: BusinessType, comingSoon: boolean) {
    if (comingSoon) return;
    setSelectedType(type);
    setStep("form");
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (selectedType !== "restaurant" || !restaurantForm.name.trim()) return;

    await createBusiness.mutateAsync({
      type: "restaurant",
      name: restaurantForm.name.trim(),
      cuisine: restaurantForm.cuisine.trim() || undefined,
      address: restaurantForm.address.trim() || undefined,
    });

    setOpen(false);
    resetDialog();
    router.push(BUSINESS_ROUTES.restaurant);
  }

  const selectedOption = CREATE_OPTIONS.find((option) => option.type === selectedType);
  const canSubmit = restaurantForm.name.trim().length > 0 && !createBusiness.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#ebebeb] bg-white text-neutral-900 transition-colors hover:bg-[#f5f5f5]"
          aria-label="Create new"
        >
          <Plus size={16} weight="bold" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        {step === "pick" ? (
          <>
            <DialogHeader className="border-b border-[#ebebeb] px-5 py-4">
              <DialogTitle className="text-base font-semibold text-neutral-950">
                Create new
              </DialogTitle>
              <DialogDescription className="text-sm text-neutral-500">
                Choose what you want to set up
              </DialogDescription>
            </DialogHeader>
            <div className="divide-y divide-[#ebebeb]">
              {CREATE_OPTIONS.map(({ type, label, desc, Icon, comingSoon }) => (
                <button
                  key={type}
                  type="button"
                  disabled={comingSoon}
                  className={cn(
                    "flex w-full items-center gap-3 px-5 py-4 text-left transition-colors",
                    comingSoon
                      ? "cursor-not-allowed opacity-60"
                      : "hover:bg-[#fafafa]",
                  )}
                  onClick={() => selectType(type, comingSoon)}
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#f5f5f5] text-neutral-700">
                    <Icon size={20} weight="regular" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900">{label}</p>
                    <p className="text-sm text-neutral-500">{desc}</p>
                  </div>
                  {comingSoon ? (
                    <span className="shrink-0 rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[0.625rem] font-medium text-neutral-500">
                      Soon
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={handleCreate}>
            <DialogHeader className="border-b border-[#ebebeb] px-5 py-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-[#f5f5f5] hover:text-neutral-900"
                  onClick={() => setStep("pick")}
                  aria-label="Back"
                >
                  <ArrowLeft size={16} aria-hidden />
                </button>
                <div>
                  <DialogTitle className="text-base font-semibold text-neutral-950">
                    New {selectedOption?.label.toLowerCase()}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-neutral-500">
                    Add a name and a few basic details
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-4 px-5 py-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="restaurant-name">Name</Label>
                <Input
                  id="restaurant-name"
                  value={restaurantForm.name}
                  onChange={(event) =>
                    setRestaurantForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Rosemary Bistro"
                  className="h-10 rounded-lg"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="restaurant-cuisine">Cuisine</Label>
                <Input
                  id="restaurant-cuisine"
                  value={restaurantForm.cuisine}
                  onChange={(event) =>
                    setRestaurantForm((current) => ({
                      ...current,
                      cuisine: event.target.value,
                    }))
                  }
                  placeholder="Italian, brunch, wine bar"
                  className="h-10 rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="restaurant-address">Address</Label>
                <Input
                  id="restaurant-address"
                  value={restaurantForm.address}
                  onChange={(event) =>
                    setRestaurantForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  placeholder="123 Main St, Austin TX"
                  className="h-10 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#ebebeb] px-5 py-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-lg" disabled={!canSubmit}>
                {createBusiness.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
