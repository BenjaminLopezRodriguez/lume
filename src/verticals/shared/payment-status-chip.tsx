import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-[#f5f5f5] text-neutral-600",
  in_progress: "bg-[#fef3c7] text-[#92400e]",
  completed: "bg-[#dbeafe] text-[#1e40af]",
  sent: "bg-[#e0e7ff] text-[#3730a3]",
  paid: "bg-[#dcfce7] text-[#166534]",
  overdue: "bg-[#fee2e2] text-[#991b1b]",
  pending: "bg-[#fef3c7] text-[#92400e]",
  checked_in: "bg-[#dcfce7] text-[#166534]",
  published: "bg-[#dcfce7] text-[#166534]",
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
        STATUS_STYLES[status] ?? "bg-[#f5f5f5] text-neutral-600",
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
