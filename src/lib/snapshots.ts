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

const EMPTY_CATEGORY_COUNTS: Record<CollegeCategory, number> = { Reach: 0, "High Target": 0, Target: 0, Likely: 0, Safety: 0 };

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
  notStarted: number;
  inProgress: number;
  readyToSubmit: number;
  submitted: number;
  earlyRoundSchools: { universityName: string; round: string; checklistPct: number }[];
}

// "Ready to Submit" isn't a stored status — it's derived: an application
// still marked "In Progress" whose checklist is already 100% complete.
// Everything from "Submitted" onward (Accepted/Waitlisted/Deferred/
// Rejected) counts as the one "submitted" bucket here; the student's own
// page still shows the exact outcome.
export function computeApplicationStatusSnapshot(colleges: CollegeListEntry[]): ApplicationStatusSnapshot {
  let notStarted = 0;
  let inProgress = 0;
  let readyToSubmit = 0;
  let submitted = 0;
  for (const c of colleges) {
    if (c.application_status === "Not Started") {
      notStarted += 1;
    } else if (c.application_status === "In Progress") {
      if (checklistCompletion(c.checklist) >= 100) readyToSubmit += 1;
      else inProgress += 1;
    } else {
      submitted += 1;
    }
  }
  const earlyRoundSchools = colleges
    .filter((c) => c.application_round === "ED" || c.application_round === "ED2" || c.application_round === "REA" || c.application_round === "EA")
    .map((c) => ({ universityName: c.university_name, round: c.application_round as string, checklistPct: checklistCompletion(c.checklist) }));
  return { notStarted, inProgress, readyToSubmit, submitted, earlyRoundSchools };
}
