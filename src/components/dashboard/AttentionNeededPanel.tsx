import Link from "next/link";
import { RosterRow } from "@/lib/data";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { StatusDot } from "@/components/ui/StatusDot";

const STATUS_RANK: Record<RosterRow["status"], number> = { red: 0, yellow: 1, green: 2 };

// Static panel (no interaction needed) — plain-language reasons each
// flagged student needs a look, instead of just a colored dot. Students
// with no flags (computeAttentionFlags returned nothing) don't appear
// here at all, even if their status isn't green.
export function AttentionNeededPanel({ rows }: { rows: RosterRow[] }) {
  const flagged = rows
    .filter((r) => r.attentionFlags.length > 0)
    .sort((a, b) => {
      const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (rankDiff !== 0) return rankDiff;
      return (a.nextDeadline?.days ?? 9999) - (b.nextDeadline?.days ?? 9999);
    });

  return (
    <Card>
      <div className="border-b border-navy-100 px-5 py-4">
        <h2 className="font-serif text-lg font-semibold text-navy-900">주의 필요 (Attention Needed)</h2>
      </div>
      <div className="max-h-[420px] divide-y divide-navy-100 overflow-y-auto">
        {flagged.length === 0 && (
          <div className="px-5 py-6 text-sm text-navy-400">지금은 모든 학생이 정상 진행 중이에요.</div>
        )}
        {flagged.map((row) => (
          <Link
            key={row.student.id}
            href={`/students/${row.student.id}`}
            className="flex flex-col gap-1.5 px-5 py-3.5 hover:bg-navy-50/60"
          >
            <div className="flex items-center gap-2">
              <StatusDot status={row.status} />
              <span className="text-sm font-semibold text-navy-900">
                {row.student.english_name ?? row.student.student_name}
              </span>
              <span className="text-xs text-navy-400">{row.student.current_grade}학년</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {row.attentionFlags.map((flag, i) => (
                <Pill key={i} tone={flag.severity === "red" ? "red" : "amber"}>
                  {flag.label}
                </Pill>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
