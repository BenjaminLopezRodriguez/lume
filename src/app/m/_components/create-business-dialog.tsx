"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarBlank,
  ForkKnife,
  Lightning,
  Plus,
  ShoppingBag,
  UserCircle,
  Wrench,
} from "@phosphor-icons/react";
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
import type { Capability } from "@/verticals/capabilities";
import { api } from "@/trpc/react";
import { useBusinesses } from "@/app/m/_components/business-provider";

const PROTOTYPES = {
  shop: { label: "Shop", desc: "Sell products online", caps: ["checkout", "ownership", "inventory"], Icon: ShoppingBag },
  restaurant: { label: "Restaurant", desc: "Menus, QR ordering, delivery", caps: ["menu", "checkout", "ownership"], Icon: ForkKnife },
  services: { label: "Services", desc: "Bookings, invoices and jobs", caps: ["invoices", "ownership"], Icon: Wrench },
  events: { label: "Events", desc: "Tickets, check-in and attendees", caps: ["tickets", "checkout", "ownership"], Icon: CalendarBlank },
  blank: { label: "Blank Account", desc: "Start with nothing, add capabilities later", caps: [], Icon: UserCircle },
} as const;

type PrototypeKey = keyof typeof PROTOTYPES;
type Step = "root" | "form";

export function CreateBusinessDialog() {
  const router = useRouter();
  const utils = api.useUtils();
  const { setActiveBusiness } = useBusinesses();

  const createBusiness = api.business.create.useMutation({
    onSuccess: async () => { await utils.business.invalidate(); },
  });
  const addToAccount = api.capabilitySet.addToAccount.useMutation({
    onSuccess: async () => {
      await utils.capabilitySet.invalidate();
      await utils.qr.invalidate();
    },
  });

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("root");
  const [selectedPrototype, setSelectedPrototype] = useState<PrototypeKey | null>(null);
  const [name, setName] = useState("");

  function reset() {
    setStep("root");
    setSelectedPrototype(null);
    setName("");
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPrototype || !name.trim()) return;
    const caps = PROTOTYPES[selectedPrototype].caps as readonly Capability[];
    const created = await createBusiness.mutateAsync({ name: name.trim() });
    if (caps.length > 0) {
      await Promise.all(
        caps.map((capability) =>
          addToAccount.mutateAsync({ businessId: created.id, capability }),
        ),
      );
    }
    await setActiveBusiness(created.id);
    setOpen(false);
    reset();
    router.push("/m/dashboard");
  }

  const isPending = createBusiness.isPending || addToAccount.isPending;
  const canSubmit = name.trim().length > 0 && !isPending;

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

        {/* ── Root: prototype picker ── */}
        {step === "root" && (
          <>
            <DialogHeader className="border-b border-[#ebebeb] px-5 py-4">
              <DialogTitle className="text-base font-semibold text-neutral-950">Create new</DialogTitle>
              <DialogDescription className="text-sm text-neutral-500">What would you like to start with?</DialogDescription>
            </DialogHeader>
            <div className="divide-y divide-[#ebebeb]">
              {(Object.entries(PROTOTYPES) as [PrototypeKey, typeof PROTOTYPES[PrototypeKey]][]).map(([key, { label, desc, Icon }]) => (
                <button
                  key={key}
                  type="button"
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#fafafa]"
                  onClick={() => {
                    setSelectedPrototype(key);
                    setStep("form");
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
          </>
        )}

        {/* ── Form: name input ── */}
        {step === "form" && selectedPrototype && (
          <form onSubmit={handleSubmit}>
            <DialogHeader className="border-b border-[#ebebeb] px-5 py-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-[#f5f5f5] hover:text-neutral-900"
                  onClick={() => setStep("root")}
                  aria-label="Back"
                >
                  <ArrowLeft size={16} aria-hidden />
                </button>
                <div>
                  <DialogTitle className="text-base font-semibold text-neutral-950">
                    New {PROTOTYPES[selectedPrototype].label}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-neutral-500">Name your business</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="flex flex-col gap-4 px-5 py-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="business-name">Name</Label>
                <Input
                  id="business-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Business"
                  className="h-10 rounded-lg"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#ebebeb] px-5 py-4">
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="rounded-lg" disabled={!canSubmit}>
                {isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        )}

      </DialogContent>
    </Dialog>
  );
}
