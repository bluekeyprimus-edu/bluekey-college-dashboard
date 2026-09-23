import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudent, getAcademicOverview, getSatScores, getCollegeList, getHistoricalAdmissionsByUniversity } from "@/lib/data";
import { computeAdmissionsPositioning, PositioningResult } from "@/lib/positioning";
import { COLLEGE_CATEGORY_LABEL } from "@/lib/labels";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";

export const dynamic = "force-dynamic";

function positioningTone(label: string): "green" | "gold" | "amber" | "neutral" {
  if (label === "Above Historical Range") return "green";
  if (label === "Within Historical Range") return "gold";
  if (label === "Below Historical Range") return "amber";
  return "neutral";
}

export default async function RecommendationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();

  const [academic, sat, colleges] = await Promise.all([getAcademicOverview(id), getSatScores(id), getCollegeList(id)]);

  const studentGpa = academic?.unweighted_gpa ?? academic?.weighted_gpa ?? null;
  const bestSat = sat.length ? Math.max(...sat.map((s) => s.total_score)) : null;

  const rows: { collegeId: string; category: string; universityName: string; result: PositioningResult }[] = [];
  for (const c of colleges) {
    const historical = await getHistoricalAdmissionsByUniversity(c.university_name);
    const result = computeAdmissionsPositioning({ gpa: studentGpa, sat: bestSat }, historical);
    rows.push({ collegeId: c.id, category: c.category, universityName: c.university_name, result });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/students/${id}`} className="text-xs font-medium text-navy-400 hover:text-navy-600">
          ← {student.english_name ?? student.student_name}
        </Link>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-navy-900">Admissions Positioning</h1>
        <p className="text-sm text-navy-500">
          컬리지 리스트의 각 대학에 대해, 블루키의 과거 합격생 데이터 대비 학생의 학업 프로필 위치(Profile Fit)를 보여줘요.
        </p>
      </div>

      <Card>
        <CardBody className="flex items-start gap-3">
          <span className="mt-0.5 text-lg">ⓘ</span>
          <p className="text-sm text-navy-600">
            이 지표는 <strong>합격 가능성을 예측하지 않아요.</strong> 학생의 GPA·SAT가 블루키 과거 합격생들의 평균 대비 어디에 위치하는지 보여주는
            참고용 Admissions Positioning 지표이고, 최종 상담과 지원 전략 판단은 카운슬러의 몫이에요.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>학생 학업 프로필 기준값</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">GPA (비가중)</div>
            <div className="mt-0.5 text-sm text-navy-900">{studentGpa ?? "미입력"}</div>
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">최고 SAT</div>
            <div className="mt-0.5 text-sm text-navy-900">{bestSat ?? "미입력"}</div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>컬리지 리스트별 Positioning</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {rows.length === 0 && (
            <p className="text-sm text-navy-400">
              아직 컬리지 리스트가 없어요.{" "}
              <Link href={`/students/${id}/college-list`} className="font-medium text-gold-600 hover:text-gold-700">
                컬리지 리스트에 대학을 먼저 추가해주세요 →
              </Link>
            </p>
          )}
          {rows.map((row) => (
            <div key={row.collegeId} className="rounded-lg border border-navy-100 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-semibold text-navy-900">{row.universityName}</span>
                  <Pill tone="neutral" className="ml-2">{COLLEGE_CATEGORY_LABEL[row.category] ?? row.category}</Pill>
                </div>
                <div className="flex items-center gap-1.5">
                  <Pill tone={positioningTone(row.result.label)}>{row.result.label}</Pill>
                  <Pill tone={positioningTone(row.result.label)}>{row.result.fitLabel}</Pill>
                </div>
              </div>
              <p className="mt-2 text-xs text-navy-500">{row.result.detail}</p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
