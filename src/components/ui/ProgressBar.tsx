import { cn } from "@/lib/cn";

export function ProgressBar({
  value,
  size = "md",
  showLabel = false,
  className,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";
  const tone =
    clamped >= 70 ? "bg-emerald-600" : clamped >= 40 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("w-full rounded-full bg-navy-100", height)}>
        <div
          className={cn("rounded-full transition-all", height, tone)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs font-medium text-navy-500">{clamped}%</div>
      )}
    </div>
  );
}
