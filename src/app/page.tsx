import Link from "next/link";
import { getRosterRows } from "@/lib/data";
import { Card, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusDot } from "@/components/ui/StatusDot";
import { Pill } from "@/components/ui/Pill";

function StatCard({ label, value, tone }: { label: string; value: number | string; tone?: "gold" | "green" | "amber" | "red" }) {
  const toneClass =
    tone === "gold" ? "text-gold-600" : tone === "green" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : tone === "red" ? "text-rose-600" : "text-navy-900";
  return (
    <Card className="flex-1">
      <CardBody>
        <div className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</div>
        <div className={`mt-1.5 font-serif text-3xl font-semibold ${toneClass}`}>{value}</div>
      </CardBody>
    </Card>
  );
}

export default async function DashboardPage() {
  const rows = await getRosterRows();

  const total = rows.length;
  const onTrack = rows.filter((r) => r.status === "green").length;
  const attention = rows.filter((r) => r.status === "yellow").length;
  const urgent = rows.filter((r) => r.status === "red").length;
  const avgProgress = total ? Math.round(rows.reduce((a, r) => a + r.progress, 0) / total) : 0;

  const priority = [...rows]
    .filter((r) => r.status !== "green")
    .sort((a, b) => (a.nextDeadline?.days ?? 999) - (b.nextDeadline?.days ?? 999));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-900">Counselor Dashboard</h1>
        <p className="mt-1 text-sm text-navy-500">Portfolio overview across all active students.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Active Students" value={total} />
        <StatCard label="Avg. Progress" value={`${avgProgress}%`} tone="gold" />
        <StatCard label="On Track" value={onTrack} tone="green" />
        <StatCard label="Needs Attention" value={attention} tone="amber" />
        <StatCard label="Urgent" value={urgent} tone="red" />
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
          <h2 className="font-serif text-lg font-semibold text-navy-900">Needs Attention</h2>
          <Link href="/students" className="text-sm font-medium text-gold-600 hover:text-gold-700">
            View all students →
          </Link>
        </div>
        <div className="divide-y divide-navy-100">
          {priority.length === 0 && (
            <div className="px-5 py-6 text-sm text-navy-400">Every student is on track. Nothing urgent right now.</div>
          )}
          {priority.map((row) => (
            <Link
              key={row.student.id}
              href={`/students/${row.student.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-navy-50/60"
            >
              <StatusDot status={row.status} />
              <div className="min-w-[180px]">
                <div className="text-sm font-semibold text-navy-900">
                  {row.student.english_name ?? row.student.student_name}
                </div>
                <div className="text-xs text-navy-400">
                  {row.student.high_school} · Class of {row.student.graduation_year}
                </div>
              </div>
              <div className="w-40">
                <ProgressBar value={row.progress} showLabel size="sm" />
              </div>
              <div className="flex-1 text-sm text-navy-600">
                {row.nextDeadline ? (
                  <span>
                    <span className="font-medium text-navy-900">{row.nextDeadline.name}</span> in{" "}
                    <span className={row.nextDeadline.days < 14 ? "font-semibold text-rose-600" : ""}>
                      {row.nextDeadline.days} days
                    </span>
                  </span>
                ) : (
                  <span className="text-navy-400">No upcoming deadline set</span>
                )}
              </div>
              <Pill tone="neutral">{row.pendingTasks} pending tasks</Pill>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
