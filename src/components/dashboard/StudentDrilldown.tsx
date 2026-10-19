import { RosterRow } from "@/lib/data";
import { Pill } from "@/components/ui/Pill";
import { COLLEGE_CATEGORY_LABEL } from "@/lib/labels";
import { CollegeCategory } from "@/lib/types";
import { cn } from "@/lib/cn";

const CATEGORY_ORDER: CollegeCategory[] = ["Reach", "High Target", "Target", "Likely", "Safety"];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-navy-100 bg-navy-50/40 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-navy-400">{label}</div>
      <div className="text-sm font-semibold text-navy-900">{value}</div>
    </div>
  );
}

// The My Students table's row expansion — summary-only snapshots across
// Academics / EC / College List (and, for 12th graders, Application
// Status), so a counselor can see "is there a problem here" without
// leaving the Dashboard. Full detail stays on the student's own page.
export function StudentDrilldown({ row }: { row: RosterRow }) {
  const { academicSnapshot: a, ecSnapshot: ec, collegeListSnapshot: cl, applicationStatusSnapshot: app } = row;

  return (
    <div className="grid grid-cols-1 gap-3 bg-navy-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Block title="Academic Snapshot">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Unweighted GPA" value={a.unweightedGpa?.toFixed(2) ?? "—"} />
          <Stat label="Weighted GPA" value={a.weightedGpa?.toFixed(2) ?? "—"} />
          <Stat label="GPA 추세" value={a.trend} />
          <Stat label="상위 과목 수" value={a.advancedCourseCount} />
        </div>
        {a.lowGradeCount > 0 && (
          <div className="mt-2">
            <Pill tone="red">B+ 이하 성적 {a.lowGradeCount}건</Pill>
          </div>
        )}
      </Block>

      <Block title="EC Progress">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="활동 수" value={ec.totalActivities} />
          <Stat label="전공 연계" value={ec.majorRelatedCount} />
          <Stat label="커먼앱 준비" value={ec.commonAppReadyCount} />
        </div>
        {row.student.current_grade <= 11 && ec.totalActivities === 0 && (
          <div className="mt-2">
            <Pill tone="amber">EC 활동 미입력</Pill>
          </div>
        )}
      </Block>

      <Block title="College List Status">
        {cl.total === 0 ? (
          <div className="text-sm text-navy-400">컬리지 리스트 없음</div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_ORDER.map((cat) =>
              cl.counts[cat] > 0 ? (
                <Pill key={cat} tone="neutral">
                  {COLLEGE_CATEGORY_LABEL[cat]} {cl.counts[cat]}
                </Pill>
              ) : null
            )}
          </div>
        )}
        {cl.alerts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cl.alerts.map((alert, i) => (
              <Pill key={i} tone="amber">{alert}</Pill>
            ))}
          </div>
        )}
      </Block>

      {app ? (
        <Block title="Grade 12 Application Status">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="시작 전" value={app.notStarted} />
            <Stat label="진행 중" value={app.inProgress} />
            <Stat label="제출 준비 완료" value={app.readyToSubmit} />
            <Stat label="제출 완료" value={app.submitted} />
          </div>
          {app.earlyRoundSchools.length > 0 && (
            <div className="mt-2 space-y-1">
              {app.earlyRoundSchools.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-navy-800">{s.universityName} ({s.round})</span>
                  <span className={cn("font-semibold", s.checklistPct >= 100 ? "text-emerald-600" : "text-navy-500")}>
                    {s.checklistPct}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </Block>
      ) : (
        <Block title="Grade 12 Application Status">
          <div className="text-sm text-navy-400">12학년부터 표시돼요</div>
        </Block>
      )}
    </div>
  );
}
