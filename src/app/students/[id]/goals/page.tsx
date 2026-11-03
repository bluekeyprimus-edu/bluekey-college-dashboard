import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getStudent,
  getStudentAccess,
  getCurrentMajorGoal,
  getMajorGoalHistory,
  getTargetColleges,
  getCounselingPlans,
  getCounselingGoals,
  getGoalMilestones,
} from "@/lib/data";
import {
  addMajorGoal,
  addTargetCollege,
  deleteTargetCollege,
  convertTargetCollegesToCollegeList,
  createCounselingPlan,
  addCounselingGoal,
  updateCounselingGoal,
  deleteCounselingGoal,
  addGoalMilestone,
  updateGoalMilestone,
  deleteGoalMilestone,
} from "@/lib/actions";
import {
  timeProgress,
  goalProgress,
  trackIndicator,
  overdueMilestones,
  overallGoalProgress,
  progressByCategory,
  monthlyRoadmap,
  monthLabelKorean,
} from "@/lib/goals";
import {
  GOAL_PRIORITY_OPTIONS,
  GOAL_PRIORITY_LABEL,
  GOAL_CATEGORY_OPTIONS,
  GOAL_CATEGORY_LABEL,
  GOAL_STATUS_OPTIONS,
  GOAL_STATUS_LABEL,
  MILESTONE_STATUS_OPTIONS,
  MILESTONE_STATUS_LABEL,
  TRACK_INDICATOR_LABEL,
} from "@/lib/labels";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { CounselingGoal, GoalMilestone } from "@/lib/types";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-navy-500";

function priorityTone(p: string): "red" | "amber" | "neutral" {
  return p === "High" ? "red" : p === "Medium" ? "amber" : "neutral";
}

function statusTone(s: string): "green" | "amber" | "gold" | "neutral" {
  if (s === "Completed") return "green";
  if (s === "In Progress") return "amber";
  if (s === "On Hold") return "gold";
  return "neutral";
}

function GoalCard({
  studentId,
  goal,
  milestones,
}: {
  studentId: string;
  goal: CounselingGoal;
  milestones: GoalMilestone[];
}) {
  const ownMilestones = milestones.filter((m) => m.goal_id === goal.id).sort((a, b) => ((a.due_date ?? "") < (b.due_date ?? "") ? -1 : 1));
  const time = timeProgress(goal);
  const progress = goalProgress(goal, milestones);
  const track = trackIndicator(goal, milestones);
  const overdue = overdueMilestones(ownMilestones);

  return (
    <div className="rounded-xl border border-navy-100 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-serif text-lg font-semibold text-navy-900">{goal.title}</div>
            <Pill tone="neutral">{GOAL_CATEGORY_LABEL[goal.category]}</Pill>
            <Pill tone={priorityTone(goal.priority)}>{GOAL_PRIORITY_LABEL[goal.priority]}</Pill>
            <Pill tone={statusTone(goal.status)}>{GOAL_STATUS_LABEL[goal.status]}</Pill>
          </div>
          {goal.description && <p className="mt-1 text-sm text-navy-600">{goal.description}</p>}
          <div className="mt-1 text-xs text-navy-400">
            {goal.start_date ?? "시작일 미정"} → {goal.target_completion_date ?? "목표일 미정"}
          </div>
        </div>
        <div className="text-right text-sm font-medium">{track ? TRACK_INDICATOR_LABEL[track] : <span className="text-navy-300">—</span>}</div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-navy-500">
            <span>Time Elapsed</span>
            <span>{time === null ? "—" : `${time}%`}</span>
          </div>
          <ProgressBar value={time ?? 0} size="sm" />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-navy-500">
            <span>Goal Completion</span>
            <span>{progress}%</span>
          </div>
          <ProgressBar value={progress} size="sm" />
        </div>
      </div>

      {overdue.length > 0 && (
        <p className="mt-2 text-xs font-medium text-rose-600">⚠ 기한 지난 Milestone {overdue.length}개</p>
      )}

      <div className="mt-3 space-y-1.5">
        {ownMilestones.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-navy-100 px-2.5 py-1.5 text-sm">
            <span className={`font-medium ${m.status !== "Completed" && m.due_date && m.due_date < new Date().toISOString().slice(0, 10) ? "text-rose-600" : "text-navy-900"}`}>
              {m.title}
            </span>
            <span className="text-xs text-navy-400">{m.due_date ?? "날짜 미정"}</span>
            <form action={updateGoalMilestone.bind(null, studentId, m.id)} className="ml-auto flex flex-wrap items-center gap-1.5">
              <input type="hidden" name="title" value={m.title} />
              <input type="hidden" name="due_date" value={m.due_date ?? ""} />
              <input type="hidden" name="notes" value={m.notes ?? ""} />
              <input type="hidden" name="completion_date" value={m.completion_date ?? ""} />
              <select name="status" defaultValue={m.status} className="rounded-md border border-navy-200 bg-white px-1.5 py-1 text-xs">
                {MILESTONE_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {MILESTONE_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <SubmitButton label="저장" variant="inline-sm" toastMessage="저장되었습니다" />
            </form>
            <form action={deleteGoalMilestone.bind(null, studentId, m.id)}>
              <SubmitButton label="삭제" variant="ghost-danger-sm" toastMessage="삭제되었습니다" />
            </form>
          </div>
        ))}
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-[11px] text-navy-400">+ Milestone 추가</summary>
        <form action={addGoalMilestone.bind(null, studentId, goal.id)} className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Milestone Title *</label>
            <input name="title" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Due Date</label>
            <input type="date" name="due_date" className={inputClass} />
          </div>
          <div className="flex items-end">
            <SubmitButton label="+ 추가" variant="secondary-sm" toastMessage="추가되었습니다" />
          </div>
          <div className="sm:col-span-4">
            <label className={labelClass}>Notes</label>
            <input name="notes" className={inputClass} />
          </div>
        </form>
      </details>

      <details className="mt-3 border-t border-navy-100 pt-2">
        <summary className="cursor-pointer text-[11px] text-navy-400">Goal 수정</summary>
        <form action={updateCounselingGoal.bind(null, studentId, goal.id)} className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Goal Title *</label>
            <input name="title" required defaultValue={goal.title} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select name="category" defaultValue={goal.category} className={inputClass}>
              {GOAL_CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {GOAL_CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className={labelClass}>Description</label>
            <input name="description" defaultValue={goal.description ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Start Date</label>
            <input type="date" name="start_date" defaultValue={goal.start_date ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Target Completion Date</label>
            <input type="date" name="target_completion_date" defaultValue={goal.target_completion_date ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select name="priority" defaultValue={goal.priority} className={inputClass}>
              {GOAL_PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {GOAL_PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select name="status" defaultValue={goal.status} className={inputClass}>
              {GOAL_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {GOAL_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>On Track 수동 조정</label>
            <select name="track_override" defaultValue={goal.track_override ?? ""} className={inputClass}>
              <option value="">자동 계산</option>
              <option value="on_track">🟢 On Track</option>
              <option value="behind">🟡 Behind Schedule</option>
              <option value="needs_attention">🔴 Needs Attention</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className={labelClass}>Counselor Notes</label>
            <input name="counselor_notes" defaultValue={goal.counselor_notes ?? ""} className={inputClass} />
          </div>
          <div className="flex items-center justify-between sm:col-span-3">
            <form action={deleteCounselingGoal.bind(null, studentId, goal.id)}>
              <SubmitButton label="Goal 삭제" variant="ghost-danger-sm" toastMessage="삭제되었습니다" />
            </form>
            <SubmitButton label="저장" variant="secondary-sm" toastMessage="저장되었습니다" />
          </div>
        </form>
      </details>
    </div>
  );
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
  const [goals, allMilestones] = selectedPlan
    ? await Promise.all([getCounselingGoals(selectedPlan.id), getGoalMilestones(id)])
    : [[], []];
  const milestones = allMilestones.filter((m) => goals.some((g) => g.id === m.goal_id));

  const overall = overallGoalProgress(goals, milestones);
  const byCategory = progressByCategory(goals, milestones);
  const roadmap = monthlyRoadmap(goals, milestones);

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

          {!selectedPlan && <p className="text-sm text-navy-400">먼저 Counseling Plan을 만들어주세요.</p>}

          {selectedPlan && (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-navy-900">Overall Progress</div>
                  <div className="font-serif text-xl font-semibold text-navy-900">{overall === null ? "—" : `${overall}%`}</div>
                </div>
                <ProgressBar value={overall ?? 0} className="mt-1" />
                {byCategory.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {byCategory.map((c) => (
                      <div key={c.category}>
                        <div className="mb-1 flex items-center justify-between text-xs text-navy-500">
                          <span>{GOAL_CATEGORY_LABEL[c.category]}</span>
                          <span>{c.progress}%</span>
                        </div>
                        <ProgressBar value={c.progress} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-navy-100 pt-4">
                {goals.length === 0 && <p className="text-sm text-navy-400">등록된 Goal이 아직 없어요.</p>}
                {goals.map((g) => (
                  <GoalCard key={g.id} studentId={id} goal={g} milestones={milestones} />
                ))}
              </div>

              <details className="border-t border-navy-100 pt-3">
                <summary className="cursor-pointer text-xs font-medium text-navy-600">+ Goal 추가</summary>
                <form action={addCounselingGoal.bind(null, id, selectedPlan.id)} className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Goal Title *</label>
                    <input name="title" required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Category</label>
                    <select name="category" defaultValue="Academics" className={inputClass}>
                      {GOAL_CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {GOAL_CATEGORY_LABEL[c]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className={labelClass}>Description</label>
                    <input name="description" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Start Date</label>
                    <input type="date" name="start_date" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Target Completion Date</label>
                    <input type="date" name="target_completion_date" className={inputClass} />
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
                  <div className="sm:col-span-3">
                    <label className={labelClass}>Counselor Notes</label>
                    <input name="counselor_notes" className={inputClass} />
                  </div>
                  <div className="flex items-end justify-end sm:col-span-3">
                    <SubmitButton label="+ Goal 추가" variant="secondary-sm" toastMessage="추가되었습니다" />
                  </div>
                </form>
              </details>

              {roadmap.length > 0 && (
                <div className="border-t border-navy-100 pt-4">
                  <div className="mb-3 text-sm font-semibold text-navy-900">Monthly Roadmap</div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {roadmap.map(({ month, items }) => (
                      <div key={month} className="rounded-lg border border-navy-100 p-3">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">{monthLabelKorean(month)}</div>
                        <ul className="space-y-1.5">
                          {items.map(({ milestone, goal }) => (
                            <li key={milestone.id} className="text-sm">
                              <span className={milestone.status === "Completed" ? "text-navy-400 line-through" : "text-navy-900"}>
                                {milestone.title}
                              </span>
                              <div className="text-[11px] text-navy-400">{goal.title}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
