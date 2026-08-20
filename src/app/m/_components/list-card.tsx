import Link from "next/link";
import { cn } from "@/lib/utils";

export function ListCard({
  className,
  children,
  footer,
}: {
  className?: string;
  children: React.ReactNode;
  footer?: { label: string; href: string };
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <div className="divide-y divide-border">{children}</div>
      {footer ? (
        <div className="border-t border-border px-5 py-4">
          <Link
            href={footer.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {footer.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function ListCardRow({
  dot,
  label,
  trailing,
  className,
}: {
  dot?: string;
  label: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {dot ? (
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: dot }}
            aria-hidden
          />
        ) : null}
        <span className="truncate text-sm text-foreground">{label}</span>
      </div>
      {trailing ? (
        <span className="shrink-0 text-sm text-muted-foreground/70">{trailing}</span>
      ) : null}
    </div>
  );
}
