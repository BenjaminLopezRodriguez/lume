"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarStar,
  ForkKnife,
  Plus,
  Storefront,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const CREATE_OPTIONS = [
  {
    href: "/m/store",
    label: "Store",
    desc: "Link-based checkout for retail",
    Icon: Storefront,
  },
  {
    href: "/m/restaurant",
    label: "Restaurant",
    desc: "QR ordering and kitchen sync",
    Icon: ForkKnife,
  },
  {
    href: "/m/event",
    label: "Event",
    desc: "Ticket sales and deposits",
    Icon: CalendarStar,
  },
] as const;

export function CreateBusinessDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function selectOption(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <DialogHeader className="border-b border-[#ebebeb] px-5 py-4">
          <DialogTitle className="text-base font-semibold text-neutral-950">
            Create new
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">
            Choose what you want to set up
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-[#ebebeb]">
          {CREATE_OPTIONS.map(({ href, label, desc, Icon }) => (
            <button
              key={href}
              type="button"
              className={cn(
                "flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#fafafa]",
              )}
              onClick={() => selectOption(href)}
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
      </DialogContent>
    </Dialog>
  );
}
