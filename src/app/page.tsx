import Link from "next/link";
import { getRosterRows } from "@/lib/data";
import { getCounselorRestriction } from "@/lib/current-counselor";
import { Card, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusDot } from "@/components/ui/StatusDot";
import { Pill } from "@/components/ui/Pill";

export const dynamic = "force-dynamic";

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
  const [rows, restricted] = await Promise.all([getRosterRows(), getCounselorRestriction()]);

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
        <h1 className="font-serif text-2xl font-semibold text-navy-900">카운슬러 대시보드</h1>
        <p className="mt-1 text-sm text-navy-500">{restricted ? "내 담당 학생 현황 개요" : "전체 재학생 현황 개요"}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="재학생 수" value={total} />
        <StatCard label="평균 진행률" value={`${avgProgress}%`} tone="gold" />
        <StatCard label="정상 진행" value={onTrack} tone="green" />
        <StatCard label="주의 필요" value={attention} tone="amber" />
        <StatCard label="긴급" value={urgent} tone="red" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-100 px-5 py-4">
          <h2 className="font-serif text-lg font-semibold text-navy-900">주의 필요 학생</h2>
          <Link href="/students" className="text-sm font-medium text-gold-600 hover:text-gold-700">
            전체 학생 보기 →
          </Link>
        </div>
        <div className="divide-y divide-navy-100">
          {priority.length === 0 && (
            <div className="px-5 py-6 text-sm text-navy-400">지금은 모든 학생이 정상 진행 중이에요.</div>
          )}
          {priority.map((row) => (
            <Link
              key={row.student.id}
              href={`/students/${row.student.id}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 hover:bg-navy-50/60 sm:flex-nowrap"
            >
              <StatusDot status={row.status} />
              <div className="min-w-[140px] flex-1 sm:min-w-[180px] sm:flex-none">
                <div className="text-sm font-semibold text-navy-900">
                  {row.student.english_name ?? row.student.student_name}
                </div>
                <div className="text-xs text-navy-400">
                  {row.student.high_school} · {row.student.graduation_year}년 졸업
                </div>
              </div>
              <div className="w-full sm:w-40">
                <ProgressBar value={row.progress} showLabel size="sm" />
              </div>
              <div className="flex-1 text-sm text-navy-600">
                {row.nextDeadline ? (
                  <span>
                    <span className="font-medium text-navy-900">{row.nextDeadline.name}</span> 마감까지{" "}
                    <span className={row.nextDeadline.days < 14 ? "font-semibold text-rose-600" : ""}>
                      {row.nextDeadline.days}일
                    </span>
                  </span>
                ) : (
                  <span className="text-navy-400">예정된 마감일 없음</span>
                )}
              </div>
              <Pill tone="neutral">미완료 할일 {row.pendingTasks}건</Pill>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
