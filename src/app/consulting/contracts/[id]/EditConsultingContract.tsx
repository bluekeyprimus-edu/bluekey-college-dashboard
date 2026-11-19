"use client";

import { useEffect, useState } from "react";
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
  student_grade: string;
  student_school: string;
  parent_name: string;
  parent_phone: string;
  parent_address: string;
  amount: string;
  start_date: string;
  end_date: string;
};

const EMPTY: Form = {
  student_name: "",
  student_grade: "",
  student_school: "",
  parent_name: "",
  parent_phone: "",
  parent_address: "",
  amount: "",
  start_date: "",
  end_date: "",
};

export function EditConsultingContract({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data } = await supabase.from("contracts").select("*").eq("id", id).single();
      if (!data) {
        router.push("/consulting/contracts");
        return;
      }
      if (data.status !== "pending") {
        alert("서명 완료된 계약서는 수정할 수 없습니다.");
        router.push("/consulting/contracts");
        return;
      }
      setForm({
        student_name: data.student_name || "",
        student_grade: data.student_grade || "",
        student_school: data.student_school || "",
        parent_name: data.parent_name || "",
        parent_phone: data.parent_phone || "",
        parent_address: data.parent_address || "",
        amount: data.amount || "",
        start_date: data.start_date || "",
        end_date: data.end_date || "",
      });
      setLoading(false);
    }
    load();
  }, [id, router]);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "amount" ? formatAmountInput(value) : value });
  };

  async function save() {
    if (!supabase) return;
    if (!form.student_name) {
      alert("학생 이름을 입력해주세요.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("contracts").update({ ...form }).eq("id", id);
    if (error) {
      alert("오류: " + error.message);
      setSaving(false);
      return;
    }
    alert("저장되었습니다.");
    router.push("/consulting/contracts");
  }

  if (loading) return <p className="py-16 text-center text-sm text-navy-400">불러오는 중...</p>;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/consulting/contracts")} className="text-xs font-medium text-navy-400 hover:text-navy-600">
          ← 목록
        </button>
        <div>
          <h1 className="font-serif text-xl font-semibold text-navy-900">계약서 수정</h1>
          <p className="text-xs text-navy-400">서명 전에만 수정 가능합니다</p>
        </div>
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

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-lg bg-navy-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "저장 중..." : "수정 내용 저장"}
      </button>
    </div>
  );
}
