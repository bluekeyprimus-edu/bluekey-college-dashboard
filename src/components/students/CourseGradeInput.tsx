import { GRADE_SCALE_OPTIONS } from "@/lib/labels";

/**
 * Lets a counselor pick how a course's grade will be recorded (Letter
 * Grade / 100-point / a free-text custom grade like "Pass"). Courses are
 * registered grade-free — this just sets which scale this course's
 * Progress and Final grades will later use (grade_scale picks which
 * column feeds the GPA calculation in src/lib/gpa.ts; "custom" grades are
 * shown as-is but never counted).
 */
export function CourseGradeInput({ inputClass, labelClass }: { inputClass: string; labelClass: string }) {
  return (
    <div>
      <label className={labelClass}>성적 입력 방식</label>
      <select name="grade_scale" defaultValue="letter" className={inputClass}>
        {GRADE_SCALE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
