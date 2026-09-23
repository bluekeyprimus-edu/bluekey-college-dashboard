"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { DndContext, DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TaskItem, TaskPriority, TaskStatus } from "@/lib/types";
import { TASK_PRIORITY_LABEL, TASK_STATUS_LABEL } from "@/lib/labels";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { deleteTask, updateTask, updateTaskStatus } from "@/lib/actions";

export interface TaskWithStudent extends TaskItem {
  studentName: string;
}

const STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Waiting", "Completed"];
const PRIORITY_WEIGHT: Record<TaskPriority, number> = { High: 3, Medium: 2, Low: 1 };
const PRIORITY_TONE: Record<TaskPriority, "red" | "amber" | "neutral"> = { High: "red", Medium: "amber", Low: "neutral" };

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-2 py-1 text-xs text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-navy-400";

function sortTasks(tasks: TaskWithStudent[]): TaskWithStudent[] {
  return [...tasks].sort((a, b) => {
    const pw = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (pw !== 0) return pw;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });
}

function TaskCard({
  task,
  todayISO,
  expanded,
  onToggleExpand,
  onDelete,
}: {
  task: TaskWithStudent;
  todayISO: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
  const overdue = !!task.deadline && task.deadline < todayISO && task.status !== "Completed";

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-navy-100 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none select-none text-sm text-navy-300 hover:text-navy-500 active:cursor-grabbing"
          title="드래그해서 상태 이동"
        >
          ⠿
        </button>
        <button type="button" onClick={onToggleExpand} className="flex-1 text-left">
          <div className="text-sm font-medium text-navy-900">{task.task}</div>
          <Link
            href={`/students/${task.student_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-gold-600 hover:text-gold-700"
          >
            {task.studentName}
          </Link>
        </button>
        <button type="button" onClick={onDelete} className="shrink-0 text-xs text-navy-300 hover:text-rose-500">
          ✕
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Pill tone={PRIORITY_TONE[task.priority]}>{TASK_PRIORITY_LABEL[task.priority]}</Pill>
        {task.deadline && <Pill tone={overdue ? "red" : "neutral"}>{overdue ? `지연 · ${task.deadline}` : task.deadline}</Pill>}
        {task.assigned_to && <Pill tone="neutral">담당: {task.assigned_to}</Pill>}
      </div>

      {expanded && (
        <form action={updateTask.bind(null, task.id)} className="mt-3 space-y-2 border-t border-navy-100 pt-3">
          <div>
            <label className={labelClass}>할일 내용 *</label>
            <input name="task" required defaultValue={task.task} className={inputClass} />
          </div>
          <input type="hidden" name="student_id" value={task.student_id} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>담당자</label>
              <input name="assigned_to" defaultValue={task.assigned_to ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>마감일</label>
              <input type="date" name="deadline" defaultValue={task.deadline ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>우선순위</label>
              <select name="priority" defaultValue={task.priority} className={inputClass}>
                {(["High", "Medium", "Low"] as const).map((p) => (
                  <option key={p} value={p}>{TASK_PRIORITY_LABEL[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>상태</label>
              <select name="status" defaultValue={task.status} className={inputClass}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>메모</label>
            <textarea name="notes" rows={2} defaultValue={task.notes ?? ""} className={inputClass} />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="rounded-md border border-navy-200 px-3 py-1 text-xs font-medium text-navy-700 hover:bg-navy-50">
              저장
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Column({
  status,
  tasks,
  todayISO,
  expandedId,
  onToggleExpand,
  onDelete,
}: {
  status: TaskStatus;
  tasks: TaskWithStudent[];
  todayISO: string;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[160px] flex-col rounded-xl border p-3 transition-colors",
        isOver ? "border-gold-300 bg-gold-50/50" : "border-navy-100 bg-navy-50/40"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-navy-500">{TASK_STATUS_LABEL[status]}</span>
        <span className="text-xs text-navy-400">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {sortTasks(tasks).map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            todayISO={todayISO}
            expanded={expandedId === t.id}
            onToggleExpand={() => onToggleExpand(t.id)}
            onDelete={() => onDelete(t.id)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-lg border border-dashed border-navy-200 p-3 text-center text-xs text-navy-300">비어있음</div>
        )}
      </div>
    </div>
  );
}

export function TaskBoard({ initialTasks, todayISO }: { initialTasks: TaskWithStudent[]; todayISO: string }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const taskId = String(active.id);
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const prevStatus = task.status;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    startTransition(() => {
      updateTaskStatus(taskId, newStatus).catch(() => {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t)));
      });
    });
  }

  function handleDelete(taskId: string) {
    if (!confirm("이 할일을 삭제할까요?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (expandedId === taskId) setExpandedId(null);
    startTransition(() => {
      deleteTask(taskId);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
            todayISO={todayISO}
            expandedId={expandedId}
            onToggleExpand={(id) => setExpandedId((prev) => (prev === id ? null : id))}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </DndContext>
  );
}
