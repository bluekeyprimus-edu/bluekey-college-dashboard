// Core data model — mirrors supabase/schema.sql

export type Curriculum = "AP" | "IB" | "A-Level" | "Korean" | "Other";
export type CourseLevel =
  | "Regular"
  | "Honors"
  | "AP"
  | "IB HL"
  | "IB SL"
  | "A-Level"
  | "Dual Enrollment"
  | "College Level";
export type ECStatus =
  | "Idea"
  | "Planning"
  | "Started"
  | "Developing"
  | "Impact Created"
  | "Completed"
  | "Common App Ready";
export type AwardLevel = "School" | "Regional" | "State" | "National" | "International";
export type CollegeCategory = "Reach" | "High Target" | "Target" | "Likely" | "Safety";
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
export type AdmissionResult = "Accepted" | "Waitlisted" | "Deferred" | "Rejected";

export interface Counselor {
  id: string;
  name: string;
  email: string | null;
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
  status: "active" | "inactive" | "graduated";
  photo_url: string | null;
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
  financial_aid: number;
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
  financial_aid: "재정 지원",
};

export interface AcademicOverview {
  student_id: string;
  unweighted_gpa: number | null;
  weighted_gpa: number | null;
  gpa_scale: number;
  class_rank: number | null;
  class_size: number | null;
  percentile: number | null;
  school_does_not_rank: boolean;
}

export interface GpaByGrade {
  id: string;
  student_id: string;
  grade_level: 9 | 10 | 11 | 12;
  subject: "english" | "math" | "science" | "social_studies" | "foreign_language" | "other" | "overall";
  gpa: number | null;
  notes: string | null;
}

export interface Course {
  id: string;
  student_id: string;
  course_name: string;
  grade_level: number;
  academic_year: string;
  course_level: CourseLevel;
  subject_area: "STEM" | "Humanities" | "Other" | null;
}

export interface SatScore {
  id: string;
  student_id: string;
  test_date: string;
  total_score: number;
  reading_writing: number;
  math: number;
}

export interface ActScore {
  id: string;
  student_id: string;
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
  organization: string | null;
  position_role: string | null;
  grades_participated: string | null;
  start_date: string | null;
  end_date: string | null;
  hours_per_week: number | null;
  weeks_per_year: number | null;
  description: string | null;
  achievements: string | null;
  quantifiable_impact: string | null;
  leadership: string | null;
  major_relevance: string | null;
  common_app_activity: boolean;
  status: ECStatus;
  // Counselor-only — never render on a student/parent-facing view.
  rating_strength: number | null;
  rating_leadership: number | null;
  rating_impact: number | null;
  rating_uniqueness: number | null;
  rating_major_relevance: number | null;
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
  checklist?: ApplicationChecklist;
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
}

export type TrackStatus = "green" | "yellow" | "red";
