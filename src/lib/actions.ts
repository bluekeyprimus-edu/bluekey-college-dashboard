"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase, isSupabaseConfigured } from "./supabase";
import { ApplicationChecklist, CollegeCategory } from "./types";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

function num(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function studentPayload(formData: FormData) {
  return {
    student_name: str(formData, "student_name"),
    english_name: str(formData, "english_name"),
    current_grade: num(formData, "current_grade"),
    graduation_year: num(formData, "graduation_year"),
    high_school: str(formData, "high_school"),
    school_country: str(formData, "school_country"),
    school_type: str(formData, "school_type"),
    curriculum: str(formData, "curriculum"),
    citizenship: str(formData, "citizenship"),
    us_permanent_resident: formData.get("us_permanent_resident") === "on",
    intended_major: str(formData, "intended_major"),
    secondary_major_interest: str(formData, "secondary_major_interest"),
    career_interest: str(formData, "career_interest"),
    counselor_id: str(formData, "counselor_id"),
  };
}

export async function createStudent(formData: FormData) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase가 아직 연결되지 않았어요. .env.local을 확인해주세요.");
  }
  const payload = studentPayload(formData);
  if (!payload.student_name || !payload.current_grade || !payload.graduation_year || !payload.high_school || !payload.curriculum) {
    throw new Error("필수 항목(학생 이름, 현재 학년, 졸업연도, 고등학교, 커리큘럼)을 입력해주세요.");
  }

  const { data, error } = await supabase!.from("students").insert(payload).select("id").single();
  if (error || !data) {
    throw new Error(`학생 등록 실패: ${error?.message ?? "알 수 없는 오류"}`);
  }

  // Seed a blank progress row so the profile page has something to render/edit.
  await supabase!.from("student_progress").insert({ student_id: data.id });

  revalidatePath("/students");
  revalidatePath("/");
  redirect(`/students/${data.id}`);
}

export async function updateStudent(studentId: string, formData: FormData) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase가 아직 연결되지 않았어요. .env.local을 확인해주세요.");
  }
  const payload = studentPayload(formData);
  if (!payload.student_name || !payload.current_grade || !payload.graduation_year || !payload.high_school || !payload.curriculum) {
    throw new Error("필수 항목(학생 이름, 현재 학년, 졸업연도, 고등학교, 커리큘럼)을 입력해주세요.");
  }

  const { error } = await supabase!.from("students").update(payload).eq("id", studentId);
  if (error) {
    throw new Error(`학생 정보 수정 실패: ${error.message}`);
  }

  revalidatePath("/students");
  revalidatePath("/");
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}

const GPA_SUBJECTS = ["english", "math", "science", "social_studies", "foreign_language", "other", "overall"] as const;
const GRADE_LEVELS = [9, 10, 11, 12] as const;

export async function upsertAcademicOverview(studentId: string, formData: FormData) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");

  const payload = {
    student_id: studentId,
    unweighted_gpa: num(formData, "unweighted_gpa"),
    weighted_gpa: num(formData, "weighted_gpa"),
    gpa_scale: num(formData, "gpa_scale") ?? 4.0,
    class_rank: num(formData, "class_rank"),
    class_size: num(formData, "class_size"),
    percentile: num(formData, "percentile"),
    school_does_not_rank: formData.get("school_does_not_rank") === "on",
  };

  const { error } = await supabase!.from("academic_overview").upsert(payload, { onConflict: "student_id" });
  if (error) throw new Error(`저장 실패: ${error.message}`);

  revalidatePath(`/students/${studentId}/academics`);
  revalidatePath(`/students/${studentId}`);
}

export async function upsertGpaGrid(studentId: string, formData: FormData) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");

  const rows = [];
  for (const grade of GRADE_LEVELS) {
    for (const subject of GPA_SUBJECTS) {
      const gpa = num(formData, `gpa_${grade}_${subject}`);
      rows.push({ student_id: studentId, grade_level: grade, subject, gpa });
    }
  }

  const { error } = await supabase!
    .from("gpa_by_grade")
    .upsert(rows, { onConflict: "student_id,grade_level,subject" });
  if (error) throw new Error(`저장 실패: ${error.message}`);

  revalidatePath(`/students/${studentId}/academics`);
  revalidatePath(`/students/${studentId}`);
}

export async function addCourse(studentId: string, formData: FormData) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");

  const payload = {
    student_id: studentId,
    course_name: str(formData, "course_name"),
    grade_level: num(formData, "grade_level"),
    academic_year: str(formData, "academic_year"),
    course_level: str(formData, "course_level"),
    subject_area: str(formData, "subject_area"),
  };
  if (!payload.course_name || !payload.course_level) {
    throw new Error("과목명과 Course Level은 필수예요.");
  }

  const { error } = await supabase!.from("courses").insert(payload);
  if (error) throw new Error(`추가 실패: ${error.message}`);

  revalidatePath(`/students/${studentId}/academics`);
}

export async function deleteCourse(studentId: string, courseId: string) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");
  const { error } = await supabase!.from("courses").delete().eq("id", courseId);
  if (error) throw new Error(`삭제 실패: ${error.message}`);
  revalidatePath(`/students/${studentId}/academics`);
}

export async function addCollegeToList(studentId: string, formData: FormData) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");

  const payload = {
    student_id: studentId,
    category: str(formData, "category"),
    university_name: str(formData, "university_name"),
    intended_major: str(formData, "intended_major"),
    application_round: str(formData, "application_round"),
    application_deadline: str(formData, "application_deadline"),
    student_preference_level: num(formData, "student_preference_level"),
    parent_preference_level: num(formData, "parent_preference_level"),
    counselor_recommendation: str(formData, "counselor_recommendation"),
    notes: str(formData, "notes"),
  };
  if (!payload.category || !payload.university_name) {
    throw new Error("분류와 대학명은 필수예요.");
  }

  const { data, error } = await supabase!.from("college_list").insert(payload).select("id").single();
  if (error) throw new Error(`추가 실패: ${error.message}`);

  const { error: checklistError } = await supabase!
    .from("application_checklist")
    .insert({ college_list_id: data.id });
  if (checklistError) throw new Error(`체크리스트 생성 실패: ${checklistError.message}`);

  revalidatePath(`/students/${studentId}/college-list`);
  revalidatePath(`/students/${studentId}`);
}

export async function deleteCollegeFromList(studentId: string, collegeId: string) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");
  const { error } = await supabase!.from("college_list").delete().eq("id", collegeId);
  if (error) throw new Error(`삭제 실패: ${error.message}`);
  revalidatePath(`/students/${studentId}/college-list`);
  revalidatePath(`/students/${studentId}`);
}

export async function updateCollegeCategory(studentId: string, collegeId: string, category: CollegeCategory) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");
  const { error } = await supabase!.from("college_list").update({ category }).eq("id", collegeId);
  if (error) throw new Error(`업데이트 실패: ${error.message}`);
  revalidatePath(`/students/${studentId}/college-list`);
  revalidatePath(`/students/${studentId}`);
}

export async function toggleChecklistItem(
  studentId: string,
  collegeId: string,
  field: keyof Omit<ApplicationChecklist, "college_list_id">,
  value: boolean
) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");
  const { error } = await supabase!
    .from("application_checklist")
    .update({ [field]: value })
    .eq("college_list_id", collegeId);
  if (error) throw new Error(`업데이트 실패: ${error.message}`);
  revalidatePath(`/students/${studentId}/college-list`);
  revalidatePath(`/students/${studentId}`);
}

export async function updateCollegeStatus(studentId: string, collegeId: string, formData: FormData) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");
  const payload = {
    application_round: str(formData, "application_round"),
    application_deadline: str(formData, "application_deadline"),
    application_status: str(formData, "application_status") ?? "Not Started",
    student_preference_level: num(formData, "student_preference_level"),
    parent_preference_level: num(formData, "parent_preference_level"),
    counselor_recommendation: str(formData, "counselor_recommendation"),
    notes: str(formData, "notes"),
  };
  const { error } = await supabase!.from("college_list").update(payload).eq("id", collegeId);
  if (error) throw new Error(`업데이트 실패: ${error.message}`);
  revalidatePath(`/students/${studentId}/college-list`);
  revalidatePath(`/students/${studentId}`);
}

// ============================================================
// Extracurricular Activities (Section 4)
// Rating fields (rating_*) are counselor-only — never surface these on
// any student/parent-facing view or API response.
// ============================================================
function extracurricularPayload(formData: FormData) {
  return {
    activity_name: str(formData, "activity_name"),
    category: str(formData, "category"),
    organization: str(formData, "organization"),
    position_role: str(formData, "position_role"),
    grades_participated: str(formData, "grades_participated"),
    start_date: str(formData, "start_date"),
    end_date: str(formData, "end_date"),
    hours_per_week: num(formData, "hours_per_week"),
    weeks_per_year: num(formData, "weeks_per_year"),
    description: str(formData, "description"),
    achievements: str(formData, "achievements"),
    quantifiable_impact: str(formData, "quantifiable_impact"),
    leadership: str(formData, "leadership"),
    major_relevance: str(formData, "major_relevance"),
    common_app_activity: formData.get("common_app_activity") === "on",
    status: str(formData, "status") ?? "Idea",
    rating_strength: num(formData, "rating_strength"),
    rating_leadership: num(formData, "rating_leadership"),
    rating_impact: num(formData, "rating_impact"),
    rating_uniqueness: num(formData, "rating_uniqueness"),
    rating_major_relevance: num(formData, "rating_major_relevance"),
  };
}

export async function addExtracurricular(studentId: string, formData: FormData) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");
  const payload = extracurricularPayload(formData);
  if (!payload.activity_name) throw new Error("활동명은 필수예요.");

  const { error } = await supabase!.from("extracurriculars").insert({ student_id: studentId, ...payload });
  if (error) throw new Error(`추가 실패: ${error.message}`);

  revalidatePath(`/students/${studentId}/activities`);
  revalidatePath(`/students/${studentId}`);
}

export async function updateExtracurricular(studentId: string, ecId: string, formData: FormData) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");
  const payload = extracurricularPayload(formData);
  if (!payload.activity_name) throw new Error("활동명은 필수예요.");

  const { error } = await supabase!.from("extracurriculars").update(payload).eq("id", ecId);
  if (error) throw new Error(`수정 실패: ${error.message}`);

  revalidatePath(`/students/${studentId}/activities`);
  revalidatePath(`/students/${studentId}`);
}

export async function deleteExtracurricular(studentId: string, ecId: string) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");
  const { error } = await supabase!.from("extracurriculars").delete().eq("id", ecId);
  if (error) throw new Error(`삭제 실패: ${error.message}`);
  revalidatePath(`/students/${studentId}/activities`);
  revalidatePath(`/students/${studentId}`);
}

// ============================================================
// Awards & Honors (Section 5)
// ============================================================
function awardPayload(formData: FormData) {
  return {
    award_name: str(formData, "award_name"),
    organization: str(formData, "organization"),
    grade_level: num(formData, "grade_level"),
    award_level: str(formData, "award_level") ?? "School",
    placement: str(formData, "placement"),
    num_participants: num(formData, "num_participants"),
    selectivity: str(formData, "selectivity"),
    description: str(formData, "description"),
    academic_area: str(formData, "academic_area"),
    major_relevance: str(formData, "major_relevance"),
  };
}

export async function addAward(studentId: string, formData: FormData) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");
  const payload = awardPayload(formData);
  if (!payload.award_name) throw new Error("수상명은 필수예요.");

  const { error } = await supabase!.from("awards").insert({ student_id: studentId, ...payload });
  if (error) throw new Error(`추가 실패: ${error.message}`);

  revalidatePath(`/students/${studentId}/activities`);
  revalidatePath(`/students/${studentId}`);
}

export async function updateAward(studentId: string, awardId: string, formData: FormData) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");
  const payload = awardPayload(formData);
  if (!payload.award_name) throw new Error("수상명은 필수예요.");

  const { error } = await supabase!.from("awards").update(payload).eq("id", awardId);
  if (error) throw new Error(`수정 실패: ${error.message}`);

  revalidatePath(`/students/${studentId}/activities`);
  revalidatePath(`/students/${studentId}`);
}

export async function deleteAward(studentId: string, awardId: string) {
  if (!isSupabaseConfigured) throw new Error("Supabase가 아직 연결되지 않았어요.");
  const { error } = await supabase!.from("awards").delete().eq("id", awardId);
  if (error) throw new Error(`삭제 실패: ${error.message}`);
  revalidatePath(`/students/${studentId}/activities`);
  revalidatePath(`/students/${studentId}`);
}
