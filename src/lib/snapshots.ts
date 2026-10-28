// Per-student "snapshot" aggregates for the Counselor Dashboard's
// drill-down (My Students table → expand a row). Deliberately summary-
// only — full course/EC/college detail stays on the student's own page;
// these just answer "is there a problem here" without leaving the
// Dashboard.
import { CollegeListEntry, CollegeCategory, Course, Extracurricular, GradeRecord, Term } from "./types";
import { computeCourseLevelCounts, computeCumulativeGpa, computeGpaTrendFromGrades, isLowGrade, CourseLevelCounts } from "./gpa";
import { checklistCompletion } from "./progress";

export interface AcademicSnapshot {
  unweightedGpa: number | null;
  weightedGpa: number | null;
  trend: string;
  rigor: CourseLevelCounts;
  advancedCourseCount: number; // AP + IB HL + IB SL + Honors
  lowGradeCount: number; // courses flagged isLowGrade, across every term on record
}

export function computeAcademicSnapshot(gradeRecords: GradeRecord[], terms: Term[], courses: Course[]): AcademicSnapshot {
  const cumulative = computeCumulativeGpa(gradeRecords, terms, courses);
  const rigor = computeCourseLevelCounts(courses);
  return {
    unweightedGpa: cumulative.unweighted,
    weightedGpa: cumulative.weighted,
    trend: computeGpaTrendFromGrades(gradeRecords, terms, courses),
    rigor,
    advancedCourseCount: rigor.ap + rigor.ibHl + rigor.ibSl + rigor.honors,
    lowGradeCount: courses.filter(isLowGrade).length,
  };
}

export interface EcSnapshot {
  totalActivities: number;
  majorRelatedCount: number;
  commonAppReadyCount: number;
}

export function computeEcSnapshot(ecs: Extracurricular[]): EcSnapshot {
  return {
    totalActivities: ecs.length,
    majorRelatedCount: ecs.filter((e) => !!e.major_relevance && e.major_relevance.trim().length > 0).length,
    commonAppReadyCount: ecs.filter((e) => e.status === "Common App Ready").length,
  };
}

export interface CollegeListSnapshot {
  counts: Record<CollegeCategory, number>;
  total: number;
  alerts: string[];
}

const EMPTY_CATEGORY_COUNTS: Record<CollegeCategory, number> = { Reach: 0, Target: 0, Safety: 0 };

export function computeCollegeListSnapshot(colleges: CollegeListEntry[], grade: number): CollegeListSnapshot {
  const counts = { ...EMPTY_CATEGORY_COUNTS };
  for (const c of colleges) counts[c.category] += 1;
  const total = colleges.length;

  const alerts: string[] = [];
  if (total > 0 && counts.Safety === 0) alerts.push("세이프티 스쿨 없음");
  if (total > 0 && counts.Reach / total > 0.5) alerts.push("리치 스쿨 비중 과다");
  if (grade === 12 && total > 0) {
    const hasEarlyRound = colleges.some(
      (c) => c.application_round === "ED" || c.application_round === "ED2" || c.application_round === "REA" || c.application_round === "EA"
    );
    if (!hasEarlyRound) alerts.push("ED/EA 미선택");
  }
  return { counts, total, alerts };
}

export interface ApplicationStatusSnapshot {
  inProgress: number;
  completed: number;
  earlyRoundSchools: { universityName: string; round: string; checklistPct: number }[];
}

// Deliberately just two buckets on the Dashboard (see Jacob's request) —
// this is a glance-at-it summary, not the real record. The underlying
// application_status still has the full Not Started/In Progress/
// Submitted/Accepted/Waitlisted/Deferred/Rejected range on the student's
// own college-list page; "완료" here just means "Submitted" or anything
// that came after it.
const COMPLETED_APPLICATION_STATUSES = new Set(["Submitted", "Accepted", "Waitlisted", "Deferred", "Rejected"]);

export function computeApplicationStatusSnapshot(colleges: CollegeListEntry[]): ApplicationStatusSnapshot {
  let inProgress = 0;
  let completed = 0;
  for (const c of colleges) {
    if (COMPLETED_APPLICATION_STATUSES.has(c.application_status)) completed += 1;
    else inProgress += 1;
  }
  const earlyRoundSchools = colleges
    .filter((c) => c.application_round === "ED" || c.application_round === "ED2" || c.application_round === "REA" || c.application_round === "EA")
    .map((c) => ({ universityName: c.university_name, round: c.application_round as string, checklistPct: checklistCompletion(c.checklist) }));
  return { inProgress, completed, earlyRoundSchools };
}
