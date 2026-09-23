import { supabase, isSupabaseConfigured } from "./supabase";
import * as mock from "./mock-data";
import {
  Student,
  StudentProgress,
  AcademicOverview,
  GpaByGrade,
  Course,
  SatScore,
  ActScore,
  ApScore,
  Extracurricular,
  Award,
  CollegeListEntry,
  ApplicationChecklist,
  TaskItem,
  TrackStatus,
} from "./types";

// Thin data-access layer. When NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are set
// (see lib/supabase.ts) every function reads from the real Supabase tables;
// otherwise it falls back to mock-data.ts so the UI never blocks on Supabase
// being configured.

type StudentRow = Omit<Student, "counselor_name"> & {
  counselors: { name: string } | null;
};

export async function getStudents(): Promise<Student[]> {
  if (!isSupabaseConfigured) return mock.mockStudents;
  const { data, error } = await supabase!
    .from("students")
    .select("*, counselors(name)")
    .order("student_name");
  if (error || !data) return mock.mockStudents;
  return (data as unknown as StudentRow[]).map((row) => ({
    ...row,
    counselor_name: row.counselors?.name,
  })) as Student[];
}

export async function getStudent(id: string): Promise<Student | null> {
  const students = await getStudents();
  return students.find((s) => s.id === id) ?? null;
}

export async function getProgress(studentId: string): Promise<StudentProgress | null> {
  if (!isSupabaseConfigured) return mock.mockProgress[studentId] ?? null;
  const { data } = await supabase!.from("student_progress").select("*").eq("student_id", studentId).maybeSingle();
  return (data as StudentProgress) ?? null;
}

export async function getAcademicOverview(studentId: string): Promise<AcademicOverview | null> {
  if (!isSupabaseConfigured) return mock.mockAcademicOverview[studentId] ?? null;
  const { data } = await supabase!.from("academic_overview").select("*").eq("student_id", studentId).maybeSingle();
  return (data as AcademicOverview) ?? null;
}

export async function getGpaByGrade(studentId: string): Promise<GpaByGrade[]> {
  if (!isSupabaseConfigured) return mock.mockGpaByGrade.filter((g) => g.student_id === studentId);
  const { data } = await supabase!.from("gpa_by_grade").select("*").eq("student_id", studentId).order("grade_level");
  return (data as GpaByGrade[]) ?? [];
}

export async function getCourses(studentId: string): Promise<Course[]> {
  if (!isSupabaseConfigured) return mock.mockCourses.filter((c) => c.student_id === studentId);
  const { data } = await supabase!.from("courses").select("*").eq("student_id", studentId);
  return (data as Course[]) ?? [];
}

export async function getSatScores(studentId: string): Promise<SatScore[]> {
  if (!isSupabaseConfigured) return mock.mockSat.filter((s) => s.student_id === studentId);
  const { data } = await supabase!.from("sat_scores").select("*").eq("student_id", studentId).order("test_date");
  return (data as SatScore[]) ?? [];
}

export async function getActScores(studentId: string): Promise<ActScore[]> {
  if (!isSupabaseConfigured) return mock.mockAct.filter((s) => s.student_id === studentId);
  const { data } = await supabase!.from("act_scores").select("*").eq("student_id", studentId).order("test_date");
  return (data as ActScore[]) ?? [];
}

export async function getApScores(studentId: string): Promise<ApScore[]> {
  if (!isSupabaseConfigured) return mock.mockAp.filter((s) => s.student_id === studentId);
  const { data } = await supabase!.from("ap_scores").select("*").eq("student_id", studentId).order("test_date");
  return (data as ApScore[]) ?? [];
}

export async function getExtracurriculars(studentId: string): Promise<Extracurricular[]> {
  if (!isSupabaseConfigured) return mock.mockExtracurriculars.filter((e) => e.student_id === studentId);
  const { data } = await supabase!.from("extracurriculars").select("*").eq("student_id", studentId);
  return (data as Extracurricular[]) ?? [];
}

export async function getAwards(studentId: string): Promise<Award[]> {
  if (!isSupabaseConfigured) return mock.mockAwards.filter((a) => a.student_id === studentId);
  const { data } = await supabase!.from("awards").select("*").eq("student_id", studentId);
  return (data as Award[]) ?? [];
}

export async function getCollegeList(studentId: string): Promise<CollegeListEntry[]> {
  if (!isSupabaseConfigured) return mock.mockCollegeList.filter((c) => c.student_id === studentId);
  const { data: colleges } = await supabase!.from("college_list").select("*").eq("student_id", studentId);
  const rows = (colleges as CollegeListEntry[]) ?? [];
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);
  const { data: checklists } = await supabase!.from("application_checklist").select("*").in("college_list_id", ids);
  const byId = new Map<string, ApplicationChecklist>();
  for (const c of (checklists as ApplicationChecklist[]) ?? []) byId.set(c.college_list_id, c);
  return rows.map((r) => ({ ...r, checklist: byId.get(r.id) }));
}

export async function getTasks(studentId: string): Promise<TaskItem[]> {
  if (!isSupabaseConfigured) return mock.mockTasks.filter((t) => t.student_id === studentId);
  const { data } = await supabase!.from("tasks").select("*").eq("student_id", studentId).order("deadline");
  return (data as TaskItem[]) ?? [];
}

export async function getAllTasks(): Promise<TaskItem[]> {
  if (!isSupabaseConfigured) return mock.mockTasks;
  const { data } = await supabase!.from("tasks").select("*").order("deadline");
  return (data as TaskItem[]) ?? [];
}

export interface RosterRow {
  student: Student;
  progress: number;
  status: TrackStatus;
  nextDeadline: { name: string; date: string; days: number } | null;
  pendingTasks: number;
}

export async function getRosterRows(): Promise<RosterRow[]> {
  const { overallProgress, nextDeadline, pendingTaskCount, trackStatusFromProgress } = await import("./progress");
  const students = await getStudents();
  const rows: RosterRow[] = [];
  for (const student of students) {
    const progressRow = await getProgress(student.id);
    const progressPct = progressRow ? overallProgress(progressRow) : 0;
    const colleges = await getCollegeList(student.id);
    const tasks = await getTasks(student.id);
    const deadline = nextDeadline(colleges);
    rows.push({
      student,
      progress: progressPct,
      status: trackStatusFromProgress(progressPct, deadline?.days ?? null),
      nextDeadline: deadline,
      pendingTasks: pendingTaskCount(tasks),
    });
  }
  return rows;
}

export async function getCounselors() {
  if (!isSupabaseConfigured) return mock.mockCounselors;
  const { data } = await supabase!.from("counselors").select("*").order("name");
  return data ?? mock.mockCounselors;
}
