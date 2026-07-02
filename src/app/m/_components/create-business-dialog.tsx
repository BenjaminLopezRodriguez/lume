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
import { useBusinesses } from "@/app/m/_components/business-provider";
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

const CREATE_OPTIONS = [
  {
    type: "store" as const,
    label: "Store",
    desc: "Link-based checkout for retail",
    Icon: Storefront,
  },
  {
    type: "restaurant" as const,
    label: "Restaurant",
    desc: "QR ordering and kitchen sync",
    Icon: ForkKnife,
  },
  {
    type: "event" as const,
    label: "Event",
    desc: "Ticket sales and deposits",
    Icon: CalendarStar,
  },
] as const;

type Step = "pick" | "form";

const EMPTY_STORE = { name: "", description: "" };
const EMPTY_RESTAURANT = { name: "", cuisine: "", address: "" };
const EMPTY_EVENT = { name: "", date: "", location: "", capacity: "" };

export function CreateBusinessDialog() {
  const router = useRouter();
  const { createStore, createRestaurant, createEvent } = useBusinesses();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);
  const [storeForm, setStoreForm] = useState(EMPTY_STORE);
  const [restaurantForm, setRestaurantForm] = useState(EMPTY_RESTAURANT);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);

  function resetDialog() {
    setStep("pick");
    setSelectedType(null);
    setStoreForm(EMPTY_STORE);
    setRestaurantForm(EMPTY_RESTAURANT);
    setEventForm(EMPTY_EVENT);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetDialog();
  }

  function selectType(type: BusinessType) {
    setSelectedType(type);
    setStep("form");
  }

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedType) return;

    if (selectedType === "store") {
      if (!storeForm.name.trim()) return;
      createStore({
        name: storeForm.name.trim(),
        description: storeForm.description.trim(),
      });
    }

    if (selectedType === "restaurant") {
      if (!restaurantForm.name.trim()) return;
      createRestaurant({
        name: restaurantForm.name.trim(),
        cuisine: restaurantForm.cuisine.trim(),
        address: restaurantForm.address.trim(),
      });
    }

    if (selectedType === "event") {
      if (!eventForm.name.trim()) return;
      createEvent({
        name: eventForm.name.trim(),
        date: eventForm.date,
        location: eventForm.location.trim(),
        capacity: eventForm.capacity.trim(),
      });
    }

    setOpen(false);
    resetDialog();
    router.push(BUSINESS_ROUTES[selectedType]);
  }

  const selectedOption = CREATE_OPTIONS.find((option) => option.type === selectedType);
  const canSubmit =
    selectedType === "store"
      ? storeForm.name.trim().length > 0
      : selectedType === "restaurant"
        ? restaurantForm.name.trim().length > 0
        : selectedType === "event"
          ? eventForm.name.trim().length > 0
          : false;

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
              {CREATE_OPTIONS.map(({ type, label, desc, Icon }) => (
                <button
                  key={type}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#fafafa]",
                  )}
                  onClick={() => selectType(type)}
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#f5f5f5] text-neutral-700">
                    <Icon size={20} weight="regular" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">{label}</p>
                    <p className="text-sm text-neutral-500">{desc}</p>
                  </div>
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
              {selectedType === "store" ? (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="store-name">Name</Label>
                    <Input
                      id="store-name"
                      value={storeForm.name}
                      onChange={(event) =>
                        setStoreForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Mesa Home Goods"
                      className="h-10 rounded-lg"
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="store-description">Description</Label>
                    <Textarea
                      id="store-description"
                      value={storeForm.description}
                      onChange={(event) =>
                        setStoreForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="What do you sell?"
                      className="min-h-24 rounded-lg"
                    />
                  </div>
                </>
              ) : null}

              {selectedType === "restaurant" ? (
                <>
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
                </>
              ) : null}

              {selectedType === "event" ? (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event-name">Name</Label>
                    <Input
                      id="event-name"
                      value={eventForm.name}
                      onChange={(event) =>
                        setEventForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Wine dinner"
                      className="h-10 rounded-lg"
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event-date">Date</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={eventForm.date}
                      onChange={(event) =>
                        setEventForm((current) => ({
                          ...current,
                          date: event.target.value,
                        }))
                      }
                      className="h-10 rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event-location">Location</Label>
                    <Input
                      id="event-location"
                      value={eventForm.location}
                      onChange={(event) =>
                        setEventForm((current) => ({
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
                      value={eventForm.capacity}
                      onChange={(event) =>
                        setEventForm((current) => ({
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
                Create
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
