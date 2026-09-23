import { cn } from "@/lib/cn";

const TONE_MAP: Record<string, string> = {
  neutral: "bg-navy-50 text-navy-700 border-navy-100",
  gold: "bg-gold-50 text-gold-700 border-gold-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-rose-50 text-rose-700 border-rose-200",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONE_MAP;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_MAP[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
