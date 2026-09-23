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
} from "@/lib/data";
import { overallProgress } from "@/lib/progress";
import { PROGRESS_CATEGORY_LABELS, StudentProgress } from "@/lib/types";
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

  const [progress, academic, sat, ecs, awards, colleges, tasks] = await Promise.all([
    getProgress(id),
    getAcademicOverview(id),
    getSatScores(id),
    getExtracurriculars(id),
    getAwards(id),
    getCollegeList(id),
    getTasks(id),
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
      <div className="flex items-start justify-between">
        <div>
          <Link href="/students" className="text-xs font-medium text-navy-400 hover:text-navy-600">← All Students</Link>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-navy-900">
            {student.english_name ?? student.student_name}
          </h1>
          <p className="text-sm text-navy-500">
            {student.student_name !== student.english_name && `${student.student_name} · `}
            {student.high_school} · Class of {student.graduation_year}
          </p>
        </div>
        <Pill tone="gold">Counselor: {student.counselor_name ?? "Unassigned"}</Pill>
      </div>

      {/* Overall progress */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-navy-400">Overall Application Progress</div>
              <div className="font-serif text-4xl font-semibold text-navy-900">{overall}%</div>
            </div>
            <div className="w-1/2">
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
          <CardHeader><CardTitle>Student Profile</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <ProfileField label="Student Name" value={student.student_name} />
            <ProfileField label="English Name" value={student.english_name} />
            <ProfileField label="Current Grade" value={`Grade ${student.current_grade}`} />
            <ProfileField label="Graduation Year" value={`Class of ${student.graduation_year}`} />
            <ProfileField label="High School" value={student.high_school} />
            <ProfileField label="School Country / Location" value={student.school_country} />
            <ProfileField label="School Type" value={student.school_type} />
            <ProfileField label="Curriculum" value={student.curriculum} />
            <ProfileField label="Citizenship" value={student.citizenship} />
            <ProfileField label="U.S. Permanent Resident" value={student.us_permanent_resident ? "Yes" : "No"} />
            <ProfileField label="Intended Major" value={student.intended_major} />
            <ProfileField label="Secondary Major Interest" value={student.secondary_major_interest} />
            <ProfileField label="Career Interest" value={student.career_interest} />
            <ProfileField label="Assigned Counselor" value={student.counselor_name} />
          </CardBody>
        </Card>

        {/* Quick stats */}
        <Card>
          <CardHeader><CardTitle>Academic & Testing Snapshot</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <ProfileField label="Unweighted GPA" value={academic?.unweighted_gpa ?? "—"} />
            <ProfileField label="Weighted GPA" value={academic?.weighted_gpa ?? "—"} />
            <ProfileField
              label="Class Rank"
              value={academic?.school_does_not_rank ? "School does not rank" : academic?.class_rank ? `${academic.class_rank} / ${academic.class_size}` : "—"}
            />
            <ProfileField label="Best SAT (Superscore)" value={bestSat} />
            <div className="pt-2">
              <Link href="/academics" className="text-xs font-medium text-gold-600 hover:text-gold-700">
                View full academic profile →
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Extracurriculars</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {ecs.length === 0 && <p className="text-sm text-navy-400">No activities recorded yet.</p>}
            {ecs.map((e) => (
              <div key={e.id} className="border-b border-navy-100 pb-2 last:border-0 last:pb-0">
                <div className="text-sm font-medium text-navy-900">{e.activity_name}</div>
                <div className="text-xs text-navy-400">{e.position_role} · {e.status}</div>
              </div>
            ))}
            <Link href="/activities" className="text-xs font-medium text-gold-600 hover:text-gold-700">Manage activities →</Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Awards & Honors</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {awards.length === 0 && <p className="text-sm text-navy-400">No awards recorded yet.</p>}
            {awards.map((a) => (
              <div key={a.id} className="border-b border-navy-100 pb-2 last:border-0 last:pb-0">
                <div className="text-sm font-medium text-navy-900">{a.award_name}</div>
                <div className="text-xs text-navy-400">{a.award_level} · {a.placement}</div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Open Tasks</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {tasks.length === 0 && <p className="text-sm text-navy-400">No tasks yet.</p>}
            {tasks.map((t) => (
              <div key={t.id} className="border-b border-navy-100 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-navy-900">{t.task}</span>
                  <Pill tone={t.priority === "High" ? "red" : t.priority === "Medium" ? "amber" : "neutral"}>{t.priority}</Pill>
                </div>
                <div className="text-xs text-navy-400">{t.status} {t.deadline && `· due ${t.deadline}`}</div>
              </div>
            ))}
            <Link href="/tasks" className="text-xs font-medium text-gold-600 hover:text-gold-700">View all tasks →</Link>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>College List</CardTitle>
          <Link href="/college-list" className="text-xs font-medium text-gold-600 hover:text-gold-700">Manage college list →</Link>
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
                      <div className="text-xs text-navy-400">{c.application_round ?? "Round TBD"}</div>
                    </div>
                  ))}
                  {(categoriesByCollege[cat] ?? []).length === 0 && (
                    <div className="rounded-lg border border-dashed border-navy-200 px-3 py-2 text-xs text-navy-300">Empty</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
