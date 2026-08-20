import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <h2 className={cn("text-xl font-semibold leading-snug text-foreground", className)}>
      {title}
    </h2>
  );
}
