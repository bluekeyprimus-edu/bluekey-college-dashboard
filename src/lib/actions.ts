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
