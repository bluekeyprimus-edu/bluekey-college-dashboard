// Core data model — mirrors supabase/schema.sql

export type Curriculum = "AP" | "IB" | "A-Level" | "Korean" | "Other";
export type CourseLevel =
  | "Regular"
  | "Honors"
  | "Advanced"
  | "AP"
  | "IB SL"
  | "IB HL"
  | "A-Level"
  | "Dual Enrollment"
  | "College Level"
  | "Other";
export type TermSystem = "2_semesters" | "3_trimesters" | "4_quarters" | "custom";
export type GradeRecordStatus = "in_progress" | "completed";
export type GradeScale = "letter" | "100_point" | "custom";
export type SubjectCategory =
  | "English"
  | "Math"
  | "Science"
  | "Social Studies"
  | "Foreign Language"
  | "Arts"
  | "Computer Science"
  | "Physical Education"
  | "Other";
export type ECStatus = "Developing" | "Completed" | "Common App Ready";
export type AdmissionResult = "Accepted" | "Waitlisted" | "Deferred" | "Rejected";
export type AwardLevel = "School" | "Regional" | "State" | "National" | "International";
export type CollegeCategory = "Reach" | "Target" | "Safety";
export type ApplicationRound = "ED" | "ED2" | "EA" | "REA" | "RD";
export type EssayStatus =
  | "Brainstorming"
  | "Topic Selected"
  | "Outline"
  | "First Draft"
  | "Revision 1"
  | "Revision 2"
  | "Final Review"
  | "Completed";
export type TaskPriority = "High" | "Medium" | "Low";
export type TaskStatus = "Not Started" | "In Progress" | "Waiting" | "Completed";

export interface Counselor {
  id: string;
  name: string;
  email: string | null;
  auth_user_id: string | null;
  is_admin: boolean;
}

export interface Student {
  id: string;
  student_name: string;
  english_name: string | null;
  current_grade: number;
  graduation_year: number;
  high_school: string;
  school_country: string;
  school_type: string | null;
  curriculum: Curriculum;
  citizenship: string | null;
  us_permanent_resident: boolean;
  intended_major: string | null;
  secondary_major_interest: string | null;
  career_interest: string | null;
  counselor_id: string | null;
  counselor_name?: string;
  // Narrower assignments alongside the general counselor — see
  // schema.sql. Either can be null (most students only have the one
  // general counselor) and either can point at the same person as
  // counselor_id or someone else.
  application_counselor_id: string | null;
  ec_counselor_id: string | null;
  status: "active" | "inactive" | "graduated";
  photo_url: string | null;
  // Free-text, counselor-set "what to do next for this student" shown on
  // the Dashboard's My Students table — deliberately manual (see
  // DashboardOverview), since picking the single most important next step
  // takes human judgment a checklist can't automate.
  next_action: string | null;
}

// What the acting counselor may see/edit for one particular student.
// canViewAll is true for admins and for the student's general counselor
// (counselor_id match) and implies the other two; canViewEc/canViewApplication
// are true when the acting counselor is specifically the ec_counselor_id /
// application_counselor_id for this student (or canViewAll is already true).
export interface StudentAccess {
  canViewAll: boolean;
  canViewEc: boolean;
  canViewApplication: boolean;
}

export interface StudentProgress {
  student_id: string;
  academic_profile: number;
  testing: number;
  extracurricular_activities: number;
  awards: number;
  college_list: number;
  common_application: number;
  personal_statement: number;
  supplemental_essays: number;
  recommendation_letters: number;
  school_documents: number;
}

export const PROGRESS_CATEGORY_LABELS: Record<keyof Omit<StudentProgress, "student_id">, string> = {
  academic_profile: "학업 프로필",
  testing: "시험",
  extracurricular_activities: "과외활동",
  awards: "수상",
  college_list: "컬리지 리스트",
  common_application: "커먼앱",
  personal_statement: "자기소개서",
  supplemental_essays: "추가 에세이",
  recommendation_letters: "추천서",
  school_documents: "학교 서류",
};

export interface AcademicOverview {
  student_id: string;
  // Manual override of the student's CUMULATIVE GPA (across all grades).
  // Null = use the value computed from grade_records (see src/lib/gpa.ts).
  // Set = counselor checked the school's official transcript and this wins.
  unweighted_gpa: number | null;
  weighted_gpa: number | null;
  gpa_scale: number;
  class_rank: number | null;
  class_size: number | null;
  percentile: number | null;
  school_does_not_rank: boolean;
}

// One row per grade level (9-12) for a student. Created once the counselor
// picks how many terms that grade is split into; GPA for the grade is
// computed by rolling up its terms' GPA (see src/lib/gpa.ts), never typed
// in directly — manual_unweighted_gpa/manual_weighted_gpa are an escape
// hatch for when the computed number doesn't match the school's own
// transcript.
export interface GradeRecord {
  id: string;
  student_id: string;
  grade_level: 9 | 10 | 11 | 12;
  academic_year: string | null;
  term_system: TermSystem;
  // Only set when term_system = "custom".
  custom_term_count: number | null;
  status: GradeRecordStatus;
  manual_unweighted_gpa: number | null;
  manual_weighted_gpa: number | null;
}

// One row per term (semester/trimester/quarter) within a GradeRecord,
// auto-created from its term_system. GPA for the term is computed by
// averaging its courses' grade points, weighted by credit — same
// manual-override escape hatch as GradeRecord.
export interface Term {
  id: string;
  grade_record_id: string;
  student_id: string;
  term_number: number;
  manual_unweighted_gpa: number | null;
  manual_weighted_gpa: number | null;
  // Set when a counselor explicitly finalizes this term (see "Finalize
  // Term" in Academic Record). Null = Planned/In Progress. Finalizing does
  // NOT copy Progress grades into Final grades — it's purely a status flag
  // a counselor can also reopen (clear back to null) at any time.
  finalized_at: string | null;
}

export interface Course {
  id: string;
  term_id: string;
  student_id: string;
  course_name: string;
  subject_category: SubjectCategory | null;
  // Optional — a course can be registered before the counselor has
  // decided/confirmed its level.
  course_level: CourseLevel | null;
  credit: number;
  grade_scale: GradeScale;
  // Progress/Current grade — the counselor's latest weekly-check-in value.
  // This is a cache of the most recent CourseProgressEntry (below); exactly
  // one of these three is populated, matching grade_scale. "custom" grades
  // (e.g. Pass/Fail) show as-is but are excluded from the GPA calculation.
  letter_grade: string | null;
  point_score: number | null;
  custom_grade: string | null;
  // Final grade — set once only after the school posts the official grade
  // for the term. Completely separate from the Progress grade above: never
  // auto-filled from it, and never overwritten by a later Progress update.
  final_letter_grade: string | null;
  final_point_score: number | null;
  final_custom_grade: string | null;
}

// One row per weekly (or ad-hoc) Progress Grade check-in for a course —
// history is never overwritten, so a counselor can see whether a grade is
// trending up or down over the term. The course's own letter_grade /
// point_score / custom_grade always mirrors the latest entry here.
export interface CourseProgressEntry {
  id: string;
  course_id: string;
  student_id: string;
  recorded_date: string;
  letter_grade: string | null;
  point_score: number | null;
  custom_grade: string | null;
  note: string | null;
  counselor_id: string | null;
  created_at: string;
}

export interface SatScore {
  id: string;
  student_id: string;
  // Which sitting this is (1st, 2nd, ...) — SAT can be retaken, so this is
  // how multiple attempts are told apart alongside test_date.
  attempt_number: number | null;
  test_date: string;
  total_score: number;
  reading_writing: number;
  math: number;
}

export interface ActScore {
  id: string;
  student_id: string;
  attempt_number: number | null;
  test_date: string;
  composite: number;
  english: number;
  math: number;
  reading: number;
  science: number;
}

export interface ApScore {
  id: string;
  student_id: string;
  subject: string;
  score: number;
  test_date: string;
}

export interface Extracurricular {
  id: string;
  student_id: string;
  activity_name: string;
  category: string | null;
  position_role: string | null;
  grades_participated: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  major_relevance: string | null;
  common_app_activity: boolean;
  status: ECStatus;
  created_at?: string;
  updated_at?: string;
  // Counselor-only narrative evaluation — never render on a student/parent-facing view.
  counselor_evaluation: string | null;
}

export interface Award {
  id: string;
  student_id: string;
  award_name: string;
  organization: string | null;
  grade_level: number | null;
  award_level: AwardLevel;
  placement: string | null;
  num_participants: number | null;
  selectivity: string | null;
  description: string | null;
  academic_area: string | null;
  major_relevance: string | null;
  created_at?: string;
}

export interface HistoricalAdmission {
  id: string;
  graduation_year: number | null;
  high_school: string | null;
  gpa: number | null;
  sat_score: number | null;
  act_score: number | null;
  curriculum: string | null;
  intended_major: string | null;
  ec_strength: number | null;
  awards_strength: number | null;
  application_round: string | null;
  university_name: string;
  admission_result: AdmissionResult;
}

export interface ParentAccount {
  id: string;
  auth_user_id: string;
  student_id: string;
  parent_name: string | null;
  email: string;
  created_at: string;
}

export interface PersonalStatement {
  student_id: string;
  status: EssayStatus;
  topic: string | null;
  draft_link: string | null;
  last_updated: string;
}

export interface SupplementalEssay {
  id: string;
  student_id: string;
  college_list_id: string | null;
  university_name: string | null;
  prompt: string | null;
  word_limit: number | null;
  status: EssayStatus;
  draft_link: string | null;
  counselor: string | null;
  editor: string | null;
  counselor_comments: string | null;
  last_updated: string;
}

export interface CollegeListEntry {
  id: string;
  student_id: string;
  category: CollegeCategory;
  university_name: string;
  intended_major: string | null;
  application_round: ApplicationRound | null;
  application_deadline: string | null;
  student_preference_level: number | null;
  parent_preference_level: number | null;
  counselor_recommendation: string | null;
  application_status: string;
  notes: string | null;
  test_optional: boolean;
  checklist?: ApplicationChecklist;
  created_at?: string;
  updated_at?: string;
}

export interface ApplicationChecklist {
  college_list_id: string;
  college_added: boolean;
  major_selected: boolean;
  common_app_profile: boolean;
  activities: boolean;
  honors: boolean;
  personal_statement: boolean;
  supplemental_essays: boolean;
  counselor_recommendation: boolean;
  teacher_recommendation_1: boolean;
  teacher_recommendation_2: boolean;
  transcript: boolean;
  test_scores_submission: boolean;
  financial_aid: boolean;
  application_submitted: boolean;
}

export interface TaskItem {
  id: string;
  student_id: string;
  task: string;
  assigned_to: string | null;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ConsultationNote {
  id: string;
  student_id: string;
  counselor_id: string | null;
  counselor_name?: string;
  meeting_date: string;
  attendees: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory = "extracurricular" | "essay" | "test_prep" | "other";

export interface StudentFinance {
  student_id: string;
  consulting_fee: number;
  contract_start: string | null;
  contract_end: string | null;
  notes: string | null;
  updated_at: string;
}

export interface StudentExpense {
  id: string;
  student_id: string;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  expense_date: string | null;
  created_at: string;
}

export type AttachmentEntityType = "extracurricular" | "award" | "personal_statement" | "essay" | "transcript";

export interface Attachment {
  id: string;
  student_id: string;
  entity_type: AttachmentEntityType;
  entity_id: string;
  file_name: string;
  storage_path: string;
  file_url: string;
  file_size: number | null;
  created_at: string;
}

export type TrackStatus = "green" | "yellow" | "red";

// ============================================================
// Grade 8-11 Goal Setting & Target Colleges — separate from Grade 12's
// college_list/application machinery. Same shape for every grade 8-11.
// ============================================================

export type GoalPriority = "High" | "Medium" | "Low";

// A history row, not a single current record — see getCurrentMajorGoal in
// src/lib/data.ts. Changing the major inserts a new row.
export interface MajorGoal {
  id: string;
  student_id: string;
  primary_major: string | null;
  secondary_major: string | null;
  career_interest: string | null;
  counselor_notes: string | null;
  created_at: string;
}

export interface TargetCollege {
  id: string;
  student_id: string;
  university_name: string;
  interested_major: string | null;
  priority: GoalPriority;
  notes: string | null;
  date_added: string;
  created_at: string;
}

export interface CounselingPlan {
  id: string;
  student_id: string;
  academic_year: string;
  created_at: string;
}

// Replaces the old Goal (category/priority/dates) + Milestone two-tier
// structure above — a Counseling Plan's progress is now just a flat
// checklist, one row per to-do item. See planTaskProgress in
// src/lib/goals.ts for the completed/total % this feeds.
export interface PlanTask {
  id: string;
  plan_id: string;
  student_id: string;
  title: string;
  is_done: boolean;
  created_at: string;
}
