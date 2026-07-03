"use client";

// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: Capability option + addToAccount; name-only account create (no preset picker).
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Buildings,
  Plus,
  PuzzlePiece,
  Stack,
  UserCircle,
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
import { Textarea } from "@/components/ui/textarea";
import { CAPABILITIES, type Capability } from "@/verticals/capabilities";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { useBusinesses } from "@/app/m/_components/business-provider";

const ROOT_OPTIONS = [
  {
    key: "account" as const,
    label: "Account",
    desc: "Name your business — add capabilities as you grow",
    Icon: UserCircle,
  },
  {
    key: "account-group" as const,
    label: "Account Group",
    desc: "Organize multiple accounts under one umbrella",
    Icon: Buildings,
  },
  {
    key: "capability" as const,
    label: "Capability",
    desc: "A capability for your business — attaches to the account you're on",
    Icon: PuzzlePiece,
  },
  {
    key: "capability-set" as const,
    label: "Capability Set",
    desc: "Define a custom stack of capabilities",
    Icon: Stack,
  },
] as const;

type Step =
  | "root"
  | "form"
  | "group-form"
  | "capability-form"
  | "capability-set-form"
  | "capability-set-scope";
const EMPTY_GROUP = { name: "", description: "" };
const EMPTY_CAPSET = { name: "", selectedCaps: [] as string[] };

export function CreateBusinessDialog() {
  const router = useRouter();
  const utils = api.useUtils();
  const { activeBusiness, setActiveBusiness } = useBusinesses();

  const createBusiness = api.business.create.useMutation({
    onSuccess: async () => { await utils.business.invalidate(); },
  });
  const createGroup = api.accountGroup.create.useMutation({
    onSuccess: async () => { await utils.accountGroup.invalidate(); },
  });
  const attachBusiness = api.accountGroup.attachBusiness.useMutation({
    onSuccess: async () => { await utils.business.invalidate(); },
  });
  const addCapabilityToAccount = api.capabilitySet.addToAccount.useMutation({
    onSuccess: async () => {
      await utils.capabilitySet.invalidate();
      await utils.qr.invalidate();
    },
  });
  const createCapabilitySet = api.capabilitySet.create.useMutation({
    onSuccess: async () => { await utils.capabilitySet.invalidate(); },
  });

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("root");
  const [form, setForm] = useState({ name: "" });
  const [group, setGroup] = useState(EMPTY_GROUP);
  const [capSet, setCapSet] = useState(EMPTY_CAPSET);
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const [capSetScope, setCapSetScope] = useState<"account" | "global">("global");
  const [noAccountError, setNoAccountError] = useState(false);

  function reset() {
    setStep("root");
    setForm({ name: "" });
    setGroup(EMPTY_GROUP);
    setCapSet(EMPTY_CAPSET);
    setSelectedCapability(null);
    setCapSetScope("global");
    setNoAccountError(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    const created = await createBusiness.mutateAsync({ name: form.name.trim() });
    await setActiveBusiness(created.id);
    setOpen(false);
    reset();
    router.push("/m/dashboard");
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!group.name.trim() || !activeBusiness) return;
    const newGroup = await createGroup.mutateAsync({ name: group.name.trim(), description: group.description.trim() || undefined });
    await attachBusiness.mutateAsync({ groupId: newGroup.id, businessId: activeBusiness.id });
    setOpen(false);
    reset();
  }

  async function handleAddCapability(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCapability || !activeBusiness) return;
    await addCapabilityToAccount.mutateAsync({
      businessId: activeBusiness.id,
      capability: selectedCapability as Capability,
    });
    setOpen(false);
    reset();
  }

  async function handleCreateCapabilitySet(e: React.FormEvent) {
    e.preventDefault();
    if (!capSet.name.trim() || capSet.selectedCaps.length === 0) return;
    await createCapabilitySet.mutateAsync({
      name: capSet.name.trim(),
      capabilities: capSet.selectedCaps,
      businessId: capSetScope === "account" && activeBusiness ? activeBusiness.id : undefined,
    });
    setOpen(false);
    reset();
  }

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
                    if (key === "account-group" || key === "capability") {
                      if (!activeBusiness) {
                        setNoAccountError(true);
                        return;
                      }
                      setNoAccountError(false);
                      setStep(key === "account-group" ? "group-form" : "capability-form");
                    } else {
                      setNoAccountError(false);
                      setStep(
                        key === "account" ? "form" : "capability-set-form",
                      );
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
              <p className="px-5 py-3 text-sm text-red-600">
                You need to be in an account to add a capability or create a group.
              </p>
            )}
          </>
        )}

        {/* ── Account form ── */}
        {step === "form" && (
          <form onSubmit={handleCreateAccount}>
            <DialogHeader className="border-b border-[#ebebeb] px-5 py-4">
              <div className="flex items-center gap-2">
                <BackButton to="root" />
                <div>
                  <DialogTitle className="text-base font-semibold text-neutral-950">New account</DialogTitle>
                  <DialogDescription className="text-sm text-neutral-500">Name your business</DialogDescription>
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
                  placeholder="My Business"
                  className="h-10 rounded-lg"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#ebebeb] px-5 py-4">
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="rounded-lg" disabled={!canSubmitAccount}>
                {createBusiness.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        )}

        {/* ── Single capability ── */}
        {step === "capability-form" && (
          <form onSubmit={handleAddCapability}>
            <DialogHeader className="border-b border-[#ebebeb] px-5 py-4">
              <div className="flex items-center gap-2">
                <BackButton to="root" />
                <div>
                  <DialogTitle className="text-base font-semibold text-neutral-950">Add capability</DialogTitle>
                  <DialogDescription className="text-sm text-neutral-500">
                    {activeBusiness
                      ? `Attaches to ${activeBusiness.name}`
                      : "Select an account first"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="flex flex-col gap-4 px-5 py-5">
              <div className="flex flex-col gap-2">
                <Label>Capability</Label>
                <div className="flex flex-wrap gap-2">
                  {CAPABILITIES.map((cap) => {
                    const selected = selectedCapability === cap;
                    return (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setSelectedCapability(cap)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                          selected
                            ? "bg-[#e2f1af] text-neutral-900"
                            : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
                        )}
                      >
                        {cap}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#ebebeb] px-5 py-4">
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button
                type="submit"
                className="rounded-lg"
                disabled={!selectedCapability || addCapabilityToAccount.isPending}
              >
                {addCapabilityToAccount.isPending ? "Adding..." : "Add capability"}
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

        {/* ── Capability Set form: name + capabilities ── */}
        {step === "capability-set-form" && (
          <>
            <DialogHeader className="border-b border-[#ebebeb] px-5 py-4">
              <div className="flex items-center gap-2">
                <BackButton to="root" />
                <div>
                  <DialogTitle className="text-base font-semibold text-neutral-950">New capability set</DialogTitle>
                  <DialogDescription className="text-sm text-neutral-500">Name it and pick capabilities</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="flex flex-col gap-4 px-5 py-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="capset-name">Name</Label>
                <Input
                  id="capset-name"
                  value={capSet.name}
                  onChange={(e) => setCapSet((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Retail Plus, Contractor Pro"
                  className="h-10 rounded-lg"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Capabilities</Label>
                <div className="flex flex-wrap gap-2">
                  {CAPABILITIES.map((cap) => {
                    const checked = capSet.selectedCaps.includes(cap);
                    return (
                      <button
                        key={cap}
                        type="button"
                        onClick={() =>
                          setCapSet((c) => ({
                            ...c,
                            selectedCaps: checked
                              ? c.selectedCaps.filter((x) => x !== cap)
                              : [...c.selectedCaps, cap],
                          }))
                        }
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                          checked
                            ? "bg-[#e2f1af] text-neutral-900"
                            : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
                        )}
                      >
                        {cap}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#ebebeb] px-5 py-4">
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button
                type="button"
                className="rounded-lg"
                disabled={!capSet.name.trim() || capSet.selectedCaps.length === 0}
                onClick={() => setStep("capability-set-scope")}
              >
                Next
              </Button>
            </div>
          </>
        )}

        {/* ── Capability Set scope: account vs global ── */}
        {step === "capability-set-scope" && (
          <form onSubmit={handleCreateCapabilitySet}>
            <DialogHeader className="border-b border-[#ebebeb] px-5 py-4">
              <div className="flex items-center gap-2">
                <BackButton to="capability-set-form" />
                <div>
                  <DialogTitle className="text-base font-semibold text-neutral-950">Where should it live?</DialogTitle>
                  <DialogDescription className="text-sm text-neutral-500">Tag to your active account or keep it global</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="divide-y divide-[#ebebeb]">
              {[
                { value: "account" as const, label: "Tag to active account", desc: activeBusiness ? `Attach to ${activeBusiness.name}` : "No active account selected" },
                { value: "global" as const, label: "Keep global", desc: "Available across all accounts" },
              ].map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  disabled={value === "account" && !activeBusiness}
                  className={cn(
                    "flex w-full items-center gap-3 px-5 py-4 text-left transition-colors",
                    capSetScope === value ? "bg-[#f5ffd9]" : "hover:bg-[#fafafa]",
                    value === "account" && !activeBusiness && "opacity-40 cursor-not-allowed",
                  )}
                  onClick={() => setCapSetScope(value)}
                >
                  <div className={cn(
                    "flex size-4 items-center justify-center rounded-full border-2",
                    capSetScope === value ? "border-[#6366f1] bg-[#6366f1]" : "border-neutral-300",
                  )} />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{label}</p>
                    <p className="text-xs text-neutral-500">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#ebebeb] px-5 py-4">
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="rounded-lg" disabled={createCapabilitySet.isPending}>
                {createCapabilitySet.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        )}

      </DialogContent>
    </Dialog>
  );
}
