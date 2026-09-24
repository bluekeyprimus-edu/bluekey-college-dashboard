import { redirect } from "next/navigation";
import { getStudents, getAllStudentFinances, getAllStudentExpenses } from "@/lib/data";
import { updateStudentFinance, addStudentExpense, deleteStudentExpense } from "@/lib/actions";
import { getCurrentCounselor } from "@/lib/current-counselor";
import { StudentExpense, StudentFinance } from "@/lib/types";
import { EXPENSE_CATEGORY_LABEL } from "@/lib/labels";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-navy-500";

function won(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

function StatCard({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "gold" | "green" | "red" | "neutral" }) {
  const toneClass =
    tone === "gold" ? "text-gold-600" : tone === "green" ? "text-emerald-600" : tone === "red" ? "text-rose-600" : "text-navy-900";
  return (
    <Card>
      <CardBody>
        <div className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</div>
        <div className={cn("mt-1 font-serif text-2xl font-semibold", toneClass)}>{value}</div>
      </CardBody>
    </Card>
  );
}

export default async function FinancePage() {
  // Profitability data is sensitive business data — admin-only, same
  // redirect pattern as /settings/counselors.
  const actingCounselor = await getCurrentCounselor();
  if (!actingCounselor?.isAdmin) redirect("/");

  const [students, finances, expenses] = await Promise.all([
    getStudents(),
    getAllStudentFinances(),
    getAllStudentExpenses(),
  ]);

  const financeByStudent = new Map<string, StudentFinance>(finances.map((f) => [f.student_id, f]));
  const expensesByStudent = new Map<string, StudentExpense[]>();
  for (const e of expenses) {
    expensesByStudent.set(e.student_id, [...(expensesByStudent.get(e.student_id) ?? []), e]);
  }

  const rows = students.map((s) => {
    const finance = financeByStudent.get(s.id);
    const studentExpenses = expensesByStudent.get(s.id) ?? [];
    const fee = finance?.consulting_fee ?? 0;
    const totalExpense = studentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = fee - totalExpense;
    const margin = fee > 0 ? Math.round((profit / fee) * 100) : null;
    return { student: s, finance, expenses: studentExpenses, fee, totalExpense, profit, margin };
  });

  const totalRevenue = rows.reduce((sum, r) => sum + r.fee, 0);
  const totalExpense = rows.reduce((sum, r) => sum + r.totalExpense, 0);
  const totalProfit = totalRevenue - totalExpense;
  const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-900">통계</h1>
        <p className="mt-1 text-sm text-navy-500">
          학생별 수임료(컨설팅 비용)에서 EC·에세이 등 비용을 뺀 순이익을 관리해요. 관리자만 볼 수 있어요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="총 수임료" value={won(totalRevenue)} />
        <StatCard label="총 비용" value={won(totalExpense)} tone="red" />
        <StatCard label="총 순이익" value={won(totalProfit)} tone="green" />
        <StatCard label="평균 마진율" value={`${avgMargin}%`} tone="gold" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>학생별 수익 현황</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {rows.length === 0 && <p className="text-sm text-navy-400">등록된 학생이 없어요.</p>}

          {rows.map(({ student, finance, expenses: studentExpenses, fee, totalExpense: studentTotalExpense, profit, margin }) => (
            <details key={student.id} className="rounded-lg border border-navy-100">
              <summary className="cursor-pointer list-none rounded-lg px-3 py-2.5 hover:bg-navy-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-navy-900">{student.english_name ?? student.student_name}</span>
                    <span className="ml-2 text-xs text-navy-400">
                      {student.counselor_name ?? "미배정"}
                      {finance?.contract_start && ` · ${finance.contract_start}${finance.contract_end ? ` ~ ${finance.contract_end}` : " ~"}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-navy-400">
                      수임료 {won(fee)} · 비용 {won(studentTotalExpense)}
                    </span>
                    <Pill tone={profit >= 0 ? "green" : "red"}>
                      순이익 {won(profit)}
                      {margin !== null && ` (${margin}%)`}
                    </Pill>
                  </div>
                </div>
              </summary>

              <div className="space-y-4 border-t border-navy-100 p-3">
                <form action={updateStudentFinance.bind(null, student.id)} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className={labelClass}>수임료 (원)</label>
                    <input type="number" name="consulting_fee" min={0} step={10000} defaultValue={finance?.consulting_fee ?? 0} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>계약 시작일</label>
                    <input type="date" name="contract_start" defaultValue={finance?.contract_start ?? ""} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>계약 종료(예정)일</label>
                    <input type="date" name="contract_end" defaultValue={finance?.contract_end ?? ""} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>메모</label>
                    <input name="notes" defaultValue={finance?.notes ?? ""} className={inputClass} />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                    <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                      저장
                    </button>
                  </div>
                </form>

                <div className="space-y-2 rounded-lg bg-navy-50/60 p-2.5">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">비용 내역</div>

                  {studentExpenses.length === 0 && <p className="text-xs text-navy-400">등록된 비용이 없어요.</p>}

                  {studentExpenses.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-2 rounded-md bg-white px-2.5 py-1.5">
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-navy-900">{EXPENSE_CATEGORY_LABEL[e.category] ?? e.category}</span>
                        {e.description && <span className="ml-1.5 truncate text-xs text-navy-400">{e.description}</span>}
                        {e.expense_date && <span className="ml-1.5 text-[11px] text-navy-300">{e.expense_date}</span>}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs font-medium text-navy-700">{won(e.amount)}</span>
                        <form action={deleteStudentExpense.bind(null, e.id)}>
                          <button type="submit" className="text-[11px] font-medium text-rose-500 hover:text-rose-700">
                            삭제
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}

                  <form action={addStudentExpense.bind(null, student.id)} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <select name="category" defaultValue="extracurricular" className={inputClass}>
                      {Object.entries(EXPENSE_CATEGORY_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <input name="description" placeholder="내용" className={inputClass} />
                    <input type="number" name="amount" min={0} step={10000} placeholder="금액" required className={inputClass} />
                    <input type="date" name="expense_date" className={inputClass} />
                    <button type="submit" className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-50">
                      비용 추가
                    </button>
                  </form>
                </div>
              </div>
            </details>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
