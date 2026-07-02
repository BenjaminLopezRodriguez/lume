import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <h2 className={cn("text-lg font-semibold text-neutral-950", className)}>
      {title}
    </h2>
  );
}
