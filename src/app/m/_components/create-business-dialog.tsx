"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarStar,
  ForkKnife,
  Plus,
  Storefront,
  Toolbox,
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
import { VERTICAL_CONFIG } from "@/verticals/types";
import { CAPABILITY_SET_CONFIG } from "@/verticals/capabilities";
import { api } from "@/trpc/react";

const CREATE_OPTIONS = [
  {
    type: "store" as const,
    label: VERTICAL_CONFIG.store.label,
    Icon: Storefront,
  },
  {
    type: "services" as const,
    label: VERTICAL_CONFIG.services.label,
    Icon: Toolbox,
  },
  {
    type: "restaurant" as const,
    label: VERTICAL_CONFIG.restaurant.label,
    Icon: ForkKnife,
  },
  {
    type: "event" as const,
    label: VERTICAL_CONFIG.event.label,
    Icon: CalendarStar,
  },
] as const;

type Step = "pick" | "form";

const EMPTY_FORM = {
  name: "",
  description: "",
  trade: "",
  cuisine: "",
  address: "",
  date: "",
  location: "",
  capacity: "",
};

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
  const [form, setForm] = useState(EMPTY_FORM);

  function resetDialog() {
    setStep("pick");
    setSelectedType(null);
    setForm(EMPTY_FORM);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetDialog();
  }

  function selectType(type: BusinessType) {
    setSelectedType(type);
    setStep("form");
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedType || !form.name.trim()) return;

    if (selectedType === "store") {
      await createBusiness.mutateAsync({
        type: "store",
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
    } else if (selectedType === "services") {
      await createBusiness.mutateAsync({
        type: "services",
        name: form.name.trim(),
        trade: form.trade.trim() || undefined,
      });
    } else if (selectedType === "restaurant") {
      await createBusiness.mutateAsync({
        type: "restaurant",
        name: form.name.trim(),
        cuisine: form.cuisine.trim() || undefined,
        address: form.address.trim() || undefined,
      });
    } else {
      await createBusiness.mutateAsync({
        type: "event",
        name: form.name.trim(),
        date: form.date || undefined,
        location: form.location.trim() || undefined,
        capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
      });
    }

    setOpen(false);
    resetDialog();
    router.push(BUSINESS_ROUTES[selectedType]);
  }

  const selectedOption = CREATE_OPTIONS.find((option) => option.type === selectedType);
  const canSubmit = form.name.trim().length > 0 && !createBusiness.isPending;

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
                Choose your capability set
              </DialogTitle>
              <DialogDescription className="text-sm text-neutral-500">
                Each stack includes the capabilities your business needs
              </DialogDescription>
            </DialogHeader>
            <div className="divide-y divide-[#ebebeb]">
              {CREATE_OPTIONS.map(({ type, label, Icon }) => {
                const caps = CAPABILITY_SET_CONFIG[type].capabilities;
                const visible = caps.slice(0, 4);
                const extra = caps.length - 4;
                return (
                  <button
                    key={type}
                    type="button"
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#fafafa]"
                    onClick={() => selectType(type)}
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-[#f5f5f5] text-neutral-700">
                      <Icon size={20} weight="regular" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-neutral-900">{label}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {visible.map((cap) => (
                          <span
                            key={cap}
                            className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 capitalize"
                          >
                            {cap}
                          </span>
                        ))}
                        {extra > 0 && (
                          <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">
                            +{extra} more
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
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
                <Label htmlFor="business-name">Name</Label>
                <Input
                  id="business-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder={
                    selectedType === "store"
                      ? "Mesa Home Goods"
                      : selectedType === "services"
                        ? "Bright Lawn Co."
                        : selectedType === "event"
                          ? "Wine dinner"
                          : "Rosemary Bistro"
                  }
                  className="h-10 rounded-lg"
                  autoFocus
                />
              </div>

              {selectedType === "store" ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="store-description">Description</Label>
                  <Textarea
                    id="store-description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="What do you sell?"
                    className="min-h-24 rounded-lg"
                  />
                </div>
              ) : null}

              {selectedType === "services" ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="services-trade">Trade</Label>
                  <Input
                    id="services-trade"
                    value={form.trade}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, trade: event.target.value }))
                    }
                    placeholder="Lawn care, plumbing, design"
                    className="h-10 rounded-lg"
                  />
                </div>
              ) : null}

              {selectedType === "restaurant" ? (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="restaurant-cuisine">Cuisine</Label>
                    <Input
                      id="restaurant-cuisine"
                      value={form.cuisine}
                      onChange={(event) =>
                        setForm((current) => ({
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
                      value={form.address}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                      placeholder="123 Main St, Austin TX"
                      className="h-10 rounded-lg"
                    />
                  </div>
                </>
              ) : null}

              {selectedType === "event" ? (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event-date">Date</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={form.date}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, date: event.target.value }))
                      }
                      className="h-10 rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event-location">Location</Label>
                    <Input
                      id="event-location"
                      value={form.location}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          location: event.target.value,
                        }))
                      }
                      placeholder="Private dining room"
                      className="h-10 rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event-capacity">Capacity</Label>
                    <Input
                      id="event-capacity"
                      type="number"
                      min={1}
                      value={form.capacity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          capacity: event.target.value,
                        }))
                      }
                      placeholder="24"
                      className="h-10 rounded-lg"
                    />
                  </div>
                </>
              ) : null}
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
