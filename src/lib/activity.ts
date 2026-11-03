import {
  Attachment,
  Award,
  ConsultationNote,
  Course,
  CourseProgressEntry,
  Extracurricular,
  PersonalStatement,
  SupplementalEssay,
  TaskItem,
} from "./types";
import { isLowGrade } from "./gpa";

export type ActivityState = "completed" | "in_progress" | "update" | "warning";

export interface ActivityItem {
  id: string;
  at: string; // ISO timestamp
  category: string;
  title: string;
  state: ActivityState;
}

const COMPLETED_EC_STATUSES = new Set(["Completed", "Common App Ready"]);

/**
 * Builds a recency-sorted activity feed for the parent portal from data
 * that's already fetched elsewhere on the page — no extra queries needed.
 * Only items with a usable timestamp are included (mock data without
 * created_at/updated_at is simply skipped, which is fine since this feed
 * is a "what's new" convenience, not a record of truth).
 */
export function buildActivityFeed(input: {
  tasks: TaskItem[];
  extracurriculars: Extracurricular[];
  awards: Award[];
  // Deliberately no `colleges` here (see Jacob's request) — college-list
  // changes don't surface in this parent-facing feed, so a counselor
  // reshuffling the list or updating a deadline doesn't read to a parent
  // as "progress" the way finishing an essay or a task does.
  personalStatement: PersonalStatement | null;
  essays: SupplementalEssay[];
  consultationNotes: ConsultationNote[];
  attachments: Attachment[];
  // Current courses + their Progress Grade history, used only to flag a
  // low (B+ and below) Progress grade in red — every other academic
  // change (Course added, Final Grade set, Term finalized, ...) stays out
  // of this feed on purpose, same as colleges above.
  courses: Course[];
  courseProgressEntries: CourseProgressEntry[];
}): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const t of input.tasks) {
    if (!t.updated_at) continue;
    items.push({
      id: `task-${t.id}`,
      at: t.updated_at,
      category: "할 일",
      title: t.task,
      state: t.status === "Completed" ? "completed" : "in_progress",
    });
  }

  for (const e of input.extracurriculars) {
    if (!e.updated_at) continue;
    items.push({
      id: `ec-${e.id}`,
      at: e.updated_at,
      category: "과외활동",
      title: e.activity_name,
      state: COMPLETED_EC_STATUSES.has(e.status) ? "completed" : "in_progress",
    });
  }

  for (const a of input.awards) {
    if (!a.created_at) continue;
    items.push({
      id: `award-${a.id}`,
      at: a.created_at,
      category: "수상",
      title: `${a.award_name} 등록됨`,
      state: "completed",
    });
  }

  if (input.personalStatement?.last_updated) {
    items.push({
      id: "personal-statement",
      at: input.personalStatement.last_updated,
      category: "에세이",
      title: "자기소개서",
      state: input.personalStatement.status === "Completed" ? "completed" : "in_progress",
    });
  }

  for (const e of input.essays) {
    if (!e.last_updated) continue;
    items.push({
      id: `essay-${e.id}`,
      at: e.last_updated,
      category: "에세이",
      title: e.university_name ? `${e.university_name} 추가 에세이` : "추가 에세이",
      state: e.status === "Completed" ? "completed" : "in_progress",
    });
  }

  for (const n of input.consultationNotes) {
    if (!n.created_at) continue;
    items.push({
      id: `note-${n.id}`,
      at: n.created_at,
      category: "상담내역",
      title: `상담 기록 추가됨 (${n.meeting_date})`,
      state: "update",
    });
  }

  for (const a of input.attachments) {
    if (!a.created_at) continue;
    items.push({
      id: `attachment-${a.id}`,
      at: a.created_at,
      category: "첨부파일",
      title: `파일 첨부됨: ${a.file_name}`,
      state: "update",
    });
  }

  // Latest Progress Grade entry per course, used as this item's
  // timestamp (courses themselves don't carry an updated_at).
  const latestEntryByCourse = new Map<string, CourseProgressEntry>();
  for (const e of input.courseProgressEntries) {
    const existing = latestEntryByCourse.get(e.course_id);
    if (!existing || `${e.recorded_date}T${e.created_at}` > `${existing.recorded_date}T${existing.created_at}`) {
      latestEntryByCourse.set(e.course_id, e);
    }
  }
  for (const c of input.courses) {
    if (!isLowGrade(c)) continue;
    const latest = latestEntryByCourse.get(c.id);
    if (!latest) continue;
    const gradeText = c.grade_scale === "letter" ? c.letter_grade : c.grade_scale === "100_point" ? String(c.point_score) : null;
    items.push({
      id: `course-warning-${c.id}`,
      at: latest.created_at,
      category: "학업",
      title: gradeText ? `${c.course_name}: ${gradeText} (진행 성적 주의)` : `${c.course_name} (진행 성적 주의)`,
      state: "warning",
    });
  }

    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function relativeKorean(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}
