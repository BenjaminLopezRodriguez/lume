import { cn } from "@/lib/utils";

const WIDTHS = {
  /** Default: settings / forms / configuration (720-900px). */
  form: "max-w-3xl",
  /** Operational, table and object-detail screens: full available width. */
  full: "max-w-none",
} as const;

export function PageContent({
  className,
  width = "form",
  children,
}: {
  className?: string;
  width?: keyof typeof WIDTHS;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full px-6 pb-12 md:px-10", WIDTHS[width], className)}>
      {children}
    </div>
  );
}
