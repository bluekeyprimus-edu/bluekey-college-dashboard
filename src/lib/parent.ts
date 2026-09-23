import { supabase, isSupabaseConfigured } from "./supabase";
import { ParentAccount } from "./types";

// Parent-portal-specific data access. Kept separate from data.ts because
// these queries are either counselor-side management (list of linked
// parent accounts) or auth-gated lookups keyed by a Supabase Auth user id
// rather than by student — a different shape than the rest of the app.

export async function getParentAccountsForStudent(studentId: string): Promise<ParentAccount[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase!
    .from("parent_accounts")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at");
  return (data as ParentAccount[]) ?? [];
}

export interface LinkedStudent {
  studentId: string;
  studentName: string;
  englishName: string | null;
}

export async function getLinkedStudentsForParent(authUserId: string): Promise<LinkedStudent[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase!
    .from("parent_accounts")
    .select("student_id, students(student_name, english_name)")
    .eq("auth_user_id", authUserId);
  if (!data) return [];
  return (data as unknown as { student_id: string; students: { student_name: string; english_name: string | null } | null }[])
    .filter((row) => row.students)
    .map((row) => ({
      studentId: row.student_id,
      studentName: row.students!.student_name,
      englishName: row.students!.english_name,
    }));
}

export async function isParentLinkedToStudent(authUserId: string, studentId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { data } = await supabase!
    .from("parent_accounts")
    .select("id")
    .eq("auth_user_id", authUserId)
    .eq("student_id", studentId)
    .maybeSingle();
  return !!data;
}
