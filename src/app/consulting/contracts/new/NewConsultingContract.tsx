"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CONSULTING_CONTRACT_TYPE_OPTIONS } from "@/lib/labels";
import { formatAmountInput } from "@/lib/format";

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
  special_terms: string;
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
  special_terms: "",
};

export function NewConsultingContract() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "amount" ? formatAmountInput(value) : value });
  };

  async function submit() {
    if (!supabase) return;
    if (!form.student_name) {
      alert("학생 이름을 입력해주세요.");
      return;
    }
    if (!form.contract_type) {
      alert("계약 유형을 선택해주세요.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("contracts")
      .insert([{ ...form, status: "pending" }])
      .select()
      .single();
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
          <p className="mb-1 text-sm text-navy-500">아래 링크를 학부모님께 전달해주세요.</p>
          <div className="my-4 break-all rounded-lg border border-navy-100 bg-navy-50 p-3 text-xs text-navy-600">{link}</div>
          <button onClick={copy} className="w-full rounded-lg bg-navy-900 py-3 text-sm font-semibold text-white">
            {copied ? "복사됨 ✓" : "링크 복사"}
          </button>
          <button
            onClick={() => router.push("/consulting/contracts")}
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
        <h1 className="font-serif text-2xl font-semibold text-navy-900">새 계약서 작성</h1>
        <p className="text-sm text-navy-500">작성 후 학부모님께 서명 링크를 전달합니다</p>
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
          placeholder="예: 일금 삼천오백만원 (35,000,000원)"
          className={inputClass}
        />
      </div>

      <div className={cardClass}>
        <div className={sectionClass}>서비스 기간</div>
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
      </div>

      <div className={cardClass}>
        <div className={sectionClass}>특약사항 (선택)</div>
        <label className={labelClass}>계약서에 추가로 명시할 특약 내용이 있다면 입력해주세요</label>
        <textarea
          rows={4}
          name="special_terms"
          value={form.special_terms}
          onChange={set}
          placeholder="예: 계약 기간 중 1회에 한해 컨설턴트 변경이 가능하다."
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
