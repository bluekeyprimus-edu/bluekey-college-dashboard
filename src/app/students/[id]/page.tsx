import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getStudent,
  getProgress,
  getAcademicOverview,
  getSatScores,
  getExtracurriculars,
  getAwards,
  getCollegeList,
  getTasks,
  getPersonalStatement,
  getSupplementalEssays,
} from "@/lib/data";
import { getParentAccountsForStudent } from "@/lib/parent";
import { createParentAccount, deleteParentAccount } from "@/lib/actions";
import { overallProgress } from "@/lib/progress";
import { PROGRESS_CATEGORY_LABELS, StudentProgress } from "@/lib/types";
import { TASK_PRIORITY_LABEL, TASK_STATUS_LABEL, EC_STATUS_LABEL, ESSAY_STATUS_LABEL } from "@/lib/labels";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Pill } from "@/components/ui/Pill";

export const dynamic = "force-dynamic";

function ProfileField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">{label}</div>
      <div className="mt-0.5 text-sm text-navy-900">{value ?? "—"}</div>
    </div>
  );
}

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();

  const [progress, academic, sat, ecs, awards, colleges, tasks, personalStatement, supplementalEssays, parentAccounts] =
    await Promise.all([
      getProgress(id),
      getAcademicOverview(id),
      getSatScores(id),
      getExtracurriculars(id),
      getAwards(id),
      getCollegeList(id),
      getTasks(id),
      getPersonalStatement(id),
      getSupplementalEssays(id),
      getParentAccountsForStudent(id),
    ]);

  const overall = progress ? overallProgress(progress) : 0;
  const bestSat = sat.length ? Math.max(...sat.map((s) => s.total_score)) : null;
  const categories = Object.keys(PROGRESS_CATEGORY_LABELS) as (keyof Omit<StudentProgress, "student_id">)[];

  const categoriesByCollege: Record<string, typeof colleges> = {};
  for (const c of colleges) {
    categoriesByCollege[c.category] = [...(categoriesByCollege[c.category] ?? []), c];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/students" className="text-xs font-medium text-navy-400 hover:text-navy-600">← 전체 학생</Link>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-navy-900">
            {student.english_name ?? student.student_name}
          </h1>
          <p className="text-sm text-navy-500">
            {student.student_name !== student.english_name && `${student.student_name} · `}
            {student.high_school} · {student.graduation_year}년 졸업
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="gold">담당 카운슬러: {student.counselor_name ?? "미배정"}</Pill>
          <Link
            href={`/students/${student.id}/edit`}
            className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-50"
          >
            정보 수정
          </Link>
        </div>
      </div>

      {/* Overall progress */}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>학생 프로필</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <ProfileField label="학생 이름" value={student.student_name} />
            <ProfileField label="영문 이름" value={student.english_name} />
            <ProfileField label="현재 학년" value={`${student.current_grade}학년`} />
            <ProfileField label="졸업연도" value={`${student.graduation_year}년 졸업`} />
            <ProfileField label="고등학교" value={student.high_school} />
            <ProfileField label="학교 소재국가/지역" value={student.school_country} />
            <ProfileField label="학교 유형" value={student.school_type} />
            <ProfileField label="커리큘럼" value={student.curriculum} />
            <ProfileField label="국적" value={student.citizenship} />
            <ProfileField label="미국 영주권" value={student.us_permanent_resident ? "있음" : "없음"} />
            <ProfileField label="희망 전공" value={student.intended_major} />
            <ProfileField label="관심 부전공" value={student.secondary_major_interest} />
            <ProfileField label="희망 진로" value={student.career_interest} />
            <ProfileField label="담당 카운슬러" value={student.counselor_name} />
          </CardBody>
        </Card>

        {/* Quick stats */}
        <Card>
          <CardHeader><CardTitle>학업·시험 요약</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <ProfileField label="비가중 GPA" value={academic?.unweighted_gpa ?? "—"} />
            <ProfileField label="가중 GPA" value={academic?.weighted_gpa ?? "—"} />
            <ProfileField
              label="석차"
              value={academic?.school_does_not_rank ? "석차 미산정 학교" : academic?.class_rank ? `${academic.class_rank} / ${academic.class_size}` : "—"}
            />
            <ProfileField label="최고 SAT (슈퍼스코어)" value={bestSat} />
            <div className="pt-2">
              <Link href={`/students/${student.id}/academics`} className="text-xs font-medium text-gold-600 hover:text-gold-700">
                학업 프로필 전체 보기 →
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>과외활동</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {ecs.length === 0 && <p className="text-sm text-navy-400">등록된 활동이 아직 없어요.</p>}
            {ecs.map((e) => (
              <div key={e.id} className="border-b border-navy-100 pb-2 last:border-0 last:pb-0">
                <div className="text-sm font-medium text-navy-900">{e.activity_name}</div>
                <div className="text-xs text-navy-400">{e.position_role} · {EC_STATUS_LABEL[e.status] ?? e.status}</div>
              </div>
            ))}
            <Link href={`/students/${student.id}/activities`} className="text-xs font-medium text-gold-600 hover:text-gold-700">활동 관리 →</Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>수상 경력</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {awards.length === 0 && <p className="text-sm text-navy-400">등록된 수상 내역이 아직 없어요.</p>}
            {awards.map((a) => (
              <div key={a.id} className="border-b border-navy-100 pb-2 last:border-0 last:pb-0">
                <div className="text-sm font-medium text-navy-900">{a.award_name}</div>
                <div className="text-xs text-navy-400">{a.award_level} · {a.placement}</div>
              </div>
            ))}
            <Link href={`/students/${student.id}/activities`} className="text-xs font-medium text-gold-600 hover:text-gold-700">수상 경력 관리 →</Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>진행 중인 할일</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {tasks.length === 0 && <p className="text-sm text-navy-400">등록된 할일이 아직 없어요.</p>}
            {tasks.map((t) => (
              <div key={t.id} className="border-b border-navy-100 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-navy-900">{t.task}</span>
                  <Pill tone={t.priority === "High" ? "red" : t.priority === "Medium" ? "amber" : "neutral"}>
                    {TASK_PRIORITY_LABEL[t.priority] ?? t.priority}
                  </Pill>
                </div>
                <div className="text-xs text-navy-400">
                  {TASK_STATUS_LABEL[t.status] ?? t.status} {t.deadline && `· 마감 ${t.deadline}`}
                </div>
              </div>
            ))}
            <Link href="/tasks" className="text-xs font-medium text-gold-600 hover:text-gold-700">전체 할일 보기 →</Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>에세이</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-navy-900">자기소개서</span>
              <Pill tone="gold">{personalStatement ? ESSAY_STATUS_LABEL[personalStatement.status] : "미작성"}</Pill>
            </div>
            {supplementalEssays.length === 0 && <p className="text-sm text-navy-400">등록된 추가 에세이가 아직 없어요.</p>}
            {supplementalEssays.slice(0, 3).map((e) => (
              <div key={e.id} className="border-b border-navy-100 pb-2 last:border-0 last:pb-0">
                <div className="text-sm font-medium text-navy-900">{e.university_name}</div>
                <div className="text-xs text-navy-400">{ESSAY_STATUS_LABEL[e.status] ?? e.status}</div>
              </div>
            ))}
            <Link href={`/students/${student.id}/essays`} className="text-xs font-medium text-gold-600 hover:text-gold-700">에세이 관리 →</Link>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>컬리지 리스트</CardTitle>
          <div className="flex items-center gap-3">
            <Link href={`/students/${student.id}/recommendations`} className="text-xs font-medium text-gold-600 hover:text-gold-700">Admissions Positioning 보기 →</Link>
            <Link href={`/students/${student.id}/college-list`} className="text-xs font-medium text-gold-600 hover:text-gold-700">컬리지 리스트 관리 →</Link>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {(["Reach", "High Target", "Target", "Likely", "Safety"] as const).map((cat) => (
              <div key={cat}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">{cat}</div>
                <div className="space-y-2">
                  {(categoriesByCollege[cat] ?? []).map((c) => (
                    <div key={c.id} className="rounded-lg border border-navy-100 px-3 py-2">
                      <div className="text-sm font-medium text-navy-900">{c.university_name}</div>
                      <div className="text-xs text-navy-400">{c.application_round ?? "라운드 미정"}</div>
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
          <CardTitle>학부모 계정</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-xs text-navy-400">
            학부모용 로그인 계정을 만들어 이 학생의 읽기 전용 현황 화면(카운슬러 전용 코멘트·평가 제외)을 보여줄 수 있어요.
          </p>

          {parentAccounts.length === 0 && <p className="text-sm text-navy-400">연결된 학부모 계정이 아직 없어요.</p>}
          {parentAccounts.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-navy-100 px-3 py-2">
              <div>
                <div className="text-sm font-medium text-navy-900">{p.parent_name || p.email}</div>
                <div className="text-xs text-navy-400">{p.email}</div>
              </div>
              <form action={deleteParentAccount.bind(null, id, p.id)}>
                <button type="submit" className="text-xs font-medium text-rose-500 hover:text-rose-700">
                  연결 해제
                </button>
              </form>
            </div>
          ))}

          <details className="rounded-lg border border-navy-100">
            <summary className="cursor-pointer list-none rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50">
              + 학부모 계정 추가
            </summary>
            <form action={createParentAccount.bind(null, id)} className="grid grid-cols-1 gap-3 border-t border-navy-100 p-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-navy-500">학부모 이름</label>
                <input name="parent_name" className="w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-navy-500">이메일 *</label>
                <input type="email" name="email" required className="w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-navy-500">임시 비밀번호 *</label>
                <input type="text" name="password" required minLength={6} className="w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none" />
              </div>
              <div className="sm:col-span-3 flex items-center justify-between">
                <p className="text-xs text-navy-400">비밀번호는 직접 정해서 학부모님께 따로 전달해주세요.</p>
                <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                  계정 생성
                </button>
              </div>
            </form>
          </details>
        </CardBody>
      </Card>
    </div>
  );
}
