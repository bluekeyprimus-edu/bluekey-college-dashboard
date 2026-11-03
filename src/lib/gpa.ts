import { Course, CourseLevel, GradeRecord, Term } from "./types";

export interface CourseLevelCounts {
  ap: number;
  ibHl: number;
  ibSl: number;
  honors: number;
  totalCourses: number;
}

/**
 * Counts how many AP / IB HL / IB SL / Honors courses the student has on
 * record — an objective number counselors and parents actually use, with
 * no scale to argue about (replaces the old "Course Rigor" strength
 * buckets, which averaged an internal difficulty weight that didn't map to
 * anything a school or college reports).
 */
export function computeCourseLevelCounts(courses: Course[]): CourseLevelCounts {
  return {
    ap: courses.filter((c) => c.course_level === "AP").length,
    ibHl: courses.filter((c) => c.course_level === "IB HL").length,
    ibSl: courses.filter((c) => c.course_level === "IB SL").length,
    honors: courses.filter((c) => c.course_level === "Honors").length,
    totalCourses: courses.length,
  };
}

/** course_level is optional (a course can be registered before its level
 * is decided) — treat an unset level like "Other" for the weighting below. */
function effectiveCourseLevel(course: Course): CourseLevel {
  return course.course_level ?? "Other";
}

// ============================================================
// GPA calculation
//
// GPA is never typed in as a bare number — it is computed from each
// course's grade + credit, rolled up Term -> Grade -> Cumulative. Every
// level has a manual override that wins when set, because schools
// weight/scale GPA differently and a computed number can disagree with
// the school's own official transcript. The constants below are meant to
// be the one place to adjust if a particular school's formula differs.
// ============================================================

// Unweighted (4.0-scale) grade points for a Letter Grade. P/CR/NC are
// excluded from GPA math entirely (shown as-is, never counted).
const LETTER_GRADE_POINTS: Record<string, number | null> = {
  "A+": 4.0, A: 4.0, "A-": 3.7,
  "B+": 3.3, B: 3.0, "B-": 2.7,
  "C+": 2.3, C: 2.0, "C-": 1.7,
  "D+": 1.3, D: 1.0, "D-": 0.7,
  F: 0.0,
  P: null, CR: null, NC: null,
};

// Standard 100-point -> 4.0-scale conversion table.
function pointScoreToGradePoints(score: number): number {
  if (score >= 93) return 4.0;
  if (score >= 90) return 3.7;
  if (score >= 87) return 3.3;
  if (score >= 83) return 3.0;
  if (score >= 80) return 2.7;
  if (score >= 77) return 2.3;
  if (score >= 73) return 2.0;
  if (score >= 70) return 1.7;
  if (score >= 67) return 1.3;
  if (score >= 63) return 1.0;
  if (score >= 60) return 0.7;
  return 0.0;
}

// How much a course level adds on top of the unweighted points above when
// computing Weighted GPA (AP/IB HL/college-level = full extra point;
// honors-tier = half point; Regular/Other = none).
const WEIGHT_BUMP: Record<CourseLevel, number> = {
  Regular: 0,
  Honors: 0.5,
  Advanced: 0.5,
  AP: 1.0,
  "IB SL": 0.5,
  "IB HL": 1.0,
  "A-Level": 1.0,
  "Dual Enrollment": 1.0,
  "College Level": 1.0,
  Other: 0,
};

/** Base (unweighted) grade points for one course, or null if it is
 * excluded from GPA math (custom grade, or a letter grade like P/CR/NC). */
export function courseBasePoints(course: Course): number | null {
  if (course.grade_scale === "letter") {
    if (!course.letter_grade) return null;
    return LETTER_GRADE_POINTS[course.letter_grade] ?? null;
  }
  if (course.grade_scale === "100_point") {
    if (course.point_score === null) return null;
    return pointScoreToGradePoints(course.point_score);
  }
  return null; // custom grades never feed into GPA
}

// B+ and below, as a flat warning threshold — not tied to the weighted
// bump table above, which is about rigor, not risk.
const LOW_LETTER_GRADES = new Set(["B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"]);
const LOW_POINT_SCORE_CEILING = 90; // A- starts at 90; "B+ and below" means under that

/** True when a course's grade is B+ or below (A-/A/A+ are fine) — used to
 * flag a course in red as a warning, since this is a risk signal, not a
 * GPA input. Custom grades have no comparable scale, so never flagged. */
export function isLowGrade(course: Course): boolean {
  if (course.grade_scale === "letter") {
    return course.letter_grade !== null && LOW_LETTER_GRADES.has(course.letter_grade);
  }
  if (course.grade_scale === "100_point") {
    return course.point_score !== null && course.point_score < LOW_POINT_SCORE_CEILING;
  }
  return false;
}

export interface ComputedGpa {
  unweighted: number | null;
  weighted: number | null;
  totalCredits: number;
  totalCourses: number;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Credit-weighted average GPA across a flat list of courses. */
export function computeGpaFromCourses(courses: Course[]): ComputedGpa {
  let creditSum = 0;
  let unweightedSum = 0;
  let weightedSum = 0;
  for (const c of courses) {
    const base = courseBasePoints(c);
    if (base === null) continue;
    const credit = c.credit || 1;
    creditSum += credit;
    unweightedSum += base * credit;
    weightedSum += (base + WEIGHT_BUMP[effectiveCourseLevel(c)]) * credit;
  }
  return {
    unweighted: creditSum > 0 ? round3(unweightedSum / creditSum) : null,
    weighted: creditSum > 0 ? round3(weightedSum / creditSum) : null,
    totalCredits: creditSum,
    totalCourses: courses.length,
  };
}

export interface EffectiveGpa {
  unweighted: number | null;
  weighted: number | null;
  totalCredits: number;
  totalCourses: number;
  isOverridden: boolean;
}

/** A term's displayed GPA: its manual override if set, else computed from
 * its own courses. */
export function computeTermGpa(term: Term, courses: Course[]): EffectiveGpa {
  const termCourses = courses.filter((c) => c.term_id === term.id);
  const computed = computeGpaFromCourses(termCourses);
  const isOverridden = term.manual_unweighted_gpa !== null || term.manual_weighted_gpa !== null;
  return {
    unweighted: term.manual_unweighted_gpa ?? computed.unweighted,
    weighted: term.manual_weighted_gpa ?? computed.weighted,
    totalCredits: computed.totalCredits,
    totalCourses: computed.totalCourses,
    isOverridden,
  };
}

/** A grade's displayed GPA: its manual override if set, else a
 * credit-weighted roll-up of its terms' *effective* GPA (so overriding one
 * term also moves the grade's computed default). */
export function computeGradeGpa(gradeRecord: GradeRecord, terms: Term[], courses: Course[]): EffectiveGpa {
  const gradeTerms = terms.filter((t) => t.grade_record_id === gradeRecord.id);
  let creditSum = 0;
  let unweightedSum = 0;
  let weightedSum = 0;
  let totalCourses = 0;
  for (const t of gradeTerms) {
    const eff = computeTermGpa(t, courses);
    totalCourses += eff.totalCourses;
    if (eff.totalCredits === 0) continue;
    creditSum += eff.totalCredits;
    if (eff.unweighted !== null) unweightedSum += eff.unweighted * eff.totalCredits;
    if (eff.weighted !== null) weightedSum += eff.weighted * eff.totalCredits;
  }
  const computedUnweighted = creditSum > 0 ? round3(unweightedSum / creditSum) : null;
  const computedWeighted = creditSum > 0 ? round3(weightedSum / creditSum) : null;
  const isOverridden = gradeRecord.manual_unweighted_gpa !== null || gradeRecord.manual_weighted_gpa !== null;
  return {
    unweighted: gradeRecord.manual_unweighted_gpa ?? computedUnweighted,
    weighted: gradeRecord.manual_weighted_gpa ?? computedWeighted,
    totalCredits: creditSum,
    totalCourses,
    isOverridden,
  };
}

/** Cumulative GPA across every grade on record, credit-weighted. `override`
 * is academic_overview.unweighted_gpa/weighted_gpa, which wins when set. */
export function computeCumulativeGpa(
  gradeRecords: GradeRecord[],
  terms: Term[],
  courses: Course[],
  override?: { unweighted: number | null; weighted: number | null }
): EffectiveGpa {
  let creditSum = 0;
  let unweightedSum = 0;
  let weightedSum = 0;
  let totalCourses = 0;
  for (const g of gradeRecords) {
    const eff = computeGradeGpa(g, terms, courses);
    totalCourses += eff.totalCourses;
    if (eff.totalCredits === 0) continue;
    creditSum += eff.totalCredits;
    if (eff.unweighted !== null) unweightedSum += eff.unweighted * eff.totalCredits;
    if (eff.weighted !== null) weightedSum += eff.weighted * eff.totalCredits;
  }
  const computedUnweighted = creditSum > 0 ? round3(unweightedSum / creditSum) : null;
  const computedWeighted = creditSum > 0 ? round3(weightedSum / creditSum) : null;
  const manualUnweighted = override?.unweighted ?? null;
  const manualWeighted = override?.weighted ?? null;
  return {
    unweighted: manualUnweighted ?? computedUnweighted,
    weighted: manualWeighted ?? computedWeighted,
    totalCredits: creditSum,
    totalCourses,
    isOverridden: manualUnweighted !== null || manualWeighted !== null,
  };
}

/** "상승 추세" / "하락 추세" / "안정적" across grade levels 9→12, using each
 * grade's effective (override-aware) unweighted GPA. */
export function computeGpaTrendFromGrades(gradeRecords: GradeRecord[], terms: Term[], courses: Course[]): string {
  const sorted = [...gradeRecords].sort((a, b) => a.grade_level - b.grade_level);
  const values = sorted
    .map((g) => computeGradeGpa(g, terms, courses).unweighted)
    .filter((v): v is number => v !== null);
  if (values.length < 2) return "데이터 부족";
  const first = values[0];
  const last = values[values.length - 1];
  if (last > first + 0.05) return "상승 추세";
  if (last < first - 0.05) return "하락 추세";
  return "안정적";
}

// ============================================================
// Final GPA — strictly from each course's Final Grade, completely
// separate from the Progress/Current GPA above. A course with no Final
// Grade yet is excluded from the math (never falls back to its Progress
// grade), and the result's `status` tells the UI whether to show real
// numbers, "Pending", or a "Partial" count — never present a Final GPA
// as settled when some courses in scope still aren't confirmed.
// ============================================================

/** True once a course's Final Grade has been entered (whatever the grade
 * scale — including a "custom" grade like Pass, which still counts as
 * confirmed even though it doesn't feed the GPA number itself). */
export function courseHasFinalGrade(course: Course): boolean {
  if (course.grade_scale === "letter") return course.final_letter_grade !== null;
  if (course.grade_scale === "100_point") return course.final_point_score !== null;
  return course.final_custom_grade !== null;
}

/** Final-grade counterpart to courseBasePoints — null if no Final Grade is
 * set yet, or if it's a "custom" grade excluded from GPA math. */
export function courseFinalPoints(course: Course): number | null {
  if (course.grade_scale === "letter") {
    if (!course.final_letter_grade) return null;
    return LETTER_GRADE_POINTS[course.final_letter_grade] ?? null;
  }
  if (course.grade_scale === "100_point") {
    if (course.final_point_score === null) return null;
    return pointScoreToGradePoints(course.final_point_score);
  }
  return null;
}

/** Same "B+ and below" warning signal as isLowGrade, but for the Final
 * Grade — used once a course is confirmed so a counselor can still spot a
 * low official grade even after the Progress-grade warning is gone. */
export function isLowFinalGrade(course: Course): boolean {
  if (course.grade_scale === "letter") {
    return course.final_letter_grade !== null && LOW_LETTER_GRADES.has(course.final_letter_grade);
  }
  if (course.grade_scale === "100_point") {
    return course.final_point_score !== null && course.final_point_score < LOW_POINT_SCORE_CEILING;
  }
  return false;
}

export interface FinalGpaResult {
  unweighted: number | null;
  weighted: number | null;
  totalCredits: number;
  totalCourses: number; // every course in scope, confirmed or not
  confirmedCount: number; // courses with a Final Grade set
  status: "no_courses" | "pending" | "partial" | "complete";
}

function finalStatus(confirmedCount: number, totalCourses: number): FinalGpaResult["status"] {
  if (totalCourses === 0) return "no_courses";
  if (confirmedCount === 0) return "pending";
  if (confirmedCount === totalCourses) return "complete";
  return "partial";
}

/** Credit-weighted Final GPA across a flat list of courses — only courses
 * with courseHasFinalGrade(c) contribute credits/points. */
export function computeFinalGpaFromCourses(courses: Course[]): FinalGpaResult {
  let creditSum = 0;
  let unweightedSum = 0;
  let weightedSum = 0;
  let confirmedCount = 0;
  for (const c of courses) {
    if (!courseHasFinalGrade(c)) continue;
    confirmedCount += 1;
    const base = courseFinalPoints(c);
    if (base === null) continue; // confirmed but a custom grade — not GPA math
    const credit = c.credit || 1;
    creditSum += credit;
    unweightedSum += base * credit;
    weightedSum += (base + WEIGHT_BUMP[effectiveCourseLevel(c)]) * credit;
  }
  return {
    unweighted: creditSum > 0 ? round3(unweightedSum / creditSum) : null,
    weighted: creditSum > 0 ? round3(weightedSum / creditSum) : null,
    totalCredits: creditSum,
    totalCourses: courses.length,
    confirmedCount,
    status: finalStatus(confirmedCount, courses.length),
  };
}

/** A term's Final GPA — no manual override (that escape hatch stays on
 * the Progress/Current GPA only; see computeTermGpa). */
export function computeTermFinalGpa(term: Term, courses: Course[]): FinalGpaResult {
  return computeFinalGpaFromCourses(courses.filter((c) => c.term_id === term.id));
}

/** A grade (year)'s Final GPA — credit-weighted roll-up of its terms'
 * Final GPA, with confirmedCount/totalCourses summed across terms so the
 * "X/Y confirmed" indicator stays accurate at every level. */
export function computeGradeFinalGpa(gradeRecord: GradeRecord, terms: Term[], courses: Course[]): FinalGpaResult {
  const gradeTerms = terms.filter((t) => t.grade_record_id === gradeRecord.id);
  let creditSum = 0;
  let unweightedSum = 0;
  let weightedSum = 0;
  let totalCourses = 0;
  let confirmedCount = 0;
  for (const t of gradeTerms) {
    const eff = computeTermFinalGpa(t, courses);
    totalCourses += eff.totalCourses;
    confirmedCount += eff.confirmedCount;
    if (eff.totalCredits === 0) continue;
    creditSum += eff.totalCredits;
    if (eff.unweighted !== null) unweightedSum += eff.unweighted * eff.totalCredits;
    if (eff.weighted !== null) weightedSum += eff.weighted * eff.totalCredits;
  }
  return {
    unweighted: creditSum > 0 ? round3(unweightedSum / creditSum) : null,
    weighted: creditSum > 0 ? round3(weightedSum / creditSum) : null,
    totalCredits: creditSum,
    totalCourses,
    confirmedCount,
    status: finalStatus(confirmedCount, totalCourses),
  };
}

/** Cumulative Final GPA across every grade on record. */
export function computeCumulativeFinalGpa(gradeRecords: GradeRecord[], terms: Term[], courses: Course[]): FinalGpaResult {
  let creditSum = 0;
  let unweightedSum = 0;
  let weightedSum = 0;
  let totalCourses = 0;
  let confirmedCount = 0;
  for (const g of gradeRecords) {
    const eff = computeGradeFinalGpa(g, terms, courses);
    totalCourses += eff.totalCourses;
    confirmedCount += eff.confirmedCount;
    if (eff.totalCredits === 0) continue;
    creditSum += eff.totalCredits;
    if (eff.unweighted !== null) unweightedSum += eff.unweighted * eff.totalCredits;
    if (eff.weighted !== null) weightedSum += eff.weighted * eff.totalCredits;
  }
  return {
    unweighted: creditSum > 0 ? round3(unweightedSum / creditSum) : null,
    weighted: creditSum > 0 ? round3(weightedSum / creditSum) : null,
    totalCredits: creditSum,
    totalCourses,
    confirmedCount,
    status: finalStatus(confirmedCount, totalCourses),
  };
}

export type TermStatus = "planned" | "in_progress" | "finalized";

/** Derived term status (see Term.finalized_at) — "finalized" once
 * explicitly marked so, else "in_progress" as soon as any course in the
 * term has a Progress grade recorded, else "planned" (courses registered,
 * nothing graded yet). */
export function computeTermStatus(term: Term, courses: Course[]): TermStatus {
  if (term.finalized_at) return "finalized";
  const termCourses = courses.filter((c) => c.term_id === term.id);
  const hasProgress = termCourses.some((c) => c.letter_grade !== null || c.point_score !== null || c.custom_grade !== null);
  return hasProgress ? "in_progress" : "planned";
}
