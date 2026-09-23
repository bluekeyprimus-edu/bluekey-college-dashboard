import { isSupabaseConfigured } from "./supabase";
import * as mock from "./mock-data";
import { StudentProgress } from "./types";

// Thin data-access layer. Every function currently reads from mock-data.ts;
// once NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set,
// swap the mock branch for a real supabase.from(...) query — callers don't
// need to change.

export async function getStudents() {
  if (!isSupabaseConfigured) return mock.mockStudents;
  return mock.mockStudents; // TODO: wire to `students` table once Supabase project is live
}

export async function getStudent(id: string) {
  const students = await getStudents();
  return students.find((s) => s.id === id) ?? null;
}

export async function getProgress(studentId: string): Promise<StudentProgress | null> {
  return mock.mockProgress[studentId] ?? null;
}

export async function getAllProgress() {
  return mock.mockProgress;
}

export async function getAcademicOverview(studentId: string) {
  return mock.mockAcademicOverview[studentId] ?? null;
}

export async function getGpaByGrade(studentId: string) {
  return mock.mockGpaByGrade.filter((g) => g.student_id === studentId);
}

export async function getCourses(studentId: string) {
  return mock.mockCourses.filter((c) => c.student_id === studentId);
}

export async function getSatScores(studentId: string) {
  return mock.mockSat.filter((s) => s.student_id === studentId);
}

export async function getActScores(studentId: string) {
  return mock.mockAct.filter((s) => s.student_id === studentId);
}

export async function getApScores(studentId: string) {
  return mock.mockAp.filter((s) => s.student_id === studentId);
}

export async function getExtracurriculars(studentId: string) {
  return mock.mockExtracurriculars.filter((e) => e.student_id === studentId);
}

export async function getAwards(studentId: string) {
  return mock.mockAwards.filter((a) => a.student_id === studentId);
}

export async function getCollegeList(studentId: string) {
  return mock.mockCollegeList.filter((c) => c.student_id === studentId);
}

export async function getTasks(studentId: string) {
  return mock.mockTasks.filter((t) => t.student_id === studentId);
}

export async function getAllTasks() {
  return mock.mockTasks;
}

export interface RosterRow {
  student: Awaited<ReturnType<typeof getStudents>>[number];
  progress: number;
  status: import("./types").TrackStatus;
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
