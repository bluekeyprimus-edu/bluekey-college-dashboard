"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPastConsultingContract } from "@/lib/actions";
import type { Student } from "@/lib/types";

const cardClass = "rounded-xl border border-navy-100 bg-white p-4";

type Record_ = {
  student_name: string;
  student_grade: string;
  student_school: string;
  parent_name: string;
  parent_phone: string;
  parent_address: string;
  contract_type: string;
  num_schools: string;
  amount: string;
  start_date: string;
  end_date: string;
  signed_date: string;
  special_terms: string;
};

// 2026-11-19 기준, 전자계약 도입 전 종이로 서명된 컨설팅 계약서 6건 — 각 PDF
// 파일만 맞춰서 첨부하면 되도록 나머지 정보는 미리 채워뒀어요.
const RECORDS: Record_[] = [
  {
    student_name: "강승현",
    student_grade: "10학년",
    student_school: "NVOT",
    parent_name: "문혜순",
    parent_phone: "010-6315-0011",
    parent_address: "",
    contract_type: "standard",
    num_schools: "",
    amount: "15,000,000",
    start_date: "2026-07-01",
    end_date: "2027-06-30",
    signed_date: "2026-08-06",
    special_terms: "결제방식 50% 미화 50% 한화",
  },
  {
    student_name: "김유은",
    student_grade: "12학년",
    student_school: "WBAIS",
    parent_name: "임현정",
    parent_phone: "010-9115-7813",
    parent_address: "",
    contract_type: "application",
    num_schools: "12",
    amount: "15,000,000",
    start_date: "2026-07-10",
    end_date: "2027-04-10",
    signed_date: "2026-07-10",
    special_terms: "",
  },
  {
    student_name: "김하은",
    student_grade: "12학년",
    student_school: "GVCS",
    parent_name: "한지수",
    parent_phone: "010-5162-1124",
    parent_address: "서울",
    contract_type: "application",
    num_schools: "12",
    amount: "15,000,000",
    start_date: "2026-09-16",
    end_date: "2027-04-30",
    signed_date: "2026-09-18",
    special_terms: "",
  },
  {
    student_name: "문소은",
    student_grade: "10학년",
    student_school: "Berean Christian High School",
    parent_name: "문재현",
    parent_phone: "+1 669-269-9311",
    parent_address: "미국",
    contract_type: "standard",
    num_schools: "",
    amount: "20,000,000",
    start_date: "2026-09-01",
    end_date: "2027-08-30",
    signed_date: "2026-09-01",
    special_terms: "",
  },
  {
    student_name: "신효린",
    student_grade: "9학년",
    student_school: "SAS (Singapore American School)",
    parent_name: "신정훈",
    parent_phone: "65-9117-0927",
    parent_address: "Singapore",
    contract_type: "standard",
    num_schools: "",
    amount: "30,000,000",
    start_date: "2026-09-01",
    end_date: "2028-08-31",
    signed_date: "2026-09-01",
    special_terms:
      "정상가 9학년 1500만 10학년 2000만 (총 3500만) 일시납 할인 3000만 납부. 중도해지시 할인취소, 9학년 기준 1500만 일할정산.",
  },
  {
    student_name: "장준형",
    student_grade: "10학년",
    student_school: "SJA 제주",
    parent_name: "신이나",
    parent_phone: "010-4928-6676",
    parent_address: "제주시",
    contract_type: "standard",
    num_schools: "",
    amount: "40,000,000",
    start_date: "2026-10-01",
    end_date: "2028-09-30",
    signed_date: "2026-09-28",
    special_terms: "10-11학년 2년 일괄 계약시 500만원 할인. 10학년 2000만, 11학년 2500만.",
  },
];

type RowStatus = "idle" | "saving" | "done" | "error";

export function BulkPastContractImport({ students }: { students: Student[] }) {
  const router = useRouter();
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [statuses, setStatuses] = useState<RowStatus[]>(RECORDS.map(() => "idle"));
  const [errors, setErrors] = useState<(string | null)[]>(RECORDS.map(() => null));
  const [studentIds, setStudentIds] = useState<string[]>(
    RECORDS.map((r) => students.find((s) => s.student_name?.trim() === r.student_name)?.id ?? "")
  );
  const [running, setRunning] = useState(false);

  const allDone = useMemo(() => statuses.every((s) => s === "done"), [statuses]);

  function setStudentId(i: number, id: string) {
    const next = [...studentIds];
    next[i] = id;
    setStudentIds(next);
  }

  async function runAll() {
    const missing = RECORDS.map((_, i) => i).filter((i) => !fileRefs.current[i]?.files?.[0] && statuses[i] !== "done");
    if (missing.length > 0) {
      alert(`${missing.map((i) => RECORDS[i].student_name).join(", ")} 학생의 PDF가 첨부되지 않았어요.`);
      return;
    }
    setRunning(true);
    const nextStatuses = [...statuses];
    const nextErrors = [...errors];
    for (let i = 0; i < RECORDS.length; i++) {
      if (nextStatuses[i] === "done") continue;
      const file = fileRefs.current[i]?.files?.[0];
      if (!file) continue;
      nextStatuses[i] = "saving";
      setStatuses([...nextStatuses]);
      try {
        const fd = new FormData();
        const r = RECORDS[i];
        fd.append("student_name", r.student_name);
        fd.append("student_grade", r.student_grade);
        fd.append("student_school", r.student_school);
        fd.append("parent_name", r.parent_name);
        fd.append("parent_phone", r.parent_phone);
        fd.append("parent_address", r.parent_address);
        fd.append("contract_type", r.contract_type);
        fd.append("num_schools", r.num_schools);
        fd.append("amount", r.amount);
        fd.append("start_date", r.start_date);
        fd.append("end_date", r.end_date);
        fd.append("signed_date", r.signed_date);
        fd.append("special_terms", r.special_terms);
        fd.append("student_id", studentIds[i]);
        fd.append("pdf", file);
        await createPastConsultingContract(fd);
        nextStatuses[i] = "done";
        nextErrors[i] = null;
      } catch (e) {
        nextStatuses[i] = "error";
        nextErrors[i] = e instanceof Error ? e.message : String(e);
      }
      setStatuses([...nextStatuses]);
      setErrors([...nextErrors]);
    }
    setRunning(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/consulting/contracts")} className="text-xs font-medium text-navy-400 hover:text-navy-600">
          ← 목록
        </button>
        <div>
          <h1 className="font-serif text-xl font-semibold text-navy-900">과거 계약서 일괄 등록 (6건)</h1>
          <p className="text-xs text-navy-400">학생 이름 확인하고 해당 PDF만 첨부해주세요. 나머지 정보는 이미 채워져 있어요.</p>
        </div>
      </div>

      {RECORDS.map((r, i) => (
        <div key={r.student_name} className={cardClass}>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="font-serif text-base font-semibold text-navy-900">
                {r.student_name} <span className="text-xs font-normal text-navy-400">({r.student_grade} · {r.student_school})</span>
              </div>
              <div className="text-xs text-navy-500">
                {r.parent_name} · {Number(r.amount.replace(/,/g, "")).toLocaleString("ko-KR")}원 · {r.start_date} ~ {r.end_date}
              </div>
            </div>
            {statuses[i] === "done" && <span className="text-sm font-medium text-emerald-600">✅ 등록됨</span>}
            {statuses[i] === "saving" && <span className="text-sm font-medium text-navy-400">저장 중...</span>}
          </div>

          <div className="mb-2">
            <label className="mb-1 block text-xs font-medium text-navy-500">대시보드 학생과 연결</label>
            <select
              value={studentIds[i]}
              onChange={(e) => setStudentId(i, e.target.value)}
              disabled={statuses[i] === "done"}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900"
            >
              <option value="">연결 안 함</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.student_name} · {s.current_grade}학년 · {s.high_school}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-navy-500">계약서 PDF *</label>
            <input
              ref={(el) => {
                fileRefs.current[i] = el;
              }}
              type="file"
              accept="application/pdf"
              disabled={statuses[i] === "done"}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900"
            />
          </div>

          {statuses[i] === "error" && <p className="mt-2 text-xs text-rose-600">오류: {errors[i]}</p>}
        </div>
      ))}

      {allDone ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="mb-2 text-2xl">✅</div>
          <div className="mb-3 text-sm font-semibold text-emerald-700">6건 모두 등록이 끝났어요.</div>
          <button
            onClick={() => router.push("/consulting/contracts")}
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white"
          >
            목록으로 돌아가기
          </button>
        </div>
      ) : (
        <button
          onClick={runAll}
          disabled={running}
          className="w-full rounded-lg bg-navy-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {running ? "등록 중..." : "전체 등록"}
        </button>
      )}
    </div>
  );
}
