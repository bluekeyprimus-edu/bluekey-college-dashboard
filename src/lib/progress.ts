import { StudentProgress, TrackStatus, TaskItem, CollegeListEntry, ApplicationChecklist } from "./types";

export function overallProgress(p: StudentProgress): number {
  const values = [
    p.academic_profile,
    p.testing,
    p.extracurricular_activities,
    p.awards,
    p.college_list,
    p.common_application,
    p.personal_statement,
    p.supplemental_essays,
    p.recommendation_letters,
    p.school_documents,
    p.financial_aid,
  ];
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function trackStatusFromDeadline(days: number | null): TrackStatus {
  if (days === null) return "green";
  if (days < 14) return "red";
  if (days < 45) return "yellow";
  return "green";
}

export function trackStatusFromProgress(progress: number, days: number | null): TrackStatus {
  const deadlineStatus = trackStatusFromDeadline(days);
  if (deadlineStatus === "red") return "red";
  if (progress < 40) return "yellow";
  if (deadlineStatus === "yellow" && progress < 70) return "yellow";
  return "green";
}

export function nextDeadline(colleges: CollegeListEntry[]): { name: string; date: string; days: number } | null {
  const withDeadlines = colleges
    .filter((c) => c.application_deadline)
    .map((c) => ({ name: c.university_name, date: c.application_deadline as string, days: daysUntil(c.application_deadline)! }))
    .filter((c) => c.days >= 0)
    .sort((a, b) => a.days - b.days);
  return withDeadlines[0] ?? null;
}

export function pendingTaskCount(tasks: TaskItem[]): number {
  return tasks.filter((t) => t.status !== "Completed").length;
}

export function checklistCompletion(checklist: ApplicationChecklist | undefined): number {
  if (!checklist) return 0;
  const keys: (keyof ApplicationChecklist)[] = [
    "college_added",
    "major_selected",
    "common_app_profile",
    "activities",
    "honors",
    "personal_statement",
    "supplemental_essays",
    "counselor_recommendation",
    "teacher_recommendation_1",
    "teacher_recommendation_2",
    "transcript",
    "test_scores_submission",
    "financial_aid",
    "application_submitted",
  ];
  const done = keys.filter((k) => checklist[k]).length;
  return Math.round((done / keys.length) * 100);
}
