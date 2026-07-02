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
        "overflow-hidden rounded-xl border border-[#ebebeb] bg-white",
        className,
      )}
    >
      <div className="divide-y divide-[#ebebeb]">{children}</div>
      {footer ? (
        <div className="border-t border-[#ebebeb] px-5 py-4">
          <Link
            href={footer.href}
            className="text-sm text-neutral-500 transition-colors hover:text-neutral-800"
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
        <span className="truncate text-sm text-neutral-900">{label}</span>
      </div>
      {trailing ? (
        <span className="shrink-0 text-sm text-neutral-400">{trailing}</span>
      ) : null}
    </div>
  );
}
