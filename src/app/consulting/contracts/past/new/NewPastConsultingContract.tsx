"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPastConsultingContract } from "@/lib/actions";
import { formatAmountInput } from "@/lib/format";
import { CONSULTING_CONTRACT_TYPE_OPTIONS } from "@/lib/labels";
import type { Student } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-navy-500";
const cardClass = "rounded-xl border border-navy-100 bg-white p-5";
const sectionClass = "mb-3 text-[11px] font-semibold uppercase tracking-wide text-navy-400";

type Form = {
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
  student_id: string;
};

const EMPTY: Form = {
  student_name: "",
  student_grade: "",
  student_school: "",
  parent_name: "",
  parent_phone: "",
  parent_address: "",
  contract_type: "",
  num_schools: "12",
  amount: "",
  start_date: "",
  end_date: "",
  signed_date: "",
  special_terms: "",
  student_id: "",
};

export function NewPastConsultingContract({ students }: { students: Student[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "amount" ? formatAmountInput(value) : value });
  };

  async function submit() {
    if (!form.student_name) {
      alert("학생 이름을 입력해주세요.");
      return;
    }
    if (!form.contract_type) {
      alert("계약 유형을 선택해주세요.");
      return;
    }
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      alert("계약서 PDF 파일을 첨부해주세요.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      for (const [key, value] of Object.entries(form)) fd.append(key, value);
      fd.append("pdf", file);
      await createPastConsultingContract(fd);
      setDone(true);
    } catch (e) {
      alert("오류: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-navy-100 bg-white p-10 text-center">
          <div className="mb-4 text-4xl">✅</div>
          <div className="mb-2 font-serif text-lg font-semibold text-navy-900">과거 계약서가 등록되었습니다</div>
          <p className="mb-4 text-sm text-navy-500">
            {form.student_id
              ? "연결된 학생의 재무 통계(컨설팅 비용)에 금액이 더해졌어요."
              : "학생과 연결하지 않아 계약서 기록만 추가됐어요. 재무 통계에는 반영되지 않았어요."}
          </p>
          <button
            onClick={() => router.push("/consulting/contracts")}
            className="w-full rounded-lg bg-navy-900 py-3 text-sm font-semibold text-white"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/consulting/contracts")} className="text-xs font-medium text-navy-400 hover:text-navy-600">
          ← 목록
        </button>
        <div>
          <h1 className="font-serif text-xl font-semibold text-navy-900">과거 계약서 등록</h1>
          <p className="text-xs text-navy-400">전자서명 이전에 종이로 서명된 계약서를 PDF로 등록해요</p>
        </div>
      </div>

      <div className={cardClass}>
        <div className={sectionClass}>계약서 PDF *</div>
        <input ref={fileInputRef} type="file" accept="application/pdf" className={inputClass} />
      </div>

      <div className={cardClass}>
        <div className={sectionClass}>학생 정보</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>학생 이름 *</label>
            <input name="student_name" value={form.student_name} onChange={set} placeholder="홍길동" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>학년</label>
            <select name="student_grade" value={form.student_grade} onChange={set} className={inputClass}>
              <option value="">선택</option>
              {["8학년", "9학년", "10학년", "11학년", "12학년"].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className={labelClass}>재학 학교</label>
          <input
            name="student_school"
            value={form.student_school}
            onChange={set}
            placeholder="○○ International School"
            className={inputClass}
          />
        </div>
      </div>

      <div className={cardClass}>
        <div className={sectionClass}>대시보드 학생과 연결 (선택)</div>
        <label className={labelClass}>연결하면 그 학생의 재무 통계에 금액이 더해져요. 연결하지 않으면 계약서 기록만 남아요.</label>
        <select name="student_id" value={form.student_id} onChange={set} className={inputClass}>
          <option value="">연결 안 함</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.student_name} · {s.current_grade}학년 · {s.high_school}
            </option>
          ))}
        </select>
      </div>

      <div className={cardClass}>
        <div className={sectionClass}>학부모 정보</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>학부모 성명</label>
            <input name="parent_name" value={form.parent_name} onChange={set} placeholder="홍길동" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>연락처</label>
            <input name="parent_phone" value={form.parent_phone} onChange={set} placeholder="010-0000-0000" className={inputClass} />
          </div>
        </div>
        <div className="mt-3">
          <label className={labelClass}>주소</label>
          <input name="parent_address" value={form.parent_address} onChange={set} placeholder="서울시 강남구..." className={inputClass} />
        </div>
      </div>

      <div className={cardClass}>
        <div className={sectionClass}>계약 유형 *</div>
        <div className="grid grid-cols-3 gap-2">
          {CONSULTING_CONTRACT_TYPE_OPTIONS.map((t) => (
            <div
              key={t.value}
              onClick={() => setForm({ ...form, contract_type: t.value })}
              className={`cursor-pointer rounded-lg border-2 p-3 text-center ${
                form.contract_type === t.value ? "border-navy-900 bg-navy-50" : "border-navy-100 bg-white"
              }`}
            >
              <div className={`text-sm font-bold ${form.contract_type === t.value ? "text-navy-900" : "text-navy-600"}`}>
                {t.label}
              </div>
              <div className="mt-0.5 text-[11px] text-navy-400">{t.sub}</div>
              <div className="mt-0.5 text-[11px] text-navy-300">{t.grade}</div>
            </div>
          ))}
        </div>
      </div>

      {(form.contract_type === "application" || form.contract_type === "premium") && (
        <div className={cardClass}>
          <div className={sectionClass}>지원 대학 개수</div>
          <label className={labelClass}>기본 지원 대학 수 (Safety 학교 별도 조율 가능)</label>
          <input name="num_schools" value={form.num_schools} onChange={set} placeholder="12" className={inputClass} />
        </div>
      )}

      <div className={cardClass}>
        <div className={sectionClass}>계약 금액</div>
        <label className={labelClass}>연간 컨설팅 서비스 비용</label>
        <input
          name="amount"
          value={form.amount}
          onChange={set}
          placeholder="예: 15,000,000"
          className={inputClass}
        />
      </div>

      <div className={cardClass}>
        <div className={sectionClass}>계약 기간 / 서명일</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>시작일</label>
            <input type="date" name="start_date" value={form.start_date} onChange={set} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>종료일</label>
            <input type="date" name="end_date" value={form.end_date} onChange={set} className={inputClass} />
          </div>
        </div>
        <div className="mt-3">
          <label className={labelClass}>실제 서명일 (종이 계약서에 서명한 날짜)</label>
          <input type="date" name="signed_date" value={form.signed_date} onChange={set} className={inputClass} />
        </div>
      </div>

      <div className={cardClass}>
        <div className={sectionClass}>특약사항 (선택)</div>
        <textarea
          rows={4}
          name="special_terms"
          value={form.special_terms}
          onChange={set}
          placeholder="예: 결제방식 50% 미화 50% 한화"
          className={inputClass}
        />
      </div>

      <button
        onClick={submit}
        disabled={saving}
        className="w-full rounded-lg bg-navy-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "등록 중..." : "과거 계약서 등록"}
      </button>
    </div>
  );
}
