// Grade 8-11 Goal Setting — Time Progress / Goal Progress / on-track
// computation for Annual Counseling Goals and their Milestones. See
// supabase/schema.sql's counseling_goals/goal_milestones tables and
// src/lib/types.ts's CounselingGoal/GoalMilestone.
//
// Two deliberately separate numbers per goal (never conflated — see
// Jacob's spec): Time Progress is purely calendar math (how much of the
// start->target window has elapsed), Goal Progress is purely milestone
// completion. Time passing never bumps Goal Progress on its own.
import { CounselingGoal, GoalCategory, GoalMilestone, TrackIndicator } from "./types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** % of the goal's start_date -> target_completion_date window that has
 * elapsed, clamped to [0, 100]. Null if either date is missing. */
export function timeProgress(goal: CounselingGoal, asOf: string = todayIso()): number | null {
  if (!goal.start_date || !goal.target_completion_date) return null;
  const start = new Date(goal.start_date).getTime();
  const end = new Date(goal.target_completion_date).getTime();
  const now = new Date(asOf).getTime();
  if (end <= start) return null;
  const pct = ((now - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/** % of this goal's own milestones that are Completed. A goal manually
 * marked Completed is always 100% regardless of its milestones (the
 * counselor's own call wins); a goal with no milestones yet is 0%, never
 * null — so it still plots on a progress bar instead of vanishing. */
export function goalProgress(goal: CounselingGoal, milestones: GoalMilestone[]): number {
  if (goal.status === "Completed") return 100;
  const own = milestones.filter((m) => m.goal_id === goal.id);
  if (own.length === 0) return 0;
  const completed = own.filter((m) => m.status === "Completed").length;
  return Math.round((completed / own.length) * 100);
}

/** The 🟢/🟡/🔴 on-track indicator — the counselor's track_override wins
 * when set. Otherwise compared from Goal Progress vs Time Progress: within
 * 10pts (or ahead) = on_track, within 30pts behind = behind, more than
 * 30pts behind = needs_attention. Null when there isn't enough data to
 * judge (missing dates) or the goal is On Hold / already Completed (no
 * useful "behind schedule" signal either way). */
export function trackIndicator(goal: CounselingGoal, milestones: GoalMilestone[]): TrackIndicator | null {
  if (goal.track_override) return goal.track_override;
  if (goal.status === "Completed") return "on_track";
  if (goal.status === "On Hold") return null;
  const time = timeProgress(goal);
  if (time === null) return null;
  const progress = goalProgress(goal, milestones);
  const diff = progress - time;
  if (diff >= -10) return "on_track";
  if (diff >= -30) return "behind";
  return "needs_attention";
}

/** Milestones past their due date and not yet Completed. */
export function overdueMilestones(milestones: GoalMilestone[], asOf: string = todayIso()): GoalMilestone[] {
  return milestones.filter((m) => m.due_date !== null && m.due_date < asOf && m.status !== "Completed");
}

/** Simple average of every goal's own Goal Progress — the plan's Overall
 * Counseling Progress headline number. */
export function overallGoalProgress(goals: CounselingGoal[], milestones: GoalMilestone[]): number | null {
  if (goals.length === 0) return null;
  const sum = goals.reduce((acc, g) => acc + goalProgress(g, milestones), 0);
  return Math.round(sum / goals.length);
}

/** Average Goal Progress per category, for the "Academic — 75% / Testing —
 * 50% / ..." breakdown. Only categories with at least one goal appear. */
export function progressByCategory(goals: CounselingGoal[], milestones: GoalMilestone[]): { category: GoalCategory; progress: number }[] {
  const byCategory = new Map<GoalCategory, CounselingGoal[]>();
  for (const g of goals) {
    byCategory.set(g.category, [...(byCategory.get(g.category) ?? []), g]);
  }
  return Array.from(byCategory.entries()).map(([category, categoryGoals]) => ({
    category,
    progress: Math.round(categoryGoals.reduce((acc, g) => acc + goalProgress(g, milestones), 0) / categoryGoals.length),
  }));
}

/** Groups every milestone across a plan's goals by due-month ("2026-09"),
 * sorted chronologically, for the Monthly Roadmap. Milestones with no
 * due_date are returned separately under `unscheduled`. */
export function monthlyRoadmap(
  goals: CounselingGoal[],
  milestones: GoalMilestone[]
): { month: string; items: { milestone: GoalMilestone; goal: CounselingGoal }[] }[] {
  const goalById = new Map(goals.map((g) => [g.id, g]));
  const byMonth = new Map<string, { milestone: GoalMilestone; goal: CounselingGoal }[]>();
  for (const m of milestones) {
    if (!m.due_date) continue;
    const goal = goalById.get(m.goal_id);
    if (!goal) continue;
    const month = m.due_date.slice(0, 7);
    byMonth.set(month, [...(byMonth.get(month) ?? []), { milestone: m, goal }]);
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, items]) => ({ month, items: items.sort((a, b) => ((a.milestone.due_date ?? "") < (b.milestone.due_date ?? "") ? -1 : 1)) }));
}

export function monthLabelKorean(month: string): string {
  const [year, m] = month.split("-");
  return `${year}년 ${Number(m)}월`;
}
