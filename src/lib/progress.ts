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

// ============================================================
// Dashboard: Attention Needed + Upcoming Deadlines
// ============================================================

export interface AttentionFlag {
  severity: "red" | "yellow";
  label: string;
}

/** Plain-language reasons a student needs a counselor's attention right
 * now, derived from data already on the roster row — not a new signal,
 * just naming the ones that matter out loud so the Dashboard's Attention
 * Needed panel doesn't require reading a status dot and guessing why. */
export function computeAttentionFlags(input: {
  nextDeadlineDays: number | null;
  progress: number;
  pendingTasks: number;
  overdueTasks: number;
}): AttentionFlag[] {
  const flags: AttentionFlag[] = [];
  if (input.nextDeadlineDays !== null && input.nextDeadlineDays < 14) {
    flags.push({ severity: "red", label: `마감 ${input.nextDeadlineDays}일 전` });
  } else if (input.nextDeadlineDays !== null && input.nextDeadlineDays < 45) {
    flags.push({ severity: "yellow", label: `마감 ${input.nextDeadlineDays}일 전` });
  }
  if (input.overdueTasks > 0) {
    flags.push({ severity: "red", label: `지연된 할일 ${input.overdueTasks}건` });
  }
  if (input.progress < 40) {
    flags.push({ severity: "yellow", label: `전체 진행률 ${input.progress}%` });
  }
  if (input.pendingTasks >= 3) {
    flags.push({ severity: "yellow", label: `미완료 할일 ${input.pendingTasks}건` });
  }
  return flags;
}

export function overdueTaskCount(tasks: TaskItem[]): number {
  return tasks.filter((t) => t.status !== "Completed" && t.deadline !== null && (daysUntil(t.deadline) ?? 0) < 0).length;
}

export interface DeadlineItem {
  studentId: string;
  studentName: string;
  type: "college" | "task";
  label: string;
  date: string;
  days: number;
}

/** Every upcoming (today-or-later) deadline for one student — application
 * deadlines from their college list, plus deadlines on their open tasks —
 * flattened across the whole roster for the Dashboard's Upcoming
 * Deadlines panel. Past-due items are left out here; overdueTaskCount
 * above is what surfaces those, as a problem rather than a countdown. */
export function collectDeadlineItems(
  studentId: string,
  studentName: string,
  colleges: CollegeListEntry[],
  tasks: TaskItem[]
): DeadlineItem[] {
  const items: DeadlineItem[] = [];
  for (const c of colleges) {
    if (!c.application_deadline) continue;
    const days = daysUntil(c.application_deadline);
    if (days === null || days < 0) continue;
    items.push({ studentId, studentName, type: "college", label: c.university_name, date: c.application_deadline, days });
  }
  for (const t of tasks) {
    if (t.status === "Completed" || !t.deadline) continue;
    const days = daysUntil(t.deadline);
    if (days === null || days < 0) continue;
    items.push({ studentId, studentName, type: "task", label: t.task, date: t.deadline, days });
  }
  return items;
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
