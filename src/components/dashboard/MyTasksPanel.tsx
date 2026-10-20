import Link from "next/link";
import { TaskWithStudent } from "@/components/tasks/TaskBoard";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { TASK_PRIORITY_LABEL, TASK_STATUS_LABEL } from "@/lib/labels";
import { TaskPriority } from "@/lib/types";
import { cn } from "@/lib/cn";

const PRIORITY_TONE: Record<TaskPriority, "red" | "amber" | "neutral"> = { High: "red", Medium: "amber", Low: "neutral" };

// Already scoped to "my" tasks by the caller (getAllTasks() applies the
// same counselor restriction as the roster — see data.ts), so this just
// displays the pending ones, nearest deadline first. A compact snapshot,
// not the full board — that's /tasks (drag-to-update-status etc.).
export function MyTasksPanel({ tasks }: { tasks: TaskWithStudent[] }) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const pending = [...tasks]
    .filter((t) => t.status !== "Completed")
    .sort((a, b) => (a.deadline ?? "9999") < (b.deadline ?? "9999") ? -1 : 1)
    .slice(0, 12);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-100 px-5 py-4">
        <h2 className="font-serif text-lg font-semibold text-navy-900">My Tasks</h2>
        <Link href="/tasks" className="text-sm font-medium text-gold-600 hover:text-gold-700">
          전체 할일 보기 →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead className="border-b border-navy-100 bg-navy-50/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">할일</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">학생</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">마감일</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">우선순위</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {pending.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-sm text-navy-400">지금은 미완료 할일이 없어요.</td>
              </tr>
            )}
            {pending.map((t) => {
              const overdue = !!t.deadline && t.deadline < todayISO;
              return (
                <tr key={t.id} className="hover:bg-navy-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/students/${t.student_id}#tasks`} className="font-medium text-navy-900 hover:text-gold-600">
                      {t.task}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy-600">{t.studentName}</td>
                  <td className={cn("px-4 py-3 text-sm", overdue ? "font-semibold text-rose-600" : "text-navy-600")}>
                    {t.deadline ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={PRIORITY_TONE[t.priority]}>{TASK_PRIORITY_LABEL[t.priority] ?? t.priority}</Pill>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy-600">{TASK_STATUS_LABEL[t.status] ?? t.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
