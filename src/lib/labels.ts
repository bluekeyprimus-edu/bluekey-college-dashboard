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
  Idea: "아이디어",
  Planning: "계획",
  Started: "시작",
  Developing: "진행 중",
  "Impact Created": "성과 창출",
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

export const GPA_SUBJECT_LABEL: Record<string, string> = {
  english: "영어",
  math: "수학",
  science: "과학",
  social_studies: "사회",
  foreign_language: "외국어",
  other: "기타",
  overall: "전체 GPA",
};

export const SUBJECT_AREA_LABEL: Record<string, string> = {
  STEM: "STEM",
  Humanities: "Humanities",
  Other: "기타",
};

export const COURSE_LEVEL_OPTIONS = [
  "Regular",
  "Honors",
  "AP",
  "IB HL",
  "IB SL",
  "A-Level",
  "Dual Enrollment",
  "College Level",
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
  "High Target": "High Target",
  Target: "Target",
  Likely: "Likely",
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
