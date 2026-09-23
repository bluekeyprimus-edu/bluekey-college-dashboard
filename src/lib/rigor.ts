import { Course, GpaByGrade, CourseLevel } from "./types";

const LEVEL_WEIGHT: Record<CourseLevel, number> = {
  Regular: 1,
  Honors: 2,
  AP: 4,
  "IB HL": 4,
  "IB SL": 3,
  "A-Level": 4,
  "Dual Enrollment": 4,
  "College Level": 4,
};

function bucketLabel(avg: number | null): string {
  if (avg === null) return "데이터 없음";
  if (avg >= 3.5) return "매우 강함";
  if (avg >= 2.5) return "강함";
  if (avg >= 1.5) return "보통";
  return "약함";
}

function avgWeight(courses: Course[]): number | null {
  if (courses.length === 0) return null;
  const sum = courses.reduce((a, c) => a + (LEVEL_WEIGHT[c.course_level] ?? 1), 0);
  return sum / courses.length;
}

export interface RigorSummary {
  overallLabel: string;
  stemLabel: string;
  humanitiesLabel: string;
  topRigorCount: number;
  totalCourses: number;
}

export function computeRigorSummary(courses: Course[]): RigorSummary {
  const stem = courses.filter((c) => c.subject_area === "STEM");
  const humanities = courses.filter((c) => c.subject_area === "Humanities");
  const topRigorCount = courses.filter((c) => (LEVEL_WEIGHT[c.course_level] ?? 1) >= 4).length;

  return {
    overallLabel: bucketLabel(avgWeight(courses)),
    stemLabel: bucketLabel(avgWeight(stem)),
    humanitiesLabel: bucketLabel(avgWeight(humanities)),
    topRigorCount,
    totalCourses: courses.length,
  };
}

export function computeGpaTrend(rows: GpaByGrade[]): string {
  const overall = rows
    .filter((r) => r.subject === "overall" && r.gpa !== null)
    .sort((a, b) => a.grade_level - b.grade_level);
  if (overall.length < 2) return "데이터 부족";
  const first = overall[0].gpa as number;
  const last = overall[overall.length - 1].gpa as number;
  if (last > first + 0.05) return "상승 추세";
  if (last < first - 0.05) return "하락 추세";
  return "안정적";
}
