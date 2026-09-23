import { getAllTasks, getStudents } from "@/lib/data";
import { addTask } from "@/lib/actions";
import { TASK_PRIORITY_LABEL, TASK_STATUS_LABEL } from "@/lib/labels";
import { TaskBoard, TaskWithStudent } from "@/components/tasks/TaskBoard";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-navy-500";

function StatCard({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "red" | "amber" | "neutral" }) {
  const toneClass = tone === "red" ? "text-rose-600" : tone === "amber" ? "text-amber-600" : "text-navy-900";
  return (
    <Card>
      <CardBody>
        <div className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</div>
        <div className={cn("mt-1 font-serif text-2xl font-semibold", toneClass)}>{value}</div>
      </CardBody>
    </Card>
  );
}

export default async function TasksPage() {
  const [tasks, students] = await Promise.all([getAllTasks(), getStudents()]);
  const nameById = new Map(students.map((s) => [s.id, s.english_name ?? s.student_name]));
  const tasksWithStudent: TaskWithStudent[] = tasks.map((t) => ({
    ...t,
    studentName: nameById.get(t.student_id) ?? "알 수 없음",
  }));

  const todayISO = new Date().toISOString().slice(0, 10);
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const in7ISO = in7Days.toISOString().slice(0, 10);

  const pendingCount = tasksWithStudent.filter((t) => t.status !== "Completed").length;
  const overdueCount = tasksWithStudent.filter((t) => t.deadline && t.deadline < todayISO && t.status !== "Completed").length;
  const dueSoonCount = tasksWithStudent.filter(
    (t) => t.deadline && t.deadline >= todayISO && t.deadline <= in7ISO && t.status !== "Completed"
  ).length;
  const completedCount = tasksWithStudent.filter((t) => t.status === "Completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-navy-900">할일</h1>
        <p className="text-sm text-navy-500">
          전체 학생의 할일을 우선순위·마감일별로 한눈에 확인하고, 카드를 드래그해서 상태를 바꾸세요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="진행 중인 할일" value={pendingCount} />
        <StatCard label="지연된 할일" value={overdueCount} tone="red" />
        <StatCard label="7일 내 마감" value={dueSoonCount} tone="amber" />
        <StatCard label="완료" value={completedCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>할일 추가</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={addTask} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}>학생 *</label>
              <select name="student_id" required defaultValue="" className={inputClass}>
                <option value="" disabled>선택</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.english_name ?? s.student_name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-1 lg:col-span-2">
              <label className={labelClass}>할일 내용 *</label>
              <input name="task" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>담당자</label>
              <input name="assigned_to" placeholder="예: 카운슬러, 학생" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>마감일</label>
              <input type="date" name="deadline" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>우선순위</label>
              <select name="priority" defaultValue="Medium" className={inputClass}>
                {(["High", "Medium", "Low"] as const).map((p) => (
                  <option key={p} value={p}>{TASK_PRIORITY_LABEL[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>상태</label>
              <select name="status" defaultValue="Not Started" className={inputClass}>
                {(["Not Started", "In Progress", "Waiting", "Completed"] as const).map((s) => (
                  <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className={labelClass}>메모</label>
              <input name="notes" className={inputClass} />
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-4">
              <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                + 할일 추가
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      <TaskBoard initialTasks={tasksWithStudent} todayISO={todayISO} />
    </div>
  );
}
