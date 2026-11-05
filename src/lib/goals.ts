// Grade 8-11 Counseling Plan progress — a Plan's progress is just a flat
// checklist of to-do items (PlanTask), done or not. No categories,
// priorities, dates, or on-track math (an earlier, more elaborate
// Goal/Milestone design was replaced with this per Jacob's request — the
// old counseling_goals/goal_milestones tables are left in place in
// supabase/schema.sql, unused, so no data is lost).
import { PlanTask } from "./types";

/** % of a plan's to-do items marked done. Null (not 0) when the plan has
 * no items yet, so it reads as "nothing to show" rather than "0% done". */
export function planTaskProgress(tasks: PlanTask[]): number | null {
  if (tasks.length === 0) return null;
  const done = tasks.filter((t) => t.is_done).length;
  return Math.round((done / tasks.length) * 100);
}
