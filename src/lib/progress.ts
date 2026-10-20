import { StudentProgress, TrackStatus, TaskItem, CollegeListEntry, ApplicationChecklist } from "./types";

type ProgressCategory = keyof Omit<StudentProgress, "student_id">;

// Grade-band weights over the same 10 progress categories every grade
// already tracks. A flat average treats "교내 활동" the same for a 9th
// grader and a 12th grader applying this fall, which is backwards — what
// should actually move the needle changes by grade band (see Jacob's
// Dashboard spec, section 10). This is the one place to retune the
// weights; every row sums to 1.0.
//
// Grade 8-9: academic record, course selection, EC exploration, summer
// planning — application-specific categories barely count yet.
// Grade 10: GPA/rigor, EC development, awards, SAT prep.
// Grade 11: GPA, SAT/ACT, EC strength, college research, initial list.
// Grade 12: college list, ED/EA strategy, Common App, essays,
// recommendations, submission — this is the one grade where application
// categories dominate.
const PROGRESS_WEIGHTS_BY_GRADE_BAND: Record<"8-9" | "10" | "11" | "12", Record<ProgressCategory, number>> = {
  "8-9": {
    academic_profile: 0.3,
    testing: 0.1,
    extracurricular_activities: 0.25,
    awards: 0.15,
    college_list: 0.05,
    common_application: 0.05,
    personal_statement: 0.05,
    supplemental_essays: 0,
    recommendation_letters: 0,
    school_documents: 0.05,
  },
  "10": {
    academic_profile: 0.25,
    testing: 0.2,
    extracurricular_activities: 0.2,
    awards: 0.15,
    college_list: 0.05,
    common_application: 0.05,
    personal_statement: 0.05,
    supplemental_essays: 0,
    recommendation_letters: 0,
    school_documents: 0.05,
  },
  "11": {
    academic_profile: 0.2,
    testing: 0.2,
    extracurricular_activities: 0.15,
    awards: 0.1,
    college_list: 0.15,
    common_application: 0.05,
    personal_statement: 0.05,
    supplemental_essays: 0,
    recommendation_letters: 0.05,
    school_documents: 0.05,
  },
  "12": {
    academic_profile: 0.05,
    testing: 0.05,
    extracurricular_activities: 0.05,
    awards: 0.05,
    college_list: 0.15,
    common_application: 0.15,
    personal_statement: 0.15,
    supplemental_essays: 0.15,
    recommendation_letters: 0.1,
    school_documents: 0.1,
  },
};

function gradeBandFor(grade: number): "8-9" | "10" | "11" | "12" {
  if (grade <= 9) return "8-9";
  if (grade === 10) return "10";
  if (grade === 11) return "11";
  return "12";
}

/** Overall progress %, weighted by the student's current grade band so a
 * 9th grader and a 12th grader aren't scored on the same mix of
 * categories. Falls back to an even weight for an out-of-range grade. */
export function overallProgress(p: StudentProgress, grade: number): number {
  const weights = PROGRESS_WEIGHTS_BY_GRADE_BAND[gradeBandFor(grade)];
  let sum = 0;
  let weightTotal = 0;
  for (const key of Object.keys(weights) as ProgressCategory[]) {
    const w = weights[key];
    sum += p[key] * w;
    weightTotal += w;
  }
  return weightTotal > 0 ? Math.round(sum / weightTotal) : 0;
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
  // Where clicking this flag should take you — the page that actually
  // lets you act on it, not just the student's overview.
  href?: string;
}

/** Plain-language reasons a student needs a counselor's attention right
 * now, derived from data already on the roster row — not a new signal,
 * just naming the ones that matter out loud so the Dashboard's Attention
 * Needed panel doesn't require reading a status dot and guessing why. */
export function computeAttentionFlags(input: {
  studentId: string;
  nextDeadlineDays: number | null;
  progress: number;
  pendingTasks: number;
  overdueTasks: number;
}): AttentionFlag[] {
  const flags: AttentionFlag[] = [];
  // nextDeadlineDays comes from the student's college list (see
  // nextDeadline() below) — that's where the deadline actually lives.
  const collegeListHref = `/students/${input.studentId}/college-list`;
  const tasksHref = `/tasks?student=${input.studentId}`;
  if (input.nextDeadlineDays !== null && input.nextDeadlineDays < 14) {
    flags.push({ severity: "red", label: `마감 ${input.nextDeadlineDays}일 전`, href: collegeListHref });
  } else if (input.nextDeadlineDays !== null && input.nextDeadlineDays < 45) {
    flags.push({ severity: "yellow", label: `마감 ${input.nextDeadlineDays}일 전`, href: collegeListHref });
  }
  if (input.overdueTasks > 0) {
    flags.push({ severity: "red", label: `지연된 할일 ${input.overdueTasks}건`, href: tasksHref });
  }
  if (input.progress < 40) {
    flags.push({ severity: "yellow", label: `전체 진행률 ${input.progress}%`, href: `/students/${input.studentId}` });
  }
  if (input.pendingTasks >= 3) {
    flags.push({ severity: "yellow", label: `미완료 할일 ${input.pendingTasks}건`, href: tasksHref });
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
