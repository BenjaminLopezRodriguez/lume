"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Buildings,
  CalendarStar,
  ForkKnife,
  Plus,
  Stack,
  Storefront,
  Toolbox,
  UserCircle,
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
import { useBusinesses } from "@/app/m/_components/business-provider";

const ROOT_OPTIONS = [
  {
    key: "account" as const,
    label: "Account",
    desc: "A business with its own capability set",
    Icon: UserCircle,
  },
  {
    key: "account-group" as const,
    label: "Account Group",
    desc: "Organize multiple accounts under one umbrella",
    Icon: Buildings,
  },
  {
    key: "capability-set" as const,
    label: "Capability Set",
    desc: "Define a custom stack of capabilities",
    Icon: Stack,
  },
] as const;

const ACCOUNT_OPTIONS = [
  { type: "store" as const, label: VERTICAL_CONFIG.store.label, Icon: Storefront },
  { type: "services" as const, label: VERTICAL_CONFIG.services.label, Icon: Toolbox },
  { type: "restaurant" as const, label: VERTICAL_CONFIG.restaurant.label, Icon: ForkKnife },
  { type: "event" as const, label: VERTICAL_CONFIG.event.label, Icon: CalendarStar },
] as const;

type Step = "root" | "pick" | "form" | "group-form" | "capability-set";

const EMPTY_FORM = { name: "", description: "", trade: "", cuisine: "", address: "", date: "", location: "", capacity: "" };
const EMPTY_GROUP = { name: "", description: "" };

export function CreateBusinessDialog() {
  const router = useRouter();
  const utils = api.useUtils();
  const { activeBusiness } = useBusinesses();

  const createBusiness = api.business.create.useMutation({
    onSuccess: async () => { await utils.business.invalidate(); },
  });
  const createGroup = api.accountGroup.create.useMutation({
    onSuccess: async () => { await utils.accountGroup.invalidate(); },
  });
  const attachBusiness = api.accountGroup.attachBusiness.useMutation();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("root");
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [group, setGroup] = useState(EMPTY_GROUP);
  const [noAccountError, setNoAccountError] = useState(false);

  function reset() {
    setStep("root");
    setSelectedType(null);
    setForm(EMPTY_FORM);
    setGroup(EMPTY_GROUP);
    setNoAccountError(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  function selectAccountType(type: BusinessType) {
    setSelectedType(type);
    setStep("form");
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType || !form.name.trim()) return;
    if (selectedType === "store") {
      await createBusiness.mutateAsync({ type: "store", name: form.name.trim(), description: form.description.trim() || undefined });
    } else if (selectedType === "services") {
      await createBusiness.mutateAsync({ type: "services", name: form.name.trim(), trade: form.trade.trim() || undefined });
    } else if (selectedType === "restaurant") {
      await createBusiness.mutateAsync({ type: "restaurant", name: form.name.trim(), cuisine: form.cuisine.trim() || undefined, address: form.address.trim() || undefined });
    } else {
      await createBusiness.mutateAsync({ type: "event", name: form.name.trim(), date: form.date || undefined, location: form.location.trim() || undefined, capacity: form.capacity ? parseInt(form.capacity, 10) : undefined });
    }
    setOpen(false);
    reset();
    router.push(BUSINESS_ROUTES[selectedType]);
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!group.name.trim() || !activeBusiness) return;
    const newGroup = await createGroup.mutateAsync({ name: group.name.trim(), description: group.description.trim() || undefined });
    await attachBusiness.mutateAsync({ groupId: newGroup.id, businessId: activeBusiness.id });
    setOpen(false);
    reset();
  }

  const selectedOption = ACCOUNT_OPTIONS.find((o) => o.type === selectedType);
  const canSubmitAccount = form.name.trim().length > 0 && !createBusiness.isPending;
  const canSubmitGroup = group.name.trim().length > 0 && !createGroup.isPending && !attachBusiness.isPending;

  function BackButton({ to }: { to: Step }) {
    return (
      <button
        type="button"
        className="flex size-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-[#f5f5f5] hover:text-neutral-900"
        onClick={() => setStep(to)}
        aria-label="Back"
      >
        <ArrowLeft size={16} aria-hidden />
      </button>
    );
  }

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

        {/* ── Root: pick what to create ── */}
        {step === "root" && (
          <>
            <DialogHeader className="border-b border-[#ebebeb] px-5 py-4">
              <DialogTitle className="text-base font-semibold text-neutral-950">Create new</DialogTitle>
              <DialogDescription className="text-sm text-neutral-500">What do you want to set up?</DialogDescription>
            </DialogHeader>
            <div className="divide-y divide-[#ebebeb]">
              {ROOT_OPTIONS.map(({ key, label, desc, Icon }) => (
                <button
                  key={key}
                  type="button"
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#fafafa]"
                  onClick={() => {
                    if (key === "account-group") {
                      if (!activeBusiness) { setNoAccountError(true); return; }
                      setNoAccountError(false);
                      setStep("group-form");
                    } else {
                      setNoAccountError(false);
                      setStep(key === "account" ? "pick" : "capability-set");
                    }
                  }}
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#f5f5f5] text-neutral-700">
                    <Icon size={20} weight="regular" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900">{label}</p>
                    <p className="text-sm text-neutral-500">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {noAccountError && (
              <p className="px-5 py-3 text-sm text-red-600">You need to be in an account to create a group.</p>
            )}
          </>
        )}

        {/* ── Pick capability set ── */}
        {step === "pick" && (
          <>
            <DialogHeader className="border-b border-[#ebebeb] px-5 py-4">
              <div className="flex items-center gap-2">
                <BackButton to="root" />
                <div>
                  <DialogTitle className="text-base font-semibold text-neutral-950">Choose your capability set</DialogTitle>
                  <DialogDescription className="text-sm text-neutral-500">Each stack includes the capabilities your business needs</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="divide-y divide-[#ebebeb]">
              {ACCOUNT_OPTIONS.map(({ type, label, Icon }) => {
                const caps = CAPABILITY_SET_CONFIG[type].capabilities;
                const visible = caps.slice(0, 4);
                const extra = caps.length - 4;
                return (
                  <button
                    key={type}
                    type="button"
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#fafafa]"
                    onClick={() => selectAccountType(type)}
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-[#f5f5f5] text-neutral-700">
                      <Icon size={20} weight="regular" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-neutral-900">{label}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {visible.map((cap) => (
                          <span key={cap} className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 capitalize">{cap}</span>
                        ))}
                        {extra > 0 && (
                          <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">+{extra} more</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Account form ── */}
        {step === "form" && (
          <form onSubmit={handleCreateAccount}>
            <DialogHeader className="border-b border-[#ebebeb] px-5 py-4">
              <div className="flex items-center gap-2">
                <BackButton to="pick" />
                <div>
                  <DialogTitle className="text-base font-semibold text-neutral-950">New {selectedOption?.label.toLowerCase()}</DialogTitle>
                  <DialogDescription className="text-sm text-neutral-500">Add a name and a few basic details</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="flex flex-col gap-4 px-5 py-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="business-name">Name</Label>
                <Input
                  id="business-name"
                  value={form.name}
                  onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                  placeholder={selectedType === "store" ? "Mesa Home Goods" : selectedType === "services" ? "Bright Lawn Co." : selectedType === "event" ? "Wine dinner" : "Rosemary Bistro"}
                  className="h-10 rounded-lg"
                  autoFocus
                />
              </div>
              {selectedType === "store" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="store-description">Description</Label>
                  <Textarea id="store-description" value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} placeholder="What do you sell?" className="min-h-24 rounded-lg" />
                </div>
              )}
              {selectedType === "services" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="services-trade">Trade</Label>
                  <Input id="services-trade" value={form.trade} onChange={(e) => setForm((c) => ({ ...c, trade: e.target.value }))} placeholder="Lawn care, plumbing, design" className="h-10 rounded-lg" />
                </div>
              )}
              {selectedType === "restaurant" && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="restaurant-cuisine">Cuisine</Label>
                    <Input id="restaurant-cuisine" value={form.cuisine} onChange={(e) => setForm((c) => ({ ...c, cuisine: e.target.value }))} placeholder="Italian, brunch, wine bar" className="h-10 rounded-lg" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="restaurant-address">Address</Label>
                    <Input id="restaurant-address" value={form.address} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} placeholder="123 Main St, Austin TX" className="h-10 rounded-lg" />
                  </div>
                </>
              )}
              {selectedType === "event" && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event-date">Date</Label>
                    <Input id="event-date" type="date" value={form.date} onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))} className="h-10 rounded-lg" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event-location">Location</Label>
                    <Input id="event-location" value={form.location} onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))} placeholder="Private dining room" className="h-10 rounded-lg" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event-capacity">Capacity</Label>
                    <Input id="event-capacity" type="number" min={1} value={form.capacity} onChange={(e) => setForm((c) => ({ ...c, capacity: e.target.value }))} placeholder="24" className="h-10 rounded-lg" />
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#ebebeb] px-5 py-4">
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="rounded-lg" disabled={!canSubmitAccount}>
                {createBusiness.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        )}

        {/* ── Account Group form ── */}
        {step === "group-form" && (
          <form onSubmit={handleCreateGroup}>
            <DialogHeader className="border-b border-[#ebebeb] px-5 py-4">
              <div className="flex items-center gap-2">
                <BackButton to="root" />
                <div>
                  <DialogTitle className="text-base font-semibold text-neutral-950">New account group</DialogTitle>
                  <DialogDescription className="text-sm text-neutral-500">Group accounts that share ownership or capabilities</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="flex flex-col gap-4 px-5 py-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="group-name">Name</Label>
                <Input
                  id="group-name"
                  value={group.name}
                  onChange={(e) => setGroup((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Acme Construction, McDonald's Corporate"
                  className="h-10 rounded-lg"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="group-description">Description <span className="text-neutral-400">(optional)</span></Label>
                <Textarea
                  id="group-description"
                  value={group.description}
                  onChange={(e) => setGroup((c) => ({ ...c, description: e.target.value }))}
                  placeholder="What do these accounts have in common?"
                  className="min-h-20 rounded-lg"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#ebebeb] px-5 py-4">
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="rounded-lg" disabled={!canSubmitGroup}>
                {createGroup.isPending ? "Creating..." : "Create group"}
              </Button>
            </div>
          </form>
        )}

        {/* ── Capability Set stub ── */}
        {step === "capability-set" && (
          <>
            <DialogHeader className="border-b border-[#ebebeb] px-5 py-4">
              <div className="flex items-center gap-2">
                <BackButton to="root" />
                <div>
                  <DialogTitle className="text-base font-semibold text-neutral-950">New capability set</DialogTitle>
                  <DialogDescription className="text-sm text-neutral-500">Compose a custom stack of capabilities</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <Stack size={32} className="text-neutral-300" weight="regular" />
              <p className="text-sm font-medium text-neutral-700">Custom capability sets are coming soon</p>
              <p className="text-sm text-neutral-400">For now, choose from predefined stacks when creating an account.</p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#ebebeb] px-5 py-4">
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => handleOpenChange(false)}>Close</Button>
              <Button type="button" className="rounded-lg" onClick={() => setStep("pick")}>Browse stacks</Button>
            </div>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
