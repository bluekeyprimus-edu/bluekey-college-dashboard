import { getHistoricalAdmissions } from "@/lib/data";
import { addHistoricalAdmission, updateHistoricalAdmission, deleteHistoricalAdmission } from "@/lib/actions";
import { HistoricalAdmission } from "@/lib/types";
import { ADMISSION_RESULT_LABEL, ADMISSION_RESULT_OPTIONS, CURRICULUM_LABEL } from "@/lib/labels";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-navy-500";

function resultTone(result: string): "green" | "amber" | "red" | "neutral" {
  if (result === "Accepted") return "green";
  if (result === "Waitlisted" || result === "Deferred") return "amber";
  if (result === "Rejected") return "red";
  return "neutral";
}

function StatCard({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "gold" | "green" | "neutral" }) {
  const toneClass = tone === "gold" ? "text-gold-600" : tone === "green" ? "text-emerald-600" : "text-navy-900";
  return (
    <Card>
      <CardBody>
        <div className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</div>
        <div className={cn("mt-1 font-serif text-2xl font-semibold", toneClass)}>{value}</div>
      </CardBody>
    </Card>
  );
}

function RecordFields({ d = {} }: { d?: Partial<HistoricalAdmission> }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="lg:col-span-2">
        <label className={labelClass}>대학명 *</label>
        <input name="university_name" required defaultValue={d.university_name ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>결과 *</label>
        <select name="admission_result" defaultValue={d.admission_result ?? "Accepted"} className={inputClass}>
          {ADMISSION_RESULT_OPTIONS.map((r) => (
            <option key={r} value={r}>{ADMISSION_RESULT_LABEL[r]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>지원 라운드</label>
        <select name="application_round" defaultValue={d.application_round ?? ""} className={inputClass}>
          <option value="">미정</option>
          {["ED", "ED2", "EA", "REA", "RD"].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>희망 전공</label>
        <input name="intended_major" defaultValue={d.intended_major ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>졸업연도</label>
        <input type="number" name="graduation_year" defaultValue={d.graduation_year ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>고등학교</label>
        <input name="high_school" defaultValue={d.high_school ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>커리큘럼</label>
        <select name="curriculum" defaultValue={d.curriculum ?? ""} className={inputClass}>
          <option value="">미정</option>
          {Object.keys(CURRICULUM_LABEL).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>GPA</label>
        <input type="number" step="0.001" name="gpa" defaultValue={d.gpa ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>SAT</label>
        <input type="number" name="sat_score" defaultValue={d.sat_score ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>ACT</label>
        <input type="number" step="0.1" name="act_score" defaultValue={d.act_score ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>EC Strength (1-5)</label>
        <select name="ec_strength" defaultValue={d.ec_strength ?? ""} className={inputClass}>
          <option value="">—</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>Awards Strength (1-5)</label>
        <select name="awards_strength" defaultValue={d.awards_strength ?? ""} className={inputClass}>
          <option value="">—</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}

export default async function AdmissionsDataPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; result?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const resultFilter = sp.result ?? "all";

  const all = await getHistoricalAdmissions();
  const filtered = all.filter((r) => {
    if (resultFilter !== "all" && r.admission_result !== resultFilter) return false;
    if (q) {
      const haystack = `${r.university_name} ${r.intended_major ?? ""} ${r.high_school ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const acceptedRows = all.filter((r) => r.admission_result === "Accepted");
  const gpaValues = acceptedRows.map((r) => r.gpa).filter((v): v is number => v != null);
  const satValues = acceptedRows.map((r) => r.sat_score).filter((v): v is number => v != null);
  const avgGpa = gpaValues.length ? (gpaValues.reduce((a, b) => a + b, 0) / gpaValues.length).toFixed(2) : "—";
  const avgSat = satValues.length ? Math.round(satValues.reduce((a, b) => a + b, 0) / satValues.length) : "—";
  const acceptRate = all.length ? Math.round((acceptedRows.length / all.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-900">블루키 입시 데이터</h1>
        <p className="mt-1 text-sm text-navy-500">
          블루키 학생들의 과거 지원·합격 데이터베이스예요. 학생별 Admissions Positioning 분석의 근거 데이터로 쓰여요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="전체 기록" value={all.length} />
        <StatCard label="합격률" value={`${acceptRate}%`} tone="gold" />
        <StatCard label="합격자 평균 GPA" value={avgGpa} tone="green" />
        <StatCard label="합격자 평균 SAT" value={avgSat} tone="green" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기록 검색</CardTitle>
        </CardHeader>
        <CardBody>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className={labelClass}>대학명 · 전공 · 고등학교</label>
              <input name="q" defaultValue={sp.q ?? ""} placeholder="검색어 입력…" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>결과</label>
              <select name="result" defaultValue={resultFilter} className={inputClass}>
                <option value="all">전체</option>
                {ADMISSION_RESULT_OPTIONS.map((r) => (
                  <option key={r} value={r}>{ADMISSION_RESULT_LABEL[r]}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
              필터 적용
            </button>
            <span className="text-xs text-navy-400">전체 {all.length}건 중 {filtered.length}건</span>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>기록 목록</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <details className="rounded-lg border border-navy-100">
            <summary className="cursor-pointer list-none rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50">
              + 새 기록 추가
            </summary>
            <form action={addHistoricalAdmission} className="space-y-4 border-t border-navy-100 p-3">
              <RecordFields />
              <div className="flex justify-end">
                <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                  추가
                </button>
              </div>
            </form>
          </details>

          {filtered.length === 0 && <p className="text-sm text-navy-400">조건에 맞는 기록이 없어요.</p>}

          {filtered.map((r) => (
            <details key={r.id} className="rounded-lg border border-navy-100">
              <summary className="cursor-pointer list-none rounded-lg px-3 py-2.5 hover:bg-navy-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-navy-900">{r.university_name}</span>
                    <span className="ml-2 text-xs text-navy-400">
                      {r.intended_major ?? "전공 미상"}
                      {r.graduation_year && ` · ${r.graduation_year}년`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-navy-400">
                      {r.gpa != null && `GPA ${r.gpa}`}
                      {r.sat_score != null && ` · SAT ${r.sat_score}`}
                    </span>
                    <Pill tone={resultTone(r.admission_result)}>{ADMISSION_RESULT_LABEL[r.admission_result] ?? r.admission_result}</Pill>
                  </div>
                </div>
              </summary>
              <div className="border-t border-navy-100 p-3">
                <form action={updateHistoricalAdmission.bind(null, r.id)} className="space-y-4">
                  <RecordFields d={r} />
                  <div className="flex justify-end">
                    <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                      저장
                    </button>
                  </div>
                </form>
                <form action={deleteHistoricalAdmission.bind(null, r.id)} className="mt-2 flex justify-end">
                  <button type="submit" className="text-xs font-medium text-rose-500 hover:text-rose-700">
                    이 기록 삭제
                  </button>
                </form>
              </div>
            </details>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
