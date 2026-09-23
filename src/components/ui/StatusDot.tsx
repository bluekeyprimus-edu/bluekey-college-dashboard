import { cn } from "@/lib/cn";
import { TrackStatus } from "@/lib/types";

const TONE: Record<TrackStatus, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-rose-500",
};

const LABEL: Record<TrackStatus, string> = {
  green: "On Track",
  yellow: "Needs Attention",
  red: "Urgent",
};

export function StatusDot({ status, showLabel = false }: { status: TrackStatus; showLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", TONE[status])} />
      {showLabel && <span className="text-xs font-medium text-navy-600">{LABEL[status]}</span>}
    </span>
  );
}
