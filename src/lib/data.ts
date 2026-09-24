import { supabase, isSupabaseConfigured } from "./supabase";
import * as mock from "./mock-data";
import { getCounselorRestriction } from "./current-counselor";
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
  PersonalStatement,
  SupplementalEssay,
  HistoricalAdmission,
  Counselor,
  TaskItem,
  TrackStatus,
  ConsultationNote,
  Attachment,
} from "./types";

// Thin data-access layer. When NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are set
// (see lib/supabase.ts) every function reads from the real Supabase tables;
// otherwise it falls back to mock-data.ts so the UI never blocks on Supabase
// being configured.

type StudentRow = Omit<Student, "counselor_name"> & {
  counselors: { name: string } | null;
};

export async function getStudents(): Promise<Student[]> {
  // Non-admin counselors only ever see their own assigned students — this
  // is the single choke point every /students/[id]/** sub-page reads
  // through (via getStudent below), so it locks down the whole per-student
  // area, not just the roster list.
  const restrictToCounselorId = await getCounselorRestriction();

  if (!isSupabaseConfigured) {
    const rows = mock.mockStudents;
    return restrictToCounselorId ? rows.filter((s) => s.counselor_id === restrictToCounselorId) : rows;
  }
  let query = supabase!.from("students").select("*, counselors(name)").order("student_name");
  if (restrictToCounselorId) query = query.eq("counselor_id", restrictToCounselorId);
  const { data, error } = await query;
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

type ConsultationNoteRow = Omit<ConsultationNote, "counselor_name"> & {
  counselors: { name: string } | null;
};

export async function getAttachments(studentId: string): Promise<Attachment[]> {
  // One query for the whole student, grouped by entity_id on the page side
  // — avoids an N+1 fetch per extracurricular/award/essay item.
  if (!isSupabaseConfigured) return mock.mockAttachments.filter((a) => a.student_id === studentId);
  const { data } = await supabase!
    .from("attachments")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  return (data as Attachment[]) ?? [];
}

export async function getConsultationNotes(studentId: string): Promise<ConsultationNote[]> {
  if (!isSupabaseConfigured) {
    return mock.mockConsultationNotes
      .filter((n) => n.student_id === studentId)
      .sort((a, b) => (a.meeting_date < b.meeting_date ? 1 : -1));
  }
  const { data } = await supabase!
    .from("consultation_notes")
    .select("*, counselors(name)")
    .eq("student_id", studentId)
    .order("meeting_date", { ascending: false });
  return ((data as unknown as ConsultationNoteRow[]) ?? []).map((row) => ({
    ...row,
    counselor_name: row.counselors?.name,
  })) as ConsultationNote[];
}

export async function getPersonalStatement(studentId: string): Promise<PersonalStatement | null> {
  if (!isSupabaseConfigured) return mock.mockPersonalStatements[studentId] ?? null;
  const { data } = await supabase!.from("personal_statement").select("*").eq("student_id", studentId).maybeSingle();
  return (data as PersonalStatement) ?? null;
}

export async function getSupplementalEssays(studentId: string): Promise<SupplementalEssay[]> {
  if (!isSupabaseConfigured) return mock.mockSupplementalEssays.filter((e) => e.student_id === studentId);
  const { data } = await supabase!
    .from("supplemental_essays")
    .select("*")
    .eq("student_id", studentId)
    .order("last_updated", { ascending: false });
  return (data as SupplementalEssay[]) ?? [];
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
  const restrictToCounselorId = await getCounselorRestriction();

  if (!isSupabaseConfigured) {
    if (!restrictToCounselorId) return mock.mockTasks;
    const allowedIds = new Set(
      mock.mockStudents.filter((s) => s.counselor_id === restrictToCounselorId).map((s) => s.id)
    );
    return mock.mockTasks.filter((t) => allowedIds.has(t.student_id));
  }

  const { data } = await supabase!.from("tasks").select("*").order("deadline");
  const tasks = (data as TaskItem[]) ?? [];
  if (!restrictToCounselorId) return tasks;

  // Tasks aren't tagged with a counselor directly — scope them through the
  // (already-scoped) student list instead of a second restricted query.
  const allowedIds = new Set((await getStudents()).map((s) => s.id));
  return tasks.filter((t) => allowedIds.has(t.student_id));
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
  // Fetch every student's progress/colleges/tasks in parallel instead of
  // one student, one field at a time — with N students this was 3*N+1
  // sequential round trips to Supabase, which is what made this page (and
  // the dashboard, which reads the same roster) feel slow once deployed.
  const rows = await Promise.all(
    students.map(async (student) => {
      const [progressRow, colleges, tasks] = await Promise.all([
        getProgress(student.id),
        getCollegeList(student.id),
        getTasks(student.id),
      ]);
      const progressPct = progressRow ? overallProgress(progressRow) : 0;
      const deadline = nextDeadline(colleges);
      return {
        student,
        progress: progressPct,
        status: trackStatusFromProgress(progressPct, deadline?.days ?? null),
        nextDeadline: deadline,
        pendingTasks: pendingTaskCount(tasks),
      };
    })
  );
  return rows;
}

export async function getHistoricalAdmissions(): Promise<HistoricalAdmission[]> {
  if (!isSupabaseConfigured) return mock.mockHistoricalAdmissions;
  const { data } = await supabase!.from("historical_admissions").select("*").order("university_name");
  return (data as HistoricalAdmission[]) ?? [];
}

export async function getHistoricalAdmissionsByUniversity(universityName: string): Promise<HistoricalAdmission[]> {
  const all = await getHistoricalAdmissions();
  const needle = universityName.trim().toLowerCase();
  return all.filter((r) => r.university_name.trim().toLowerCase() === needle);
}

export async function getCounselors(): Promise<Counselor[]> {
  if (!isSupabaseConfigured) return mock.mockCounselors;
  const { data } = await supabase!.from("counselors").select("*").order("name");
  return (data as Counselor[]) ?? mock.mockCounselors;
}
