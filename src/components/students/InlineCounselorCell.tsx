"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStudentCounselors } from "@/lib/actions";

// Inline "담당 카운슬러" editor for the /students roster table — lets an
// admin add or remove a counselor on a student directly from the list,
// without opening that student's Edit page. Non-admins keep seeing the
// plain read-only name list (same as before this existed).
export function InlineCounselorCell({
  studentId,
  counselorIds,
  counselors,
  isAdmin,
}: {
  studentId: string;
  counselorIds: string[];
  counselors: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [ids, setIds] = useState(counselorIds);
  const [pending, startTransition] = useTransition();

  const assigned = counselors.filter((c) => ids.includes(c.id));

  if (!isAdmin) {
    return <span className="text-sm text-navy-600">{assigned.map((c) => c.name).join(", ") || "—"}</span>;
  }

  const available = counselors.filter((c) => !ids.includes(c.id));

  function commit(next: string[]) {
    const previous = ids;
    setIds(next);
    startTransition(async () => {
      try {
        await setStudentCounselors(studentId, next);
        router.refresh();
      } catch (e) {
        setIds(previous);
        alert("변경 실패: " + (e instanceof Error ? e.message : String(e)));
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {assigned.map((c) => (
        <span
          key={c.id}
          className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-xs text-navy-700"
        >
          {c.name}
          <button
            type="button"
            disabled={pending}
            onClick={() => commit(ids.filter((id) => id !== c.id))}
            className="text-navy-400 hover:text-rose-600 disabled:opacity-50"
            aria-label={`${c.name} 제거`}
          >
            ×
          </button>
        </span>
      ))}
      {available.length > 0 && (
        <select
          value=""
          disabled={pending}
          onChange={(e) => {
            if (e.target.value) commit([...ids, e.target.value]);
          }}
          className="rounded-md border border-navy-200 bg-white px-1.5 py-0.5 text-xs text-navy-500 focus:border-gold-400 focus:outline-none"
        >
          <option value="">+ 추가</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
