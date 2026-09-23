"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase, isSupabaseConfigured } from "./supabase";

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
