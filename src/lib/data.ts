import { supabase, isSupabaseConfigured } from "./supabase";
import * as mock from "./mock-data";
import { getCounselorRestriction, getCurrentCounselor } from "./current-counselor";
import {
  Student,
  StudentProgress,
  AcademicOverview,
  GradeRecord,
  Term,
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
  StudentFinance,
  StudentExpense,
  StudentAccess,
} from "./types";

// Thin data-access layer. When NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are set
// (see lib/supabase.ts) every function reads from the real Supabase tables;
// otherwise it falls back to mock-data.ts so the UI never blocks on Supabase
// being configured.

type StudentRow = Omit<Student, "counselor_name"> & {
  counselors: { name: string } | null;
};

export async function getStudents(): Promise<Student[]> {
  // Non-admin counselors only ever see students they hold SOME role on —
  // general counselor, application lead, or EC coordinator. This is the
  // single choke point every /students/[id]/** sub-page reads through
  // (via getStudent below), so it locks down the whole per-student area,
  // not just the roster list. It only decides "do they have any access at
  // all" — which of the three roles they actually hold (and therefore
  // which sections they may see/edit) is getStudentAccess()'s job.
  const restrictToCounselorId = await getCounselorRestriction();

  if (!isSupabaseConfigured) {
    const rows = mock.mockStudents;
    return restrictToCounselorId
      ? rows.filter(
          (s) =>
            s.counselor_id === restrictToCounselorId ||
            s.application_counselor_id === restrictToCounselorId ||
            s.ec_counselor_id === restrictToCounselorId
        )
      : rows;
  }
  // counselors!counselor_id(...) disambiguates which of the three student->counselors
  // foreign keys (counselor_id / application_counselor_id / ec_counselor_id) this embed
  // means — with all three pointing at the same table, a plain "counselors(name)" is an
  // ambiguous embed that PostgREST rejects, which silently fell back to mock data below.
  let query = supabase!.from("students").select("*, counselors!counselor_id(name)").order("student_name");
  if (restrictToCounselorId) {
    query = query.or(
      `counselor_id.eq.${restrictToCounselorId},application_counselor_id.eq.${restrictToCounselorId},ec_counselor_id.eq.${restrictToCounselorId}`
    );
  }
  const { data, error } = await query;
  // A real Supabase/PostgREST error used to fall back to mock data here —
  // which is how the ambiguous-embed bug above went unnoticed: the roster
  // silently became 5 fake students instead of failing loudly. Any error
  // this configured-Supabase branch hits now is a real one, so it throws
  // and surfaces in src/app/error.tsx instead of being hidden as mock data.
  if (error) throw new Error(`학생 목록을 불러오지 못했어요: ${error.message}`);
  if (!data) throw new Error("학생 목록을 불러오지 못했어요: 알 수 없는 오류");
  return (data as unknown as StudentRow[]).map((row) => ({
    ...row,
    counselor_name: row.counselors?.name,
  })) as Student[];
}

export async function getStudent(id: string): Promise<Student | null> {
  const students = await getStudents();
  return students.find((s) => s.id === id) ?? null;
}

// Which sections of ONE student the acting counselor may see/edit. Unlike
// getStudent (which only answers "do they have any access at all"), this
// tells apart the three roles so a page can show/allow only the section
// that role actually owns. Returns null in exactly the same situations
// getStudent would return null (admin bypasses everything; a non-counselor
// session — parent, unauthenticated — is treated as unrestricted here too,
// matching getCounselorRestriction's contract: access for those is enforced
// elsewhere, by middleware/page checks, not by this data layer).
export async function getStudentAccess(studentId: string): Promise<StudentAccess | null> {
  const actingCounselor = await getCurrentCounselor();
  if (!actingCounselor || actingCounselor.isAdmin) {
    return { canViewAll: true, canViewEc: true, canViewApplication: true };
  }

  if (!isSupabaseConfigured) {
    const row = mock.mockStudents.find((s) => s.id === studentId);
    if (!row) return null;
    const canViewAll = row.counselor_id === actingCounselor.id;
    const canViewEc = canViewAll || row.ec_counselor_id === actingCounselor.id;
    const canViewApplication = canViewAll || row.application_counselor_id === actingCounselor.id;
    if (!canViewAll && !canViewEc && !canViewApplication) return null;
    return { canViewAll, canViewEc, canViewApplication };
  }

  const { data } = await supabase!
    .from("students")
    .select("counselor_id, application_counselor_id, ec_counselor_id")
    .eq("id", studentId)
    .maybeSingle();
  if (!data) return null;
  const canViewAll = data.counselor_id === actingCounselor.id;
  const canViewEc = canViewAll || data.ec_counselor_id === actingCounselor.id;
  const canViewApplication = canViewAll || data.application_counselor_id === actingCounselor.id;
  if (!canViewAll && !canViewEc && !canViewApplication) return null;
  return { canViewAll, canViewEc, canViewApplication };
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

export async function getGradeRecords(studentId: string): Promise<GradeRecord[]> {
  if (!isSupabaseConfigured) return mock.mockGradeRecords.filter((g) => g.student_id === studentId);
  const { data } = await supabase!.from("grade_records").select("*").eq("student_id", studentId).order("grade_level");
  return (data as GradeRecord[]) ?? [];
}

export async function getTerms(studentId: string): Promise<Term[]> {
  if (!isSupabaseConfigured) return mock.mockTerms.filter((t) => t.student_id === studentId);
  const { data } = await supabase!.from("terms").select("*").eq("student_id", studentId).order("term_number");
  return (data as Term[]) ?? [];
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

// ============================================================
// Finance (admin-only profitability tracking) — always fetched all-at-once
// for the /finance overview, never per student, to avoid an N+1 fetch.
// ============================================================
export async function getLastGradeBumpYear(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase!.from("system_settings").select("value").eq("key", "last_grade_bump_year").maybeSingle();
  return data?.value ?? null;
}

export async function getAllStudentFinances(): Promise<StudentFinance[]> {
  if (!isSupabaseConfigured) return mock.mockStudentFinances;
  const { data } = await supabase!.from("student_finances").select("*");
  return (data as StudentFinance[]) ?? [];
}

export async function getAllStudentExpenses(): Promise<StudentExpense[]> {
  if (!isSupabaseConfigured) return mock.mockStudentExpenses;
  const { data } = await supabase!.from("student_expenses").select("*");
  return (data as StudentExpense[]) ?? [];
}

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
  // Latest consultation_notes.meeting_date for this student (any
  // counselor), or null if none logged yet — shown as "Last Counseling
  // Date" on the Dashboard's My Students table.
  lastCounselingDate: string | null;
  // Plain-language reasons this student needs attention right now (empty
  // when none apply) — feeds the Dashboard's Attention Needed panel.
  attentionFlags: import("./progress").AttentionFlag[];
  // Every upcoming application/task deadline for this student — feeds the
  // Dashboard's Upcoming Deadlines panel (flattened across the roster).
  deadlineItems: import("./progress").DeadlineItem[];
  // Summary-only snapshots for the My Students table's per-row drill-down
  // — full detail always stays on the student's own page.
  academicSnapshot: import("./snapshots").AcademicSnapshot;
  ecSnapshot: import("./snapshots").EcSnapshot;
  collegeListSnapshot: import("./snapshots").CollegeListSnapshot;
  // Only meaningful (and only computed) for grade 12 — null otherwise.
  applicationStatusSnapshot: import("./snapshots").ApplicationStatusSnapshot | null;
}

export async function getRosterRows(): Promise<RosterRow[]> {
  const { overallProgress, nextDeadline, pendingTaskCount, trackStatusFromProgress, computeAttentionFlags, overdueTaskCount, collectDeadlineItems } =
    await import("./progress");
  const { computeAcademicSnapshot, computeEcSnapshot, computeCollegeListSnapshot, computeApplicationStatusSnapshot } = await import("./snapshots");
  const students = await getStudents();
  // Fetch every student's progress/colleges/tasks/notes/academics/ECs in
  // parallel instead of one student, one field at a time — with N
  // students this was already 3*N+1 sequential round trips to Supabase
  // before the snapshot fields below, which is what made this page (and
  // the dashboard, which reads the same roster) feel slow once deployed.
  const rows = await Promise.all(
    students.map(async (student) => {
      const [progressRow, colleges, tasks, notes, gradeRecords, terms, courses, ecs] = await Promise.all([
        getProgress(student.id),
        getCollegeList(student.id),
        getTasks(student.id),
        getConsultationNotes(student.id),
        getGradeRecords(student.id),
        getTerms(student.id),
        getCourses(student.id),
        getExtracurriculars(student.id),
      ]);
      const progressPct = progressRow ? overallProgress(progressRow, student.current_grade) : 0;
      const deadline = nextDeadline(colleges);
      const lastCounselingDate = notes.reduce<string | null>(
        (latest, n) => (!latest || n.meeting_date > latest ? n.meeting_date : latest),
        null
      );
      const pendingTasks = pendingTaskCount(tasks);
      const overdueTasks = overdueTaskCount(tasks);
      const collegeListSnapshot = computeCollegeListSnapshot(colleges, student.current_grade);

      const attentionFlags = computeAttentionFlags({
        nextDeadlineDays: deadline?.days ?? null,
        progress: progressPct,
        pendingTasks,
        overdueTasks,
      });
      // College-list alerts (no safety school, too reach-heavy, no early
      // round picked) are exactly the kind of problem this panel exists
      // to surface, so fold them in alongside the deadline/progress flags.
      for (const alert of collegeListSnapshot.alerts) {
        attentionFlags.push({ severity: "yellow", label: alert });
      }

      return {
        student,
        progress: progressPct,
        status: trackStatusFromProgress(progressPct, deadline?.days ?? null),
        nextDeadline: deadline,
        pendingTasks,
        lastCounselingDate,
        attentionFlags,
        deadlineItems: collectDeadlineItems(student.id, student.english_name ?? student.student_name, colleges, tasks),
        academicSnapshot: computeAcademicSnapshot(gradeRecords, terms, courses),
        ecSnapshot: computeEcSnapshot(ecs),
        collegeListSnapshot,
        applicationStatusSnapshot: student.current_grade === 12 ? computeApplicationStatusSnapshot(colleges) : null,
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
