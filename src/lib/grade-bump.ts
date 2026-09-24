import { supabaseAdmin, isAdminConfigured } from "./supabase-admin";

// The school year "flips" on Sept 1: from then through Aug 31 next year
// counts as the same school year. Used only as an idempotency label here
// (so a retried cron run, or the admin's manual button, can't double-bump
// everyone within the same year) — not used anywhere to derive a grade.
function currentSchoolYearLabel(d: Date): string {
  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();
  return month >= 9 ? String(year) : String(year - 1);
}

export interface GradeBumpResult {
  ok: boolean;
  skipped: boolean;
  bumped: number;
  runKey: string;
  reason?: string;
}

// Advances every active student one grade (8→9→10→11→12), capped at 12 —
// students already at 12 are left alone; when they actually graduate is a
// separate, manual decision (status field), not something this job infers.
// Safe to call more than once in the same school year: it no-ops after the
// first successful run, tracked in system_settings.
export async function bumpGradesForNewSchoolYear(now: Date = new Date()): Promise<GradeBumpResult> {
  const runKey = currentSchoolYearLabel(now);

  if (!isAdminConfigured) {
    return { ok: false, skipped: true, bumped: 0, runKey, reason: "Supabase 서비스 키가 설정되지 않았어요." };
  }

  const { data: setting } = await supabaseAdmin!
    .from("system_settings")
    .select("value")
    .eq("key", "last_grade_bump_year")
    .maybeSingle();

  if (setting?.value === runKey) {
    return { ok: true, skipped: true, bumped: 0, runKey, reason: "이번 학년도엔 이미 실행됐어요." };
  }

  const { data: students, error } = await supabaseAdmin!
    .from("students")
    .select("id, current_grade")
    .eq("status", "active")
    .gte("current_grade", 8)
    .lte("current_grade", 11);

  if (error) {
    return { ok: false, skipped: false, bumped: 0, runKey, reason: error.message };
  }

  let bumped = 0;
  for (const s of students ?? []) {
    const { error: updateError } = await supabaseAdmin!
      .from("students")
      .update({ current_grade: s.current_grade + 1 })
      .eq("id", s.id);
    if (!updateError) bumped++;
  }

  await supabaseAdmin!
    .from("system_settings")
    .upsert({ key: "last_grade_bump_year", value: runKey, updated_at: new Date().toISOString() });

  return { ok: true, skipped: false, bumped, runKey };
}
