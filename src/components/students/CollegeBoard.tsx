"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ApplicationChecklist, CollegeCategory, CollegeListEntry } from "@/lib/types";
import { CHECKLIST_ITEM_LABEL, COLLEGE_CATEGORY_LABEL, APPLICATION_STATUS_OPTIONS, APPLICATION_STATUS_LABEL } from "@/lib/labels";
import { checklistCompletion } from "@/lib/progress";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { deleteCollegeFromList, toggleChecklistItem, updateCollegeCategory, updateCollegeStatus } from "@/lib/actions";

const CATEGORIES: CollegeCategory[] = ["Reach", "High Target", "Target", "Likely", "Safety"];

type ChecklistKey = keyof Omit<ApplicationChecklist, "college_list_id">;

const CHECKLIST_KEYS: ChecklistKey[] = [
  "college_added",
  "major_selected",
  "common_app_profile",
  "activities",
  "honors",
  "personal_statement",
  "supplemental_essays",
  "counselor_recommendation",
  "teacher_recommendation_1",
  "teacher_recommendation_2",
  "transcript",
  "test_scores_submission",
  "financial_aid",
  "application_submitted",
];

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-2 py-1 text-xs text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-navy-400";

function CollegeCard({
  college,
  studentId,
  expanded,
  onToggleExpand,
  onToggleChecklist,
  onDelete,
}: {
  college: CollegeListEntry;
  studentId: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleChecklist: (field: ChecklistKey, value: boolean) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: college.id });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };
  const pct = checklistCompletion(college.checklist);

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-navy-100 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none select-none text-sm text-navy-300 hover:text-navy-500 active:cursor-grabbing"
          title="드래그해서 분류 이동"
        >
          ⠿
        </button>
        <button type="button" onClick={onToggleExpand} className="flex-1 text-left">
          <div className="text-sm font-semibold text-navy-900">{college.university_name}</div>
          <div className="text-xs text-navy-400">
            {college.intended_major ?? "전공 미정"}
            {college.application_round && ` · ${college.application_round}`}
          </div>
        </button>
        <button type="button" onClick={onDelete} className="shrink-0 text-xs text-navy-300 hover:text-rose-500">
          ✕
        </button>
      </div>

      <div className="mt-2">
        <ProgressBar value={pct} size="sm" showLabel />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Pill tone={pct === 100 ? "green" : "neutral"}>{APPLICATION_STATUS_LABEL[college.application_status] ?? college.application_status}</Pill>
        {college.application_deadline && <Pill tone="amber">마감 {college.application_deadline}</Pill>}
      </div>

      {expanded && (
        <div className="mt-3 space-y-4 border-t border-navy-100 pt-3">
          <form action={updateCollegeStatus.bind(null, studentId, college.id)} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>지원 라운드</label>
                <select name="application_round" defaultValue={college.application_round ?? ""} className={inputClass}>
                  <option value="">미정</option>
                  {["ED", "ED2", "EA", "REA", "RD"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>마감일</label>
                <input type="date" name="application_deadline" defaultValue={college.application_deadline ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>진행 상태</label>
                <select name="application_status" defaultValue={college.application_status} className={inputClass}>
                  {APPLICATION_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{APPLICATION_STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>학생 선호도</label>
                <select name="student_preference_level" defaultValue={college.student_preference_level ?? ""} className={inputClass}>
                  <option value="">미정</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} / 5</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>학부모 선호도</label>
                <select name="parent_preference_level" defaultValue={college.parent_preference_level ?? ""} className={inputClass}>
                  <option value="">미정</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} / 5</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>카운슬러 추천 코멘트</label>
              <textarea name="counselor_recommendation" defaultValue={college.counselor_recommendation ?? ""} rows={2} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>메모</label>
              <textarea name="notes" defaultValue={college.notes ?? ""} rows={2} className={inputClass} />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="rounded-md border border-navy-200 px-3 py-1 text-xs font-medium text-navy-700 hover:bg-navy-50">
                저장
              </button>
            </div>
          </form>

          <div>
            <div className={labelClass}>지원 체크리스트 ({pct}%)</div>
            <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
              {CHECKLIST_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-1.5 text-xs text-navy-700">
                  <input
                    type="checkbox"
                    checked={college.checklist?.[key] ?? false}
                    onChange={(e) => onToggleChecklist(key, e.target.checked)}
                  />
                  {CHECKLIST_ITEM_LABEL[key]}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Column({
  category,
  colleges,
  studentId,
  expandedId,
  onToggleExpand,
  onToggleChecklist,
  onDelete,
}: {
  category: CollegeCategory;
  colleges: CollegeListEntry[];
  studentId: string;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onToggleChecklist: (collegeId: string, field: ChecklistKey, value: boolean) => void;
  onDelete: (collegeId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: category });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[160px] flex-col rounded-xl border p-3 transition-colors",
        isOver ? "border-gold-300 bg-gold-50/50" : "border-navy-100 bg-navy-50/40"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-navy-500">{COLLEGE_CATEGORY_LABEL[category]}</span>
        <span className="text-xs text-navy-400">{colleges.length}</span>
      </div>
      <div className="space-y-2">
        {colleges.map((c) => (
          <CollegeCard
            key={c.id}
            college={c}
            studentId={studentId}
            expanded={expandedId === c.id}
            onToggleExpand={() => onToggleExpand(c.id)}
            onToggleChecklist={(field, value) => onToggleChecklist(c.id, field, value)}
            onDelete={() => onDelete(c.id)}
          />
        ))}
        {colleges.length === 0 && (
          <div className="rounded-lg border border-dashed border-navy-200 p-3 text-center text-xs text-navy-300">
            여기로 드래그하세요
          </div>
        )}
      </div>
    </div>
  );
}

export function CollegeBoard({ studentId, initialColleges }: { studentId: string; initialColleges: CollegeListEntry[] }) {
  const [colleges, setColleges] = useState(initialColleges);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const collegeId = String(active.id);
    const newCategory = over.id as CollegeCategory;
    const college = colleges.find((c) => c.id === collegeId);
    if (!college || college.category === newCategory) return;

    const prevCategory = college.category;
    setColleges((prev) => prev.map((c) => (c.id === collegeId ? { ...c, category: newCategory } : c)));
    startTransition(() => {
      updateCollegeCategory(studentId, collegeId, newCategory).catch(() => {
        setColleges((prev) => prev.map((c) => (c.id === collegeId ? { ...c, category: prevCategory } : c)));
      });
    });
  }

  function handleToggleChecklist(collegeId: string, field: ChecklistKey, value: boolean) {
    setColleges((prev) =>
      prev.map((c) => (c.id === collegeId && c.checklist ? { ...c, checklist: { ...c.checklist, [field]: value } } : c))
    );
    startTransition(() => {
      toggleChecklistItem(studentId, collegeId, field, value);
    });
  }

  function handleDelete(collegeId: string) {
    if (!confirm("이 대학을 리스트에서 삭제할까요?")) return;
    setColleges((prev) => prev.filter((c) => c.id !== collegeId));
    if (expandedId === collegeId) setExpandedId(null);
    startTransition(() => {
      deleteCollegeFromList(studentId, collegeId);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {CATEGORIES.map((cat) => (
          <Column
            key={cat}
            category={cat}
            colleges={colleges.filter((c) => c.category === cat)}
            studentId={studentId}
            expandedId={expandedId}
            onToggleExpand={(id) => setExpandedId((prev) => (prev === id ? null : id))}
            onToggleChecklist={handleToggleChecklist}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </DndContext>
  );
}
