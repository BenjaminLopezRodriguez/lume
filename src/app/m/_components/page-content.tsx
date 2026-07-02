import { cn } from "@/lib/utils";

export function PageContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-3xl px-6 pb-12 md:px-10", className)}>
      {children}
    </div>
  );
}
