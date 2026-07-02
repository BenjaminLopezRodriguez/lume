"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  meta,
  className,
}: {
  title: string;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-6 pt-6 md:pt-10", className)}>
      <div className="flex items-start gap-3">
        <SidebarTrigger
          className="mt-0.5 size-9 shrink-0 rounded-lg border border-[#ebebeb] bg-white text-neutral-700 md:hidden"
        />
        <div className="min-w-0 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-950 md:text-4xl">
            {title}
          </h1>
          {meta ? (
            <div className="text-sm leading-relaxed text-neutral-500">{meta}</div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
