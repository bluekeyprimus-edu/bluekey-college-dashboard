"use client";

import { useState } from "react";
import { SCHOOL_TYPE_OPTIONS } from "@/lib/labels";

// A plain HTML <input list="..."> + <datalist> looked like the simplest
// way to offer "pick from a list OR type your own", but native datalist
// filters its suggestion dropdown by the input's CURRENT text — so
// editing a student whose 학교유형 is already "Private" showed only
// "Private" as a suggestion (it's the only option matching itself),
// making it look like the other six had vanished. This toggles between
// a real <select> (always shows the full list) and a free-text <input>
// instead, so there's no filtering surprise either way.
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
    <div className="space-y-1">
      <select name="school_type" defaultValue={defaultValue} className={className}>
        <option value="">선택 안 함</option>
        {SCHOOL_TYPE_OPTIONS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <button type="button" onClick={() => setCustom(true)} className="text-[11px] font-medium text-navy-400 hover:text-navy-600">
        직접 입력하기
      </button>
    </div>
  );
}
