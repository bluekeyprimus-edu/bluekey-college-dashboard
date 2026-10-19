"use client";

import { useState } from "react";
import Link from "next/link";
import { DeadlineItem } from "@/lib/progress";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";

type TypeFilter = "all" | "college" | "task";

function groupLabel(days: number): "오늘" | "이번 주" | "이후 30일" {
  if (days <= 0) return "오늘";
  if (days <= 7) return "이번 주";
  return "이후 30일";
}

export function UpcomingDeadlinesPanel({ items }: { items: DeadlineItem[] }) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const within30 = items.filter((d) => d.days <= 30).filter((d) => typeFilter === "all" || d.type === typeFilter);
  const sorted = [...within30].sort((a, b) => a.days - b.days);

  const groups: Record<string, DeadlineItem[]> = { 오늘: [], "이번 주": [], "이후 30일": [] };
  for (const item of sorted) groups[groupLabel(item.days)].push(item);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-100 px-5 py-4">
        <h2 className="font-serif text-lg font-semibold text-navy-900">다가오는 마감일</h2>
        <div className="flex gap-1 rounded-lg border border-navy-200 p-0.5 text-xs">
          {([
            ["all", "전체"],
            ["college", "지원"],
            ["task", "할일"],
          ] as [TypeFilter, string][]).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setTypeFilter(val)}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium",
                typeFilter === val ? "bg-navy-900 text-white" : "text-navy-500 hover:text-navy-800"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        {sorted.length === 0 && (
          <div className="px-5 py-6 text-sm text-navy-400">30일 내 예정된 마감일이 없어요.</div>
        )}
        {(["오늘", "이번 주", "이후 30일"] as const).map(
          (label) =>
            groups[label].length > 0 && (
              <div key={label}>
                <div className="sticky top-0 bg-navy-50/80 px-5 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy-400">
                  {label}
                </div>
                <div className="divide-y divide-navy-100">
                  {groups[label].map((item, i) => (
                    <Link
                      key={`${item.studentId}-${item.type}-${i}`}
                      href={`/students/${item.studentId}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-navy-50/60"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-navy-900">{item.label}</div>
                        <div className="text-xs text-navy-400">{item.studentName}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Pill tone={item.type === "college" ? "gold" : "neutral"}>
                          {item.type === "college" ? "지원" : "할일"}
                        </Pill>
                        <span className={cn("text-xs font-medium", item.days < 14 ? "text-rose-600" : "text-navy-600")}>
                          {item.days === 0 ? "오늘" : `${item.days}일`}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
        )}
      </div>
    </Card>
  );
}
