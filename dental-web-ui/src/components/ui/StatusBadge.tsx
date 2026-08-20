import { cn } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/constants";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
        colorClass,
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
