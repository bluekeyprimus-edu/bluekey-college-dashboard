import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isParentLinkedToStudent } from "@/lib/parent";
import {
  getStudent,
  getProgress,
  getAcademicOverview,
  getGpaByGrade,
  getCourses,
  getSatScores,
  getActScores,
  getApScores,
  getExtracurriculars,
  getAwards,
  getCollegeList,
  getPersonalStatement,
  getSupplementalEssays,
  getTasks,
  getConsultationNotes,
} from "@/lib/data";
import { overallProgress, checklistCompletion } from "@/lib/progress";
import { computeRigorSummary, computeGpaTrend } from "@/lib/rigor";
import { PROGRESS_CATEGORY_LABELS, StudentProgress } from "@/lib/types";
import {
  EC_STATUS_LABEL,
  AWARD_LEVEL_LABEL,
  COLLEGE_CATEGORY_LABEL,
  APPLICATION_STATUS_LABEL,
  ESSAY_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
} from "@/lib/labels";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Pill } from "@/components/ui/Pill";
import { LogoutButton } from "@/components/auth/LogoutButton";

export const dynamic = "force-dynamic";

// Parent-facing view. Deliberately never reads or renders: extracurricular
// rating_* fields, college_list.counselor_recommendation/notes, essay
// draft_link/counselor/editor/counselor_comments, or task notes — those are
// counselor-internal and must never reach this page. Consultation notes ARE
// shown here — the counselor confirmed parents should see meeting summaries.

export default async function ParentStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const authorized = await isParentLinkedToStudent(user.id, studentId);
  if (!authorized) redirect("/parent");

  const student = await getStudent(studentId);
  if (!student) notFound();

  const [progress, academic, gpaRows, courses, sat, act, ap, ecs, awards, colleges, personalStatement, essays, tasks, consultationNotes] =
    await Promise.all([
      getProgress(studentId),
      getAcademicOverview(studentId),
      getGpaByGrade(studentId),
      getCourses(studentId),
      getSatScores(studentId),
      getActScores(studentId),
      getApScores(studentId),
      getExtracurriculars(studentId),
      getAwards(studentId),
      getCollegeList(studentId),
      getPersonalStatement(studentId),
      getSupplementalEssays(studentId),
      getTasks(studentId),
      getConsultationNotes(studentId),
    ]);

  const overall = progress ? overallProgress(progress) : 0;
  const categories = Object.keys(PROGRESS_CATEGORY_LABELS) as (keyof Omit<StudentProgress, "student_id">)[];
  const bestSat = sat.length ? Math.max(...sat.map((s) => s.total_score)) : null;
  const bestAct = act.length ? Math.max(...act.map((a) => a.composite)) : null;
  const rigor = computeRigorSummary(courses);
  const trend = computeGpaTrend(gpaRows);
  const pendingTasks = tasks.filter((t) => t.status !== "Completed");

  const categoriesByCollege: Record<string, typeof colleges> = {};
  for (const c of colleges) {
    categoriesByCollege[c.category] = [...(categoriesByCollege[c.category] ?? []), c];
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="BlueKey" width={32} height={32} className="h-8 w-8 rounded-md object-cover" />
          <div>
            <div className="font-serif text-lg font-semibold text-navy-900">
              {student.english_name ?? student.student_name}
            </div>
            <div className="text-xs text-navy-400">
              {student.high_school} · {student.graduation_year}년 졸업
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/parent" className="text-xs font-medium text-navy-400 hover:text-navy-600">
            다른 자녀 보기
          </Link>
          <LogoutButton />
        </div>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-navy-400">전체 지원 진행률</div>
              <div className="font-serif text-4xl font-semibold text-navy-900">{overall}%</div>
            </div>
            <div className="w-full sm:w-1/2">
              <ProgressBar value={overall} size="lg" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            {progress &&
              categories.map((key) => (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-navy-600">{PROGRESS_CATEGORY_LABELS[key]}</span>
                    <span className="text-navy-400">{progress[key]}%</span>
                  </div>
                  <ProgressBar value={progress[key]} size="sm" />
                </div>
              ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>학업 프로필</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">비가중 GPA</div>
              <div className="mt-0.5 text-sm text-navy-900">{academic?.unweighted_gpa ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">가중 GPA</div>
              <div className="mt-0.5 text-sm text-navy-900">{academic?.weighted_gpa ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">석차</div>
              <div className="mt-0.5 text-sm text-navy-900">
                {academic?.school_does_not_rank ? "석차 미산정 학교" : academic?.class_rank ? `${academic.class_rank} / ${academic.class_size}` : "—"}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">GPA 추세</div>
              <div className="mt-0.5 text-sm text-navy-900">{trend}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">전체 커리큘럼 강도</div>
              <div className="mt-0.5 text-sm text-navy-900">{rigor.overallLabel}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">STEM / Humanities 강도</div>
              <div className="mt-0.5 text-sm text-navy-900">{rigor.stemLabel} / {rigor.humanitiesLabel}</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>표준화 시험</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">최고 SAT</div>
                <div className="mt-0.5 text-sm text-navy-900">{bestSat ?? "—"}</div>
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">최고 ACT</div>
                <div className="mt-0.5 text-sm text-navy-900">{bestAct ?? "—"}</div>
              </div>
            </div>
            {ap.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-navy-400">AP 시험</div>
                <div className="flex flex-wrap gap-1.5">
                  {ap.map((a) => (
                    <Pill key={a.id} tone={a.score >= 4 ? "green" : "neutral"}>{a.subject} {a.score}</Pill>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>과외활동 · 수상 경력</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-navy-400">과외활동</div>
            {ecs.length === 0 && <p className="text-sm text-navy-400">등록된 활동이 아직 없어요.</p>}
            {ecs.map((e) => (
              <div key={e.id} className="border-b border-navy-100 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-navy-900">{e.activity_name}</span>
                  <Pill tone="neutral">{EC_STATUS_LABEL[e.status] ?? e.status}</Pill>
                </div>
                <div className="text-xs text-navy-400">
                  {e.organization}
                  {e.position_role && ` · ${e.position_role}`}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-navy-400">수상 경력</div>
            {awards.length === 0 && <p className="text-sm text-navy-400">등록된 수상 내역이 아직 없어요.</p>}
            {awards.map((a) => (
              <div key={a.id} className="border-b border-navy-100 pb-2 last:border-0 last:pb-0">
                <div className="text-sm font-medium text-navy-900">{a.award_name}</div>
                <div className="text-xs text-navy-400">
                  {AWARD_LEVEL_LABEL[a.award_level] ?? a.award_level}
                  {a.placement && ` · ${a.placement}`}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>컬리지 리스트</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {(["Reach", "High Target", "Target", "Likely", "Safety"] as const).map((cat) => (
              <div key={cat}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">{COLLEGE_CATEGORY_LABEL[cat]}</div>
                <div className="space-y-2">
                  {(categoriesByCollege[cat] ?? []).map((c) => (
                    <div key={c.id} className="rounded-lg border border-navy-100 px-3 py-2">
                      <div className="text-sm font-medium text-navy-900">{c.university_name}</div>
                      <div className="text-xs text-navy-400">
                        {c.application_round ?? "라운드 미정"}
                        {c.application_deadline && ` · ${c.application_deadline}`}
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar value={checklistCompletion(c.checklist)} size="sm" showLabel />
                      </div>
                      <Pill tone="neutral" className="mt-1.5">{APPLICATION_STATUS_LABEL[c.application_status] ?? c.application_status}</Pill>
                    </div>
                  ))}
                  {(categoriesByCollege[cat] ?? []).length === 0 && (
                    <div className="rounded-lg border border-dashed border-navy-200 px-3 py-2 text-xs text-navy-300">없음</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>상담 내역</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {consultationNotes.length === 0 && <p className="text-sm text-navy-400">등록된 상담 기록이 아직 없어요.</p>}
          {consultationNotes.map((n) => (
            <div key={n.id} className="border-b border-navy-100 pb-3 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-navy-900">{n.meeting_date}</span>
                <div className="flex items-center gap-2 text-xs text-navy-400">
                  {n.attendees && <span>{n.attendees}</span>}
                  {n.counselor_name && <span>{n.counselor_name}</span>}
                </div>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-navy-600">{n.content}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>에세이</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-navy-900">자기소개서</span>
              <Pill tone="gold">{personalStatement ? ESSAY_STATUS_LABEL[personalStatement.status] : "미작성"}</Pill>
            </div>
            {essays.length === 0 && <p className="text-sm text-navy-400">등록된 추가 에세이가 아직 없어요.</p>}
            {essays.map((e) => (
              <div key={e.id} className="border-b border-navy-100 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-navy-900">{e.university_name}</span>
                  <Pill tone="neutral">{ESSAY_STATUS_LABEL[e.status] ?? e.status}</Pill>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>진행 중인 할일</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {pendingTasks.length === 0 && <p className="text-sm text-navy-400">진행 중인 할일이 없어요.</p>}
            {pendingTasks.map((t) => (
              <div key={t.id} className="border-b border-navy-100 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-navy-900">{t.task}</span>
                  <Pill tone={t.priority === "High" ? "red" : t.priority === "Medium" ? "amber" : "neutral"}>
                    {TASK_PRIORITY_LABEL[t.priority] ?? t.priority}
                  </Pill>
                </div>
                <div className="text-xs text-navy-400">
                  {TASK_STATUS_LABEL[t.status] ?? t.status}
                  {t.deadline && ` · 마감 ${t.deadline}`}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
