import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Student, Counselor } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-navy-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

export function StudentForm({
  action,
  defaultValues,
  counselors,
  submitLabel,
  canAssignCounselor = true,
}: {
  action: (formData: FormData) => void;
  defaultValues?: Partial<Student>;
  counselors: Pick<Counselor, "id" | "name">[];
  submitLabel: string;
  // Only an admin may choose/change who a student is assigned to. When
  // false, the field is shown read-only — the server also enforces this
  // independently, so hiding the control here is a UX nicety, not the
  // actual guard.
  canAssignCounselor?: boolean;
}) {
  const d = defaultValues ?? {};

  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>기본 정보</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="학생 이름 *">
            <input name="student_name" required defaultValue={d.student_name} className={inputClass} />
          </Field>
          <Field label="영문 이름">
            <input name="english_name" defaultValue={d.english_name ?? ""} className={inputClass} />
          </Field>
          <Field label="현재 학년 *">
            <select name="current_grade" required defaultValue={d.current_grade ?? ""} className={inputClass}>
              <option value="" disabled>선택</option>
              {[8, 9, 10, 11, 12].map((g) => (
                <option key={g} value={g}>{g}학년</option>
              ))}
            </select>
          </Field>
          <Field label="졸업연도 *">
            <input
              type="number"
              name="graduation_year"
              required
              defaultValue={d.graduation_year ?? ""}
              placeholder="예: 2028"
              className={inputClass}
            />
          </Field>
          <Field label="고등학교 *">
            <input name="high_school" required defaultValue={d.high_school} className={inputClass} />
          </Field>
          <Field label="학교 소재국가/지역">
            <input name="school_country" defaultValue={d.school_country ?? ""} className={inputClass} />
          </Field>
          <Field label="학교 유형">
            <input name="school_type" defaultValue={d.school_type ?? ""} placeholder="예: International, Public" className={inputClass} />
          </Field>
          <Field label="커리큘럼 *">
            <select name="curriculum" required defaultValue={d.curriculum ?? ""} className={inputClass}>
              <option value="" disabled>선택</option>
              {["AP", "IB", "A-Level", "Korean", "Other"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="국적">
            <input name="citizenship" defaultValue={d.citizenship ?? ""} className={inputClass} />
          </Field>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-navy-700">
              <input type="checkbox" name="us_permanent_resident" defaultChecked={d.us_permanent_resident} />
              미국 영주권 보유
            </label>
          </div>
          <Field label="담당 카운슬러">
            {canAssignCounselor ? (
              <select name="counselor_id" defaultValue={d.counselor_id ?? ""} className={inputClass}>
                <option value="">미배정</option>
                {counselors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <div className={`${inputClass} bg-navy-50 text-navy-500`}>
                {counselors.find((c) => c.id === d.counselor_id)?.name ?? "나에게 배정됨"}
                <span className="ml-1.5 text-xs text-navy-400">(관리자만 변경 가능)</span>
              </div>
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>진로/전공</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="희망 전공">
            <input name="intended_major" defaultValue={d.intended_major ?? ""} className={inputClass} />
          </Field>
          <Field label="관심 부전공">
            <input name="secondary_major_interest" defaultValue={d.secondary_major_interest ?? ""} className={inputClass} />
          </Field>
          <Field label="희망 진로">
            <input name="career_interest" defaultValue={d.career_interest ?? ""} className={inputClass} />
          </Field>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
