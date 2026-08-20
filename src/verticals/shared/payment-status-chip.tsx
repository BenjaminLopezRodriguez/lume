import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/12 text-warning-foreground",
  completed: "bg-chart-3/12 text-chart-3",
  sent: "bg-chart-3/12 text-chart-3",
  paid: "bg-success/12 text-success-foreground",
  overdue: "bg-destructive/12 text-destructive",
  pending: "bg-warning/12 text-warning-foreground",
  checked_in: "bg-success/12 text-success-foreground",
  published: "bg-success/12 text-success-foreground",
};

export function PaymentStatusChip({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[0.625rem] font-medium capitalize",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
