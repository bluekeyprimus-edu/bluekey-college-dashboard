import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getStudent,
  getStudentAccess,
  getCurrentMajorGoal,
  getMajorGoalHistory,
  getTargetColleges,
  getCounselingPlans,
  getPlanTasks,
} from "@/lib/data";
import {
  addMajorGoal,
  addTargetCollege,
  deleteTargetCollege,
  convertTargetCollegesToCollegeList,
  createCounselingPlan,
  updateCounselingPlan,
  addPlanTask,
  togglePlanTask,
  deletePlanTask,
} from "@/lib/actions";
import { planTaskProgress } from "@/lib/goals";
import { GOAL_PRIORITY_OPTIONS, GOAL_PRIORITY_LABEL } from "@/lib/labels";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { DeleteCounselingPlanButton } from "@/components/students/DeleteCounselingPlanButton";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-navy-500";

function priorityTone(p: string): "red" | "amber" | "neutral" {
  return p === "High" ? "red" : p === "Medium" ? "amber" : "neutral";
}

export default async function GoalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const { id } = await params;
  const { plan: planIdParam } = await searchParams;
  const student = await getStudent(id);
  if (!student) notFound();
  const access = await getStudentAccess(id);
  if (!(access?.canViewAll || access?.canViewApplication)) notFound();

  const [currentMajorGoal, majorHistory, targetColleges, plans] = await Promise.all([
    getCurrentMajorGoal(id),
    getMajorGoalHistory(id),
    getTargetColleges(id),
    getCounselingPlans(id),
  ]);

  const selectedPlan = plans.find((p) => p.id === planIdParam) ?? plans[0] ?? null;
  const tasks = selectedPlan ? await getPlanTasks(selectedPlan.id) : [];
  const overall = planTaskProgress(tasks);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/students/${id}`} className="text-xs font-medium text-navy-400 hover:text-navy-600">
          ← {student.english_name ?? student.student_name}
        </Link>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-navy-900">목표 & 카운슬링 플랜</h1>
        <p className="text-sm text-navy-500">
          {student.student_name} · Grade {student.current_grade ?? "—"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>College & Major Goals</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">Primary Intended Major</div>
              <div className="mt-0.5 text-sm text-navy-900">{currentMajorGoal?.primary_major ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">Secondary / Exploring Major</div>
              <div className="mt-0.5 text-sm text-navy-900">{currentMajorGoal?.secondary_major ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">Career Interest</div>
              <div className="mt-0.5 text-sm text-navy-900">{currentMajorGoal?.career_interest ?? "—"}</div>
            </div>
          </div>
          {currentMajorGoal?.counselor_notes && (
            <p className="text-sm text-navy-600">Counselor Notes: {currentMajorGoal.counselor_notes}</p>
          )}

          <details>
            <summary className="cursor-pointer text-xs font-medium text-navy-600">Intended Major 수정 (변경하면 새 기록으로 저장돼요)</summary>
            <form action={addMajorGoal.bind(null, id)} className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Primary Intended Major</label>
                <input name="primary_major" defaultValue={currentMajorGoal?.primary_major ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Secondary / Exploring Major</label>
                <input name="secondary_major" defaultValue={currentMajorGoal?.secondary_major ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Career Interest</label>
                <input name="career_interest" defaultValue={currentMajorGoal?.career_interest ?? ""} className={inputClass} />
              </div>
              <div className="sm:col-span-3">
                <label className={labelClass}>Counselor Notes</label>
                <input name="counselor_notes" defaultValue={currentMajorGoal?.counselor_notes ?? ""} className={inputClass} />
              </div>
              <div className="flex justify-end sm:col-span-3">
                <SubmitButton label="새 기록으로 저장" variant="secondary-sm" toastMessage="저장되었습니다" />
              </div>
            </form>
          </details>

          {majorHistory.length > 1 && (
            <details>
              <summary className="cursor-pointer text-[11px] text-navy-400">변경 이력 ({majorHistory.length}건)</summary>
              <ul className="mt-1 space-y-0.5 text-xs text-navy-500">
                {majorHistory.map((m) => (
                  <li key={m.id}>
                    {m.created_at.slice(0, 10)} — {m.primary_major ?? "—"}
                    {m.secondary_major ? ` / ${m.secondary_major}` : ""}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Target Colleges</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {targetColleges.length === 0 && <p className="text-sm text-navy-400">등록된 Target College가 아직 없어요.</p>}

          {targetColleges.length > 0 && (
            <form action={convertTargetCollegesToCollegeList.bind(null, id)}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="text-xs font-medium uppercase tracking-wide text-navy-400">
                      <th className="border-b border-navy-100 px-2 py-1.5 text-left">전환</th>
                      <th className="border-b border-navy-100 px-2 py-1.5 text-left">University</th>
                      <th className="border-b border-navy-100 px-2 py-1.5 text-left">Interested Major</th>
                      <th className="border-b border-navy-100 px-2 py-1.5 text-left">Priority</th>
                      <th className="border-b border-navy-100 px-2 py-1.5 text-left">Notes</th>
                      <th className="border-b border-navy-100 px-2 py-1.5 text-left">Date Added</th>
                      <th className="border-b border-navy-100 px-2 py-1.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetColleges.map((t) => (
                      <tr key={t.id} className="border-b border-navy-50 last:border-0">
                        <td className="px-2 py-1.5">
                          <input type="checkbox" name="target_college_id" value={t.id} />
                        </td>
                        <td className="px-2 py-1.5 text-navy-900">{t.university_name}</td>
                        <td className="px-2 py-1.5 text-navy-600">{t.interested_major ?? "—"}</td>
                        <td className="px-2 py-1.5">
                          <Pill tone={priorityTone(t.priority)}>{GOAL_PRIORITY_LABEL[t.priority]}</Pill>
                        </td>
                        <td className="px-2 py-1.5 text-navy-600">{t.notes ?? "—"}</td>
                        <td className="px-2 py-1.5 text-navy-400">{t.date_added}</td>
                        <td className="px-2 py-1.5 text-right">
                          <button formAction={deleteTargetCollege.bind(null, id, t.id)} className="text-[11px] font-medium text-rose-500 hover:text-rose-700">
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-navy-400">
                  선택한 대학을 Grade 12 Official College List로 전환해요 (기본 분류: Target — 나중에 Reach/Target/Safety로 재조정 가능).
                  기존 Target College 기록은 그대로 남아요.
                </p>
                <SubmitButton label="Official List로 전환" variant="secondary-sm" toastMessage="전환되었습니다" />
              </div>
            </form>
          )}

          <details>
            <summary className="cursor-pointer text-xs font-medium text-navy-600">+ Target College 추가</summary>
            <form action={addTargetCollege.bind(null, id)} className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>University Name *</label>
                <input name="university_name" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Interested Major</label>
                <input name="interested_major" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <select name="priority" defaultValue="Medium" className={inputClass}>
                  {GOAL_PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {GOAL_PRIORITY_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className={labelClass}>Notes</label>
                <input name="notes" className={inputClass} />
              </div>
              <div className="flex items-end sm:col-span-4">
                <SubmitButton label="+ 추가" variant="secondary-sm" toastMessage="추가되었습니다" />
              </div>
            </form>
          </details>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Annual Counseling Plan</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {plans.map((p) => (
              <Link
                key={p.id}
                href={`/students/${id}/goals?plan=${p.id}`}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  selectedPlan?.id === p.id ? "border-gold-400 bg-gold-50 text-gold-700" : "border-navy-200 text-navy-600 hover:bg-navy-50"
                }`}
              >
                {p.academic_year}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardBody className="space-y-5">
          <details>
            <summary className="cursor-pointer text-xs font-medium text-navy-600">+ 새 Plan 만들기</summary>
            <form action={createCounselingPlan.bind(null, id)} className="mt-2 flex flex-wrap items-end gap-2">
              <div>
                <label className={labelClass}>학년도 (예: 2026-2027) *</label>
                <input name="academic_year" required placeholder="2026-2027" className={inputClass} />
              </div>
              <SubmitButton label="+ 생성" variant="secondary-sm" toastMessage="생성되었습니다" />
            </form>
          </details>

          {selectedPlan && (
            <details>
              <summary className="cursor-pointer text-xs font-medium text-navy-600">
                현재 Plan ({selectedPlan.academic_year}) 수정 / 삭제
              </summary>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <form action={updateCounselingPlan.bind(null, id, selectedPlan.id)} className="flex flex-wrap items-end gap-2">
                  <div>
                    <label className={labelClass}>학년도</label>
                    <input name="academic_year" required defaultValue={selectedPlan.academic_year} className={inputClass} />
                  </div>
                  <SubmitButton label="저장" variant="secondary-sm" toastMessage="저장되었습니다" />
                </form>
                <DeleteCounselingPlanButton studentId={id} planId={selectedPlan.id} academicYear={selectedPlan.academic_year} />
              </div>
            </details>
          )}

          {!selectedPlan && <p className="text-sm text-navy-400">먼저 Counseling Plan을 만들어주세요.</p>}

          {selectedPlan && (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-navy-900">Overall Progress</div>
                  <div className="font-serif text-xl font-semibold text-navy-900">{overall === null ? "—" : `${overall}%`}</div>
                </div>
                <ProgressBar value={overall ?? 0} className="mt-1" />
                <div className="mt-1 text-xs text-navy-400">
                  {tasks.filter((t) => t.is_done).length} / {tasks.length} 완료
                </div>
              </div>

              <div className="space-y-1.5 border-t border-navy-100 pt-4">
                {tasks.length === 0 && <p className="text-sm text-navy-400">등록된 할 일이 아직 없어요.</p>}
                {tasks.map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-navy-100 px-3 py-2">
                    <span className={t.is_done ? "text-sm text-navy-400 line-through" : "text-sm text-navy-900"}>{t.title}</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <form action={togglePlanTask.bind(null, id, t.id)}>
                        <SubmitButton
                          label={t.is_done ? "완료 취소" : "완료"}
                          variant={t.is_done ? "inline-sm" : "secondary-sm"}
                          toastMessage={t.is_done ? "완료를 취소했어요" : "완료 처리했어요"}
                        />
                      </form>
                      <form action={deletePlanTask.bind(null, id, t.id)}>
                        <SubmitButton label="삭제" variant="ghost-danger-sm" toastMessage="삭제되었습니다" />
                      </form>
                    </div>
                  </div>
                ))}
              </div>

              <form action={addPlanTask.bind(null, id, selectedPlan.id)} className="flex flex-wrap items-end gap-2 border-t border-navy-100 pt-3">
                <div className="flex-1">
                  <label className={labelClass}>할 일 제목 *</label>
                  <input name="title" required className={inputClass} placeholder="예: 2차 모의고사 응시" />
                </div>
                <SubmitButton label="+ 추가" variant="secondary-sm" toastMessage="추가되었습니다" />
              </form>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
