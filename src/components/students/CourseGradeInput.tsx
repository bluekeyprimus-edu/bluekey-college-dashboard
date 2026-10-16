"use client";

import { useState } from "react";
import { LETTER_GRADE_OPTIONS, GRADE_SCALE_OPTIONS } from "@/lib/labels";

/**
 * Lets a counselor pick how a course's grade was recorded (Letter Grade /
 * 100-point / a free-text custom grade like "Pass") and shows only the
 * matching input. Grade scale picks which column actually feeds the GPA
 * calculation in src/lib/gpa.ts — "custom" grades are shown as-is but
 * never counted.
 */
export function CourseGradeInput({ inputClass, labelClass }: { inputClass: string; labelClass: string }) {
  const [scale, setScale] = useState<"letter" | "100_point" | "custom">("letter");

  return (
    <>
      <div>
        <label className={labelClass}>성적 입력 방식</label>
        <select
          name="grade_scale"
          value={scale}
          onChange={(e) => setScale(e.target.value as typeof scale)}
          className={inputClass}
        >
          {GRADE_SCALE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>성적 *</label>
        {scale === "letter" && (
          <select name="letter_grade" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              선택
            </option>
            {LETTER_GRADE_OPTIONS.map((lg) => (
              <option key={lg} value={lg}>
                {lg}
              </option>
            ))}
          </select>
        )}
        {scale === "100_point" && (
          <input type="number" step="0.1" min={0} max={100} name="point_score" required className={inputClass} placeholder="예: 94" />
        )}
        {scale === "custom" && (
          <input name="custom_grade" required className={inputClass} placeholder="예: Pass, 수료" />
        )}
      </div>
    </>
  );
}
