import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getStudent,
  getStudentAccess,
  getAcademicOverview,
  getGradeRecords,
  getTerms,
  getCourses,
  getSatScores,
  getActScores,
  getAttachments,
} from "@/lib/data";
import {
  upsertAcademicOverview,
  createGradeRecord,
  completeGradeRecord,
  reopenGradeRecord,
  deleteGradeRecord,
  setGradeGpaOverride,
  setTermGpaOverride,
  addCourse,
  deleteCourse,
  addSatScore,
  deleteSatScore,
  addActScore,
  deleteActScore,
} from "@/lib/actions";
import {
  computeCourseLevelCounts,
  computeGradeGpa,
  computeTermGpa,
  computeCumulativeGpa,
  computeGpaTrendFromGrades,
} from "@/lib/gpa";
import {
  COURSE_LEVEL_OPTIONS,
  SUBJECT_CATEGORY_OPTIONS,
  SUBJECT_CATEGORY_LABEL,
  TERM_SYSTEM_OPTIONS,
  TERM_SYSTEM_LABEL,
  TERM_NOUN,
} from "@/lib/labels";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { AttachmentsSection } from "@/components/students/AttachmentsSection";
import { CourseGradeInput } from "@/components/students/CourseGradeInput";
import type { Course } from "@/lib/types";

export const dynamic = "force-dynamic";

const GRADE_LEVELS = [9, 10, 11, 12] as const;
const GOLD_LEVELS = ["AP", "IB HL", "A-Level", "Dual Enrollment", "College Level"];

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-navy-500";

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</div>
        <div className="mt-1 font-serif text-xl font-semibold text-navy-900">{value}</div>
      </CardBody>
    </Card>
  );
}

function gpaText(v: number | null): string {
  return v === null ? "—" : v.toFixed(2);
}

function courseGradeDisplay(c: Course): string {
  if (c.grade_scale === "letter") return c.letter_grade ?? "—";
  if (c.grade_scale === "100_point") return c.point_score !== null ? String(c.point_score) : "—";
  return c.custom_grade ?? "—";
}

export default async function AcademicsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();
  const access = await getStudentAccess(id);
  if (!access?.canViewAll) notFound();

  const [academic, gradeRecords, terms, courses, satScores, actScores, attachments] = await Promise.all([
    getAcademicOverview(id),
    getGradeRecords(id),
    getTerms(id),
    getCourses(id),
    getSatScores(id),
    getActScores(id),
    getAttachments(id),
  ]);

  const levelCounts = computeCourseLevelCounts(courses);
  const trend = computeGpaTrendFromGrades(gradeRecords, terms, courses);
  const pureComputedCumulative = computeCumulativeGpa(gradeRecords, terms, courses);
  const cumulative = computeCumulativeGpa(
    gradeRecords,
    terms,
    courses,
    academic ? { unweighted: academic.unweighted_gpa, weighted: academic.weighted_gpa } : undefined
  );

  const sortedGradeRecords = [...gradeRecords].sort((a, b) => a.grade_level - b.grade_level);
  const existingGradeLevels = new Set(gradeRecords.map((g) => g.grade_level));

  // The next grade a counselor can add — grade 9 is always addable first;
  // after that, the previous grade has to be marked "완료" first, so the
  // flow stays Grade 선택 → Term 생성 → 입력 → 완료 → 다음 학년, one at a time.
  let nextAddableGrade: (typeof GRADE_LEVELS)[number] | null = null;
  for (const g of GRADE_LEVELS) {
    if (existingGradeLevels.has(g)) continue;
    const prevRecord = gradeRecords.find((r) => r.grade_level === g - 1);
    if (g === 9 || prevRecord?.status === "completed") nextAddableGrade = g;
    break;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/students/${id}`} className="text-xs font-medium text-navy-400 hover:text-navy-600">
          ← {student.english_name ?? student.student_name}
        </Link>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-navy-900">학업 프로필</h1>
        <p className="text-sm text-navy-500">
          {student.student_name} · {student.high_school}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Only cards for levels this student actually has courses in — an
            AP-only school showing "IB HL: 0개" reads as missing data rather
            than simply not applicable to that school's curriculum. */}
        {levelCounts.ap > 0 && <SummaryCard label="AP" value={`${levelCounts.ap}개`} />}
        {levelCounts.ibHl > 0 && <SummaryCard label="IB High Level" value={`${levelCounts.ibHl}개`} />}
        {levelCounts.ibSl > 0 && <SummaryCard label="IB Standard Level" value={`${levelCounts.ibSl}개`} />}
        {levelCounts.honors > 0 && <SummaryCard label="Honors" value={`${levelCounts.honors}개`} />}
        <SummaryCard label="누적 비가중 GPA" value={gpaText(cumulative.unweighted)} />
        <SummaryCard label="누적 가중 GPA" value={gpaText(cumulative.weighted)} />
        <SummaryCard label="GPA 추세" value={trend} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>전체 학업 정보</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={upsertAcademicOverview.bind(null, id)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <label className={labelClass}>비가중 GPA (수동 덮어쓰기)</label>
                <input
                  type="number"
                  step="0.001"
                  name="unweighted_gpa"
                  defaultValue={academic?.unweighted_gpa ?? ""}
                  placeholder={`자동: ${gpaText(pureComputedCumulative.unweighted)}`}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>가중 GPA (수동 덮어쓰기)</label>
                <input
                  type="number"
                  step="0.001"
                  name="weighted_gpa"
                  defaultValue={academic?.weighted_gpa ?? ""}
                  placeholder={`자동: ${gpaText(pureComputedCumulative.weighted)}`}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>GPA 스케일</label>
                <input type="number" step="0.01" name="gpa_scale" defaultValue={academic?.gpa_scale ?? 4.0} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>석차</label>
                <input type="number" name="class_rank" defaultValue={academic?.class_rank ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>전체 학생 수</label>
                <input type="number" name="class_size" defaultValue={academic?.class_size ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>백분위</label>
                <input type="number" step="0.01" name="percentile" defaultValue={academic?.percentile ?? ""} className={inputClass} />
              </div>
            </div>
            <p className="text-xs text-navy-400">
              GPA는 비워두면 아래 Academic Record의 과목·성적 입력으로 자동 계산된 값이 쓰여요. 학교 공식 transcript와 다르면 숫자를
              직접 입력해서 덮어쓸 수 있어요.
            </p>
            <label className="flex items-center gap-2 text-sm text-navy-700">
              <input type="checkbox" name="school_does_not_rank" defaultChecked={academic?.school_does_not_rank ?? false} />
              학교는 석차를 산정하지 않음
            </label>
            <div className="flex justify-end">
              <SubmitButton label="저장" toastMessage="저장되었습니다" />
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Record</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {sortedGradeRecords.length === 0 && nextAddableGrade === null && (
            <p className="text-sm text-navy-400">등록된 학년이 아직 없어요.</p>
          )}

          {sortedGradeRecords.map((gr) => {
            const gradeTerms = terms.filter((t) => t.grade_record_id === gr.id).sort((a, b) => a.term_number - b.term_number);
            const gradeEff = computeGradeGpa(gr, terms, courses);
            const pureGradeComputed = computeGradeGpa({ ...gr, manual_unweighted_gpa: null, manual_weighted_gpa: null }, terms, courses);
            const termNoun = TERM_NOUN[gr.term_system];
            const nextAfterThis = gr.grade_level < 12 ? ((gr.grade_level + 1) as 10 | 11 | 12) : null;

            return (
              <div key={gr.id} className="rounded-xl border border-navy-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-serif text-lg font-semibold text-navy-900">Grade {gr.grade_level}</div>
                    <div className="text-xs text-navy-400">
                      {gr.academic_year ?? "학년도 미지정"} · {TERM_SYSTEM_LABEL[gr.term_system]}
                      {gr.status === "in_progress" ? " · 진행 중" : " · 완료"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wide text-navy-400">Unweighted / Weighted</div>
                    <div className="font-serif text-xl font-semibold text-navy-900">
                      {gpaText(gradeEff.unweighted)} / {gpaText(gradeEff.weighted)}
                      {gradeEff.isOverridden && <span className="ml-1 text-[10px] font-medium text-gold-600">수동</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {gradeTerms.map((term) => {
                    const termCourses = courses.filter((c) => c.term_id === term.id);
                    const termEff = computeTermGpa(term, courses);
                    const pureTermComputed = computeTermGpa({ ...term, manual_unweighted_gpa: null, manual_weighted_gpa: null }, courses);
                    return (
                      <div key={term.id} className="rounded-lg border border-navy-100 bg-navy-50/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-navy-900">
                            {termNoun} {term.term_number}
                          </div>
                          <div className="text-sm text-navy-900">
                            {termCourses.length}개 과목 · {gpaText(termEff.unweighted)} / {gpaText(termEff.weighted)}
                            {termEff.isOverridden && <span className="ml-1 text-[10px] font-medium text-gold-600">수동</span>}
                          </div>
                        </div>

                        {termCourses.length > 0 && (
                          <div className="mt-2 overflow-x-auto">
                            <table className="w-full min-w-[560px] text-sm">
                              <thead>
                                <tr className="text-xs font-medium uppercase tracking-wide text-navy-400">
                                  <th className="border-b border-navy-100 px-2 py-1.5 text-left">Course</th>
                                  <th className="border-b border-navy-100 px-2 py-1.5 text-left">Level</th>
                                  <th className="border-b border-navy-100 px-2 py-1.5 text-left">영역</th>
                                  <th className="border-b border-navy-100 px-2 py-1.5 text-left">Credit</th>
                                  <th className="border-b border-navy-100 px-2 py-1.5 text-left">Grade</th>
                                  <th className="border-b border-navy-100 px-2 py-1.5"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {termCourses.map((c) => (
                                  <tr key={c.id} className="border-b border-navy-50 last:border-0">
                                    <td className="px-2 py-1.5 text-navy-900">{c.course_name}</td>
                                    <td className="px-2 py-1.5">
                                      <Pill tone={GOLD_LEVELS.includes(c.course_level) ? "gold" : "neutral"}>{c.course_level}</Pill>
                                    </td>
                                    <td className="px-2 py-1.5 text-navy-600">
                                      {c.subject_category ? SUBJECT_CATEGORY_LABEL[c.subject_category] : "—"}
                                    </td>
                                    <td className="px-2 py-1.5 text-navy-600">{c.credit}</td>
                                    <td className="px-2 py-1.5 font-medium text-navy-900">{courseGradeDisplay(c)}</td>
                                    <td className="px-2 py-1.5 text-right">
                                      <form action={deleteCourse.bind(null, id, c.id)}>
                                        <SubmitButton label="삭제" variant="ghost-danger-sm" toastMessage="삭제되었습니다" />
                                      </form>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        <form
                          action={addCourse.bind(null, id, term.id)}
                          className="mt-3 grid grid-cols-1 gap-2.5 border-t border-navy-100 pt-3 sm:grid-cols-3 lg:grid-cols-6"
                        >
                          <div className="sm:col-span-2">
                            <label className={labelClass}>Course Name *</label>
                            <input name="course_name" required className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Subject Category</label>
                            <select name="subject_category" defaultValue="" className={inputClass}>
                              <option value="">선택 안 함</option>
                              {SUBJECT_CATEGORY_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {SUBJECT_CATEGORY_LABEL[s]}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Course Level *</label>
                            <select name="course_level" required defaultValue="Regular" className={inputClass}>
                              {COURSE_LEVEL_OPTIONS.map((l) => (
                                <option key={l} value={l}>
                                  {l}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Credit</label>
                            <input type="number" step="0.5" min={0} name="credit" defaultValue={1} className={inputClass} />
                          </div>
                          <CourseGradeInput inputClass={inputClass} labelClass={labelClass} />
                          <div className="flex items-end sm:col-span-3 lg:col-span-6">
                            <SubmitButton label="+ Add Course" variant="secondary-sm" toastMessage="추가되었습니다" />
                          </div>
                        </form>

                        <details className="mt-2">
                          <summary className="cursor-pointer text-[11px] text-navy-400">
                            이 {termNoun} GPA 수동 조정
                          </summary>
                          <form
                            action={setTermGpaOverride.bind(null, id, term.id)}
                            className="mt-2 flex flex-wrap items-end gap-2"
                          >
                            <div>
                              <label className={labelClass}>비가중 GPA</label>
                              <input
                                type="number"
                                step="0.001"
                                name="manual_unweighted_gpa"
                                defaultValue={term.manual_unweighted_gpa ?? ""}
                                placeholder={`자동: ${gpaText(pureTermComputed.unweighted)}`}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>가중 GPA</label>
                              <input
                                type="number"
                                step="0.001"
                                name="manual_weighted_gpa"
                                defaultValue={term.manual_weighted_gpa ?? ""}
                                placeholder={`자동: ${gpaText(pureTermComputed.weighted)}`}
                                className={inputClass}
                              />
                            </div>
                            <SubmitButton label="저장" variant="inline-sm" toastMessage="저장되었습니다" />
                          </form>
                        </details>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-navy-100 pt-4 sm:grid-cols-4">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">Total Courses</div>
                    <div className="mt-0.5 text-sm font-semibold text-navy-900">{gradeEff.totalCourses}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">Total Credits</div>
                    <div className="mt-0.5 text-sm font-semibold text-navy-900">{gradeEff.totalCredits}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">Unweighted GPA</div>
                    <div className="mt-0.5 text-sm font-semibold text-navy-900">{gpaText(gradeEff.unweighted)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">Weighted GPA</div>
                    <div className="mt-0.5 text-sm font-semibold text-navy-900">{gpaText(gradeEff.weighted)}</div>
                  </div>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-[11px] text-navy-400">이 학년 GPA 수동 조정</summary>
                  <form action={setGradeGpaOverride.bind(null, id, gr.id)} className="mt-2 flex flex-wrap items-end gap-2">
                    <div>
                      <label className={labelClass}>비가중 GPA</label>
                      <input
                        type="number"
                        step="0.001"
                        name="manual_unweighted_gpa"
                        defaultValue={gr.manual_unweighted_gpa ?? ""}
                        placeholder={`자동: ${gpaText(pureGradeComputed.unweighted)}`}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>가중 GPA</label>
                      <input
                        type="number"
                        step="0.001"
                        name="manual_weighted_gpa"
                        defaultValue={gr.manual_weighted_gpa ?? ""}
                        placeholder={`자동: ${gpaText(pureGradeComputed.weighted)}`}
                        className={inputClass}
                      />
                    </div>
                    <SubmitButton label="저장" variant="inline-sm" toastMessage="저장되었습니다" />
                  </form>
                </details>

                <div className="mt-4 flex items-center justify-between">
                  <form action={deleteGradeRecord.bind(null, id, gr.id)}>
                    <SubmitButton label="Grade 삭제" variant="ghost-danger-sm" toastMessage="삭제되었습니다" />
                  </form>
                  {gr.status === "in_progress" ? (
                    <form action={completeGradeRecord.bind(null, id, gr.id)}>
                      <SubmitButton
                        label={nextAfterThis ? `Complete Grade ${gr.grade_level} & Add Grade ${nextAfterThis}` : `Complete Grade ${gr.grade_level}`}
                        variant="secondary"
                        toastMessage="완료 처리되었습니다"
                      />
                    </form>
                  ) : (
                    <form action={reopenGradeRecord.bind(null, id, gr.id)}>
                      <SubmitButton label="다시 열기" variant="secondary-sm" toastMessage="다시 열었어요" />
                    </form>
                  )}
                </div>
              </div>
            );
          })}

          {nextAddableGrade && (
            <div className="rounded-xl border border-dashed border-navy-200 p-4">
              <div className="mb-3 font-serif text-lg font-semibold text-navy-900">Grade {nextAddableGrade} 추가</div>
              <form action={createGradeRecord.bind(null, id)} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <input type="hidden" name="grade_level" value={nextAddableGrade} />
                <div>
                  <label className={labelClass}>학년도</label>
                  <input name="academic_year" placeholder="예: 2026-2027" className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Academic Term System *</label>
                  <select name="term_system" defaultValue="2_semesters" className={inputClass}>
                    {TERM_SYSTEM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>직접 설정 학기 수</label>
                  <input type="number" min={1} max={12} name="custom_term_count" placeholder="Custom 선택 시만" className={inputClass} />
                </div>
                <div className="flex items-end justify-end sm:col-span-4">
                  <SubmitButton label={`Grade ${nextAddableGrade} 시작`} variant="secondary" toastMessage="학년이 추가되었습니다" />
                </div>
              </form>
            </div>
          )}

          <AttachmentsSection
            studentId={id}
            entityType="transcript"
            entityId={id}
            attachments={attachments.filter((a) => a.entity_id === id && a.entity_type === "transcript")}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>표준화 시험 (SAT/ACT)</CardTitle>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-navy-900">SAT</h3>
            {satScores.length === 0 && <p className="text-sm text-navy-400">등록된 SAT 성적이 아직 없어요.</p>}
            {satScores.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="text-xs font-medium uppercase tracking-wide text-navy-400">
                      <th className="border-b border-navy-100 px-2 py-2 text-left">차수</th>
                      <th className="border-b border-navy-100 px-2 py-2 text-left">응시일</th>
                      <th className="border-b border-navy-100 px-2 py-2 text-left">총점</th>
                      <th className="border-b border-navy-100 px-2 py-2 text-left">RW</th>
                      <th className="border-b border-navy-100 px-2 py-2 text-left">Math</th>
                      <th className="border-b border-navy-100 px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {satScores.map((s) => (
                      <tr key={s.id} className="border-b border-navy-50 last:border-0">
                        <td className="px-2 py-2 text-navy-600">{s.attempt_number ? `${s.attempt_number}차` : "—"}</td>
                        <td className="px-2 py-2 text-navy-600">{s.test_date}</td>
                        <td className="px-2 py-2 font-medium text-navy-900">{s.total_score}</td>
                        <td className="px-2 py-2 text-navy-600">{s.reading_writing}</td>
                        <td className="px-2 py-2 text-navy-600">{s.math}</td>
                        <td className="px-2 py-2 text-right">
                          <form action={deleteSatScore.bind(null, id, s.id)}>
                            <SubmitButton label="삭제" variant="ghost-danger-sm" toastMessage="삭제되었습니다" />
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <form action={addSatScore.bind(null, id)} className="grid grid-cols-2 gap-3 border-t border-navy-100 pt-4 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <label className={labelClass}>차수</label>
                <input type="number" min={1} name="attempt_number" placeholder="예: 1" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>응시일</label>
                <input type="date" name="test_date" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>총점 *</label>
                <input type="number" name="total_score" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Reading/Writing</label>
                <input type="number" name="reading_writing" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Math</label>
                <input type="number" name="math" className={inputClass} />
              </div>
              <div className="flex items-end">
                <SubmitButton label="+ SAT 추가" variant="secondary-sm" toastMessage="추가되었습니다" />
              </div>
            </form>
          </div>

          <div className="space-y-3 border-t border-navy-100 pt-6">
            <h3 className="text-sm font-semibold text-navy-900">ACT</h3>
            {actScores.length === 0 && <p className="text-sm text-navy-400">등록된 ACT 성적이 아직 없어요.</p>}
            {actScores.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="text-xs font-medium uppercase tracking-wide text-navy-400">
                      <th className="border-b border-navy-100 px-2 py-2 text-left">차수</th>
                      <th className="border-b border-navy-100 px-2 py-2 text-left">응시일</th>
                      <th className="border-b border-navy-100 px-2 py-2 text-left">종합</th>
                      <th className="border-b border-navy-100 px-2 py-2 text-left">English</th>
                      <th className="border-b border-navy-100 px-2 py-2 text-left">Math</th>
                      <th className="border-b border-navy-100 px-2 py-2 text-left">Reading</th>
                      <th className="border-b border-navy-100 px-2 py-2 text-left">Science</th>
                      <th className="border-b border-navy-100 px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {actScores.map((a) => (
                      <tr key={a.id} className="border-b border-navy-50 last:border-0">
                        <td className="px-2 py-2 text-navy-600">{a.attempt_number ? `${a.attempt_number}차` : "—"}</td>
                        <td className="px-2 py-2 text-navy-600">{a.test_date}</td>
                        <td className="px-2 py-2 font-medium text-navy-900">{a.composite}</td>
                        <td className="px-2 py-2 text-navy-600">{a.english}</td>
                        <td className="px-2 py-2 text-navy-600">{a.math}</td>
                        <td className="px-2 py-2 text-navy-600">{a.reading}</td>
                        <td className="px-2 py-2 text-navy-600">{a.science}</td>
                        <td className="px-2 py-2 text-right">
                          <form action={deleteActScore.bind(null, id, a.id)}>
                            <SubmitButton label="삭제" variant="ghost-danger-sm" toastMessage="삭제되었습니다" />
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <form action={addActScore.bind(null, id)} className="grid grid-cols-2 gap-3 border-t border-navy-100 pt-4 sm:grid-cols-4 lg:grid-cols-7">
              <div>
                <label className={labelClass}>차수</label>
                <input type="number" min={1} name="attempt_number" placeholder="예: 1" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>응시일</label>
                <input type="date" name="test_date" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>종합 *</label>
                <input type="number" step="0.1" name="composite" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>English</label>
                <input type="number" name="english" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Math</label>
                <input type="number" name="math" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Reading</label>
                <input type="number" name="reading" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Science</label>
                <input type="number" name="science" className={inputClass} />
              </div>
              <div className="flex items-end sm:col-span-4 lg:col-span-7">
                <SubmitButton label="+ ACT 추가" variant="secondary-sm" toastMessage="추가되었습니다" />
              </div>
            </form>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
