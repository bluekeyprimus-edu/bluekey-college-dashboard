"use client";

import { useState } from "react";
import { setNextAction } from "@/lib/actions";
import { cn } from "@/lib/cn";

// Inline-editable "Next Action" cell for the Dashboard's My Students
// table. Deliberately plain free text (see Student.next_action /
// setNextAction) — picking the single most important next step for a
// student takes human judgment, so this is the counselor typing it in,
// not a computed suggestion.
export function NextActionCell({ studentId, value }: { studentId: string; value: string | null }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="group flex items-start gap-2">
        <span className={cn("text-sm", value ? "font-medium text-navy-800" : "text-navy-400 italic")}>
          {value || "설정 필요"}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 text-xs text-navy-400 opacity-0 hover:text-gold-600 group-hover:opacity-100"
        >
          수정
        </button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        setSaving(true);
        setError(null);
        try {
          await setNextAction(studentId, (formData.get("next_action") as string) ?? "");
          setEditing(false);
        } catch (e) {
          setError(e instanceof Error ? e.message : "저장 실패");
        } finally {
          setSaving(false);
        }
      }}
      className="flex min-w-[180px] flex-col gap-1.5"
    >
      <textarea
        name="next_action"
        defaultValue={value ?? ""}
        rows={2}
        autoFocus
        disabled={saving}
        className="w-full rounded border border-navy-200 px-2 py-1 text-xs text-navy-900 focus:border-gold-400 focus:outline-none"
      />
      {error && <div className="text-xs text-rose-600">{error}</div>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="text-xs font-medium text-gold-600 hover:text-gold-700 disabled:opacity-50">
          {saving ? "저장 중..." : "저장"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          className="text-xs text-navy-400 hover:text-navy-600"
        >
          취소
        </button>
      </div>
    </form>
  );
}
