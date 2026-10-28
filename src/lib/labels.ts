// Korean display labels for enum-like values. DB/type values stay in
// English (matches the original schema's CHECK constraints) — only the
// rendered text is localized, so data stays portable.

export const TASK_PRIORITY_LABEL: Record<string, string> = {
  High: "높음",
  Medium: "보통",
  Low: "낮음",
};

export const TASK_STATUS_LABEL: Record<string, string> = {
  "Not Started": "시작 전",
  "In Progress": "진행 중",
  Waiting: "대기",
  Completed: "완료",
};

export const EC_STATUS_LABEL: Record<string, string> = {
  Developing: "진행 중",
  Completed: "완료",
  "Common App Ready": "커먼앱 준비 완료",
};

export const ESSAY_STATUS_LABEL: Record<string, string> = {
  Brainstorming: "구상 중",
  "Topic Selected": "주제 선정",
  Outline: "개요 작성",
  "First Draft": "초안",
  "Revision 1": "1차 수정",
  "Revision 2": "2차 수정",
  "Final Review": "최종 검토",
  Completed: "완료",
};

export const CURRICULUM_LABEL: Record<string, string> = {
  AP: "AP",
  IB: "IB",
  "A-Level": "A-Level",
  Korean: "국내 교육과정",
  Other: "기타",
};

export const SUBJECT_CATEGORY_OPTIONS = [
  "English",
  "Math",
  "Science",
  "Social Studies",
  "Foreign Language",
  "Arts",
  "Computer Science",
  "Other",
] as const;

export const SUBJECT_CATEGORY_LABEL: Record<string, string> = {
  English: "영어",
  Math: "수학",
  Science: "과학",
  "Social Studies": "사회",
  "Foreign Language": "외국어",
  Arts: "예술",
  "Computer Science": "컴퓨터공학",
  Other: "기타",
};

export const COURSE_LEVEL_OPTIONS = [
  "Regular",
  "Honors",
  "Advanced",
  "AP",
  "IB SL",
  "IB HL",
  "A-Level",
  "Dual Enrollment",
  "College Level",
  "Other",
] as const;

// term_system -> how many Term rows to auto-create, and what to call each
// one. "custom" has no fixed count — the counselor types it in.
export const TERM_SYSTEM_OPTIONS = [
  { value: "2_semesters", label: "2학기제 (Semester)", count: 2 },
  { value: "3_trimesters", label: "3학기제 (Trimester)", count: 3 },
  { value: "4_quarters", label: "4학기제 (Quarter)", count: 4 },
  { value: "custom", label: "직접 설정", count: null },
] as const;

export const TERM_SYSTEM_LABEL: Record<string, string> = {
  "2_semesters": "2학기제",
  "3_trimesters": "3학기제",
  "4_quarters": "4학기제",
  custom: "직접 설정",
};

// What to call an individual term for a given term_system, e.g. "Semester 2".
export const TERM_NOUN: Record<string, string> = {
  "2_semesters": "Semester",
  "3_trimesters": "Trimester",
  "4_quarters": "Quarter",
  custom: "Term",
};

export const GRADE_SCALE_OPTIONS = [
  { value: "letter", label: "Letter Grade" },
  { value: "100_point", label: "100점 만점" },
  { value: "custom", label: "직접 입력" },
] as const;

export const GRADE_SCALE_LABEL: Record<string, string> = {
  letter: "Letter Grade",
  "100_point": "100점 만점",
  custom: "직접 입력",
};

export const LETTER_GRADE_OPTIONS = [
  "A+", "A", "A-",
  "B+", "B", "B-",
  "C+", "C", "C-",
  "D+", "D", "D-",
  "F",
  "P", "CR", "NC",
] as const;

export const CHECKLIST_ITEM_LABEL: Record<string, string> = {
  college_added: "대학 등록",
  major_selected: "전공 선택",
  common_app_profile: "Common App 프로필",
  activities: "활동 입력",
  honors: "수상 입력",
  personal_statement: "자기소개서",
  supplemental_essays: "추가 에세이",
  counselor_recommendation: "카운슬러 추천서",
  teacher_recommendation_1: "교사 추천서 1",
  teacher_recommendation_2: "교사 추천서 2",
  transcript: "성적증명서",
  test_scores_submission: "시험 성적 제출",
  financial_aid: "재정보조 서류",
  application_submitted: "지원서 제출 완료",
};

export const COLLEGE_CATEGORY_LABEL: Record<string, string> = {
  Reach: "Reach",
  Target: "Target",
  Safety: "Safety",
};

export const APPLICATION_STATUS_OPTIONS = [
  "Not Started",
  "In Progress",
  "Submitted",
  "Accepted",
  "Waitlisted",
  "Deferred",
  "Rejected",
] as const;

export const APPLICATION_STATUS_LABEL: Record<string, string> = {
  "Not Started": "시작 전",
  "In Progress": "진행 중",
  Submitted: "제출 완료",
  Accepted: "합격",
  Waitlisted: "대기",
  Deferred: "보류",
  Rejected: "불합격",
};

export const AWARD_LEVEL_LABEL: Record<string, string> = {
  School: "교내",
  Regional: "지역",
  State: "주(State)",
  National: "전국",
  International: "국제",
};

export const EC_STATUS_OPTIONS = ["Developing", "Completed", "Common App Ready"] as const;

export const AWARD_LEVEL_OPTIONS = ["School", "Regional", "State", "National", "International"] as const;

export const ESSAY_STATUS_OPTIONS = [
  "Brainstorming",
  "Topic Selected",
  "Outline",
  "First Draft",
  "Revision 1",
  "Revision 2",
  "Final Review",
  "Completed",
] as const;

export const ADMISSION_RESULT_OPTIONS = ["Accepted", "Waitlisted", "Deferred", "Rejected"] as const;

export const ADMISSION_RESULT_LABEL: Record<string, string> = {
  Accepted: "합격",
  Waitlisted: "대기",
  Deferred: "보류",
  Rejected: "불합격",
};

export const EXPENSE_CATEGORY_LABEL: Record<string, string> = {
  extracurricular: "EC 비용",
  essay: "에세이 비용",
  test_prep: "시험 준비 비용",
  other: "기타 비용",
};
