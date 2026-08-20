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
          className="mt-0.5 size-9 shrink-0 rounded-lg border border-border bg-card text-foreground/70 md:hidden"
        />
        <div className="min-w-0 flex flex-col gap-2">
          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-foreground md:text-[2.625rem]">
            {title}
          </h1>
          {meta ? (
            <div className="text-base font-normal leading-relaxed text-muted-foreground">
              {meta}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
