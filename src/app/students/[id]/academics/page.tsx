import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudent, getStudentAccess, getAcademicOverview, getGpaByGrade, getCourses, getSatScores, getActScores } from "@/lib/data";
import { upsertAcademicOverview, upsertGpaGrid, addCourse, deleteCourse, addSatScore, deleteSatScore, addActScore, deleteActScore } from "@/lib/actions";
import { computeRigorSummary, computeGpaTrend } from "@/lib/rigor";
import { GPA_SUBJECT_LABEL, SUBJECT_AREA_LABEL, COURSE_LEVEL_OPTIONS } from "@/lib/labels";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

const GPA_SUBJECTS = ["english", "math", "science", "social_studies", "foreign_language", "other", "overall"] as const;
const GRADE_LEVELS = [9, 10, 11, 12] as const;

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

export default async function AcademicsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();
  const access = await getStudentAccess(id);
  if (!access?.canViewAll) notFound();

  const [academic, gpaRows, courses, satScores, actScores] = await Promise.all([
    getAcademicOverview(id),
    getGpaByGrade(id),
    getCourses(id),
    getSatScores(id),
    getActScores(id),
  ]);

  const rigor = computeRigorSummary(courses);
  const trend = computeGpaTrend(gpaRows);

  const gpaMap: Record<string, number | null> = {};
  for (const row of gpaRows) {
    gpaMap[`${row.grade_level}_${row.subject}`] = row.gpa;
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
        <SummaryCard label="전체 커리큘럼 강도" value={rigor.overallLabel} />
        <SummaryCard label="STEM 강도" value={rigor.stemLabel} />
        <SummaryCard label="Humanities 강도" value={rigor.humanitiesLabel} />
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
                <label className={labelClass}>비가중 GPA</label>
                <input type="number" step="0.001" name="unweighted_gpa" defaultValue={academic?.unweighted_gpa ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>가중 GPA</label>
                <input type="number" step="0.001" name="weighted_gpa" defaultValue={academic?.weighted_gpa ?? ""} className={inputClass} />
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
          <CardTitle>학년별 GPA</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={upsertGpaGrid.bind(null, id)} className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-navy-100 px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-navy-400">과목</th>
                    {GRADE_LEVELS.map((g) => (
                      <th key={g} className="border-b border-navy-100 px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-navy-400">
                        {g}학년
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GPA_SUBJECTS.map((subject) => (
                    <tr key={subject}>
                      <td className={`px-2 py-1.5 text-sm ${subject === "overall" ? "font-semibold text-navy-900" : "text-navy-700"}`}>
                        {GPA_SUBJECT_LABEL[subject]}
                      </td>
                      {GRADE_LEVELS.map((g) => (
                        <td key={g} className="px-2 py-1.5">
                          <input
                            type="number"
                            step="0.001"
                            name={`gpa_${g}_${subject}`}
                            defaultValue={gpaMap[`${g}_${subject}`] ?? ""}
                            className={inputClass}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <SubmitButton label="GPA 저장" toastMessage="저장되었습니다" />
            </div>
          </form>
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

      <Card>
        <CardHeader>
          <CardTitle>수강 과목 (Course Rigor)</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {courses.length === 0 && <p className="text-sm text-navy-400">등록된 과목이 아직 없어요.</p>}
          {courses.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-xs font-medium uppercase tracking-wide text-navy-400">
                    <th className="border-b border-navy-100 px-2 py-2 text-left">과목명</th>
                    <th className="border-b border-navy-100 px-2 py-2 text-left">학년</th>
                    <th className="border-b border-navy-100 px-2 py-2 text-left">학년도</th>
                    <th className="border-b border-navy-100 px-2 py-2 text-left">Level</th>
                    <th className="border-b border-navy-100 px-2 py-2 text-left">영역</th>
                    <th className="border-b border-navy-100 px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id} className="border-b border-navy-50 last:border-0">
                      <td className="px-2 py-2 text-navy-900">{c.course_name}</td>
                      <td className="px-2 py-2 text-navy-600">{c.grade_level}학년</td>
                      <td className="px-2 py-2 text-navy-600">{c.academic_year}</td>
                      <td className="px-2 py-2">
                        <Pill tone={["AP", "IB HL", "A-Level", "Dual Enrollment", "College Level"].includes(c.course_level) ? "gold" : "neutral"}>
                          {c.course_level}
                        </Pill>
                      </td>
                      <td className="px-2 py-2 text-navy-600">{SUBJECT_AREA_LABEL[c.subject_area ?? "Other"]}</td>
                      <td className="px-2 py-2 text-right">
                        <form action={deleteCourse.bind(null, id, c.id)}>
                          <SubmitButton label="삭제" variant="ghost-danger" toastMessage="삭제되었습니다" />
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <form action={addCourse.bind(null, id)} className="grid grid-cols-1 gap-3 border-t border-navy-100 pt-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className={labelClass}>과목명 *</label>
              <input name="course_name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>학년</label>
              <select name="grade_level" defaultValue="" className={inputClass}>
                <option value="" disabled>선택</option>
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>{g}학년</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>학년도</label>
              <input name="academic_year" placeholder="예: 2025-2026" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Course Level *</label>
              <select name="course_level" required defaultValue="" className={inputClass}>
                <option value="" disabled>선택</option>
                {COURSE_LEVEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>영역</label>
              <select name="subject_area" defaultValue="" className={inputClass}>
                <option value="" disabled>선택</option>
                <option value="STEM">STEM</option>
                <option value="Humanities">Humanities</option>
                <option value="Other">기타</option>
              </select>
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-5">
              <SubmitButton label="+ 과목 추가" variant="secondary" toastMessage="추가되었습니다" />
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
