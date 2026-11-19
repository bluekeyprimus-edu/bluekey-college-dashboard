"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatAmountInput } from "@/lib/format";

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-navy-500";
const cardClass = "rounded-xl border border-navy-100 bg-white p-5";
const sectionClass = "mb-3 text-[11px] font-semibold uppercase tracking-wide text-navy-400";

type Form = {
  student_name: string;
  student_school: string;
  parent_phone: string;
  parent_address: string;
  amount: string;
  start_date: string;
  end_date: string;
  special_terms: string;
};

const EMPTY: Form = {
  student_name: "",
  student_school: "",
  parent_phone: "",
  parent_address: "",
  amount: "",
  start_date: "",
  end_date: "",
  special_terms: "",
};

export function NewInstructorContract() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "amount" ? formatAmountInput(value) : value });
  };

  async function submit() {
    if (!supabase) return;
    if (!form.student_name) {
      alert("강사 이름을 입력해주세요.");
      return;
    }
    if (!form.start_date || !form.end_date) {
      alert("계약기간을 입력해주세요.");
      return;
    }
    if (!form.amount) {
      alert("강사료를 입력해주세요.");
      return;
    }
    setLoading(true);
    const payload = { ...form, contract_type: "instructor", status: "pending" };
    const { data, error } = await supabase.from("contracts").insert([payload]).select().single();
    if (error || !data) {
      alert("오류: " + error?.message);
      setLoading(false);
      return;
    }
    setLink(`${window.location.origin}/sign/${data.token}`);
    setLoading(false);
  }

  function copy() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (link) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-navy-100 bg-white p-10 text-center">
          <div className="mb-4 text-4xl">✅</div>
          <div className="mb-2 font-serif text-lg font-semibold text-navy-900">계약서가 생성되었습니다</div>
          <p className="mb-1 text-sm text-navy-500">아래 링크를 강사님께 전달해주세요.</p>
          <div className="my-4 break-all rounded-lg border border-navy-100 bg-navy-50 p-3 text-xs text-navy-600">{link}</div>
          <button onClick={copy} className="w-full rounded-lg bg-navy-900 py-3 text-sm font-semibold text-white">
            {copied ? "복사됨 ✓" : "링크 복사"}
          </button>
          <button
            onClick={() => router.push("/instructor-contracts")}
            className="mt-2 w-full rounded-lg border border-navy-200 py-2.5 text-sm text-navy-500"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-900">새 강사 계약서 작성</h1>
        <p className="text-sm text-navy-500">작성 후 강사님께 서명 링크를 전달합니다</p>
      </div>

      <div className={cardClass}>
        <div className={sectionClass}>강사 정보</div>
        <label className={labelClass}>강사 이름 *</label>
        <input name="student_name" value={form.student_name} onChange={set} placeholder="홍길동" className={inputClass} />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>주민등록번호</label>
            <input name="student_school" value={form.student_school} onChange={set} placeholder="000000-0000000" className={inputClass} />
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
        <div className={sectionClass}>강사료</div>
        <label className={labelClass}>강사료 (시급 등) *</label>
        <input name="amount" value={form.amount} onChange={set} placeholder="예: 시간당 10만원" className={inputClass} />
      </div>

      <div className={cardClass}>
        <div className={sectionClass}>계약기간</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>계약일자 (시작일)</label>
            <input type="date" name="start_date" value={form.start_date} onChange={set} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>종료일</label>
            <input type="date" name="end_date" value={form.end_date} onChange={set} className={inputClass} />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className={sectionClass}>특약사항 (선택)</div>
        <label className={labelClass}>계약서에 추가로 명시할 특약 내용이 있다면 입력해주세요</label>
        <textarea
          rows={4}
          name="special_terms"
          value={form.special_terms}
          onChange={set}
          placeholder="예: 계약 기간 중 1회에 한해 수업 시간 조정이 가능하다."
          className={inputClass}
        />
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="w-full rounded-lg bg-navy-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "생성 중..." : "계약서 생성 및 링크 발급"}
      </button>
    </div>
  );
}
