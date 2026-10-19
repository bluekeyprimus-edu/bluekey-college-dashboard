import { getRosterRows, getAllTasks, getStudents } from "@/lib/data";
import { getCounselorRestriction } from "@/lib/current-counselor";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { MyTasksPanel } from "@/components/dashboard/MyTasksPanel";
import { TaskWithStudent } from "@/components/tasks/TaskBoard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [rows, restricted, tasks, students] = await Promise.all([
    getRosterRows(),
    getCounselorRestriction(),
    getAllTasks(),
    getStudents(),
  ]);

  const nameById = new Map(students.map((s) => [s.id, s.english_name ?? s.student_name]));
  const tasksWithStudent: TaskWithStudent[] = tasks.map((t) => ({
    ...t,
    studentName: nameById.get(t.student_id) ?? "알 수 없음",
  }));

  return (
    <div className="space-y-6">
      <DashboardOverview rows={rows} restricted={!!restricted} />
      <MyTasksPanel tasks={tasksWithStudent} />
    </div>
  );
}
