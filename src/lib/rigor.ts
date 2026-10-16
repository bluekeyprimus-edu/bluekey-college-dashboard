import { Course, GpaByGrade } from "./types";

export interface CourseLevelCounts {
  ap: number;
  ibHl: number;
  ibSl: number;
  honors: number;
  totalCourses: number;
}

/**
 * Replaces the old "Course Rigor" strength buckets (매우 강함/강함/보통/약함),
 * which averaged an internal difficulty weight per course and didn't map to
 * anything a school or college actually reports. Instead we just count how
 * many AP / IB HL / IB SL / Honors courses the student has on record — an
 * objective number counselors actually use, with no scale to argue about.
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

export function computeGpaTrend(rows: GpaByGrade[]): string {
  const overall = rows
    .filter((r) => r.subject === "overall" && r.gpa !== null)
    .sort((a, b) => a.grade_level - b.grade_level || (a.semester ?? 1) - (b.semester ?? 1));
  if (overall.length < 2) return "데이터 부족";
  const first = overall[0].gpa as number;
  const last = overall[overall.length - 1].gpa as number;
  if (last > first + 0.05) return "상승 추세";
  if (last < first - 0.05) return "하락 추세";
  return "안정적";
}
