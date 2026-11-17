"use client";

import { useState } from "react";
import { SCHOOL_TYPE_OPTIONS } from "@/lib/labels";

// "직접입력" is its own option inside the dropdown itself (not a separate
// button below it, which Jacob found easy to miss / think was missing
// under the open native dropdown) — picking it swaps the <select> for a
// free-text <input> right away.
export function SchoolTypeField({ defaultValue, className }: { defaultValue: string; className: string }) {
  const isPreset = (SCHOOL_TYPE_OPTIONS as readonly string[]).includes(defaultValue);
  const [custom, setCustom] = useState(defaultValue !== "" && !isPreset);

  if (custom) {
    return (
      <div className="space-y-1">
        <input name="school_type" defaultValue={defaultValue} placeholder="직접 입력" className={className} />
        <button type="button" onClick={() => setCustom(false)} className="text-[11px] font-medium text-navy-400 hover:text-navy-600">
          ← 목록에서 선택하기
        </button>
      </div>
    );
  }

  return (
    <select
      name="school_type"
      defaultValue={defaultValue}
      onChange={(e) => {
        if (e.target.value === "__custom__") setCustom(true);
      }}
      className={className}
    >
      <option value="" disabled>
        선택
      </option>
      {SCHOOL_TYPE_OPTIONS.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
      <option value="__custom__">직접입력</option>
    </select>
  );
}
