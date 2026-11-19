"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Contract } from "@/lib/types";
import { CONTRACT_STATUS_LABEL, CONTRACT_STATUS_TONE, CONSULTING_CONTRACT_TYPE_OPTIONS } from "@/lib/labels";
import { Pill } from "@/components/ui/Pill";

const PKG_LABEL: Record<string, string> = Object.fromEntries(
  CONSULTING_CONTRACT_TYPE_OPTIONS.map((p) => [p.value, p.label])
);

const btnClass =
  "rounded-md border px-2.5 py-1 text-xs font-medium hover:opacity-80";

function won(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

export function ConsultingContractsList() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [termModal, setTermModal] = useState<Contract | null>(null);
  const [termForm, setTermForm] = useState({ date: "", fee: "", reason: "" });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("contracts")
      .select("*")
      .neq("contract_type", "instructor")
      .order("created_at", { ascending: false });
    setContracts((data as Contract[]) || []);
    setLoading(false);
  }

  async function cancel(id: string) {
    if (!supabase) return;
    if (!confirm("계약서를 취소하시겠습니까?")) return;
    await supabase.from("contracts").update({ status: "cancelled" }).eq("id", id);
    load();
  }

  // 계약 해지: 계약서와 학생 기록(성적·상담 등)은 그대로 두고, 해지일·사유·인정 금액만 남깁니다.
  function openTerminate(c: Contract) {
    setTermForm(
      c.status === "terminated"
        ? {
            date: c.termination_date || new Date().toISOString().slice(0, 10),
            fee: String(Number(c.termination_fee) || 0),
            reason: c.termination_reason || "",
          }
        : { date: new Date().toISOString().slice(0, 10), fee: "", reason: "" }
    );
    setTermModal(c);
  }

  async function saveTerminate() {
    if (!supabase || !termModal) return;
    if (!termForm.date) {
      alert("해지일을 입력해주세요.");
      return;
    }
    if (termForm.fee === "") {
      alert("인정 금액을 입력해주세요. (없으면 0)");
      return;
    }
    const { error } = await supabase
      .from("contracts")
      .update({
        status: "terminated",
        termination_date: termForm.date,
        termination_fee: Number(termForm.fee.replace(/[^0-9]/g, "")) || 0,
        termination_reason: termForm.reason,
      })
      .eq("id", termModal.id);
    if (error) {
      alert("저장 중 오류가 발생했습니다: " + error.message);
      return;
    }
    setTermModal(null);
    load();
  }

  async function deleteContract(id: string, studentName: string | null) {
    if (!supabase) return;
    if (!confirm(`'${studentName}' 계약서를 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    await supabase.from("contracts").delete().eq("id", id);
    load();
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/sign/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!supabase) {
    return <p className="text-sm text-navy-500">Supabase 연결 설정이 필요합니다.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">컨설팅 계약서</h1>
          <p className="text-sm text-navy-500">
            전자 계약서 발송 및 서명 현황 <span className="text-navy-300">(날짜는 한국시간 기준)</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/consulting/contracts/past/new")}
            className="rounded-lg border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50"
          >
            + 과거 계약서 등록
          </button>
          <button
            onClick={() => router.push("/consulting/contracts/new")}
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
          >
            + 새 계약서 작성
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-navy-400">불러오는 중...</p>
      ) : contracts.length === 0 ? (
        <div className="rounded-xl border border-navy-100 bg-white py-16 text-center">
          <p className="mb-3 text-sm text-navy-500">아직 작성된 계약서가 없어요</p>
          <button
            onClick={() => router.push("/consulting/contracts/new")}
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
          >
            첫 계약서 작성하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {contracts.map((c) => (
            <div key={c.id} className="rounded-xl border border-navy-100 bg-white p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="font-serif text-base font-semibold text-navy-900">{c.student_name}</div>
                  <div className="text-xs text-navy-400">{c.student_grade}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {c.pdf_url && <Pill tone="neutral">과거계약</Pill>}
                  <Pill tone={CONTRACT_STATUS_TONE[c.status]}>{CONTRACT_STATUS_LABEL[c.status] ?? c.status}</Pill>
                </div>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-1.5 text-xs text-navy-600">
                <div>
                  <span className="text-navy-400">패키지 </span>
                  <span className="font-semibold text-navy-900">{PKG_LABEL[c.contract_type] ?? c.contract_type}</span>
                </div>
                <div>
                  <span className="text-navy-400">학부모 </span>
                  {c.parent_name || "—"}
                </div>
                <div>
                  <span className="text-navy-400">기간 </span>
                  {c.start_date && c.end_date ? `${c.start_date} ~ ${c.end_date}` : "—"}
                </div>
                <div>
                  <span className="text-navy-400">작성일 </span>
                  {new Date(c.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                </div>
                {c.signed_at && (
                  <div>
                    <span className="text-navy-400">서명일 </span>
                    {new Date(c.signed_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                  </div>
                )}
                {c.parent_phone && (
                  <div>
                    <span className="text-navy-400">연락처 </span>
                    {c.parent_phone}
                  </div>
                )}
                {c.status === "terminated" && (
                  <div>
                    <span className="text-navy-400">해지일 </span>
                    {c.termination_date}
                  </div>
                )}
                {c.status === "terminated" && (
                  <div>
                    <span className="text-navy-400">인정 금액 </span>
                    {won(Number(c.termination_fee) || 0)}
                  </div>
                )}
                {c.status === "terminated" && c.termination_reason && (
                  <div className="col-span-2">
                    <span className="text-navy-400">해지 사유 </span>
                    {c.termination_reason}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.status === "pending" && (
                  <>
                    <button onClick={() => copyLink(c.token)} className={`${btnClass} border-navy-200 bg-navy-50 text-navy-700`}>
                      {copied === c.token ? "복사됨 ✓" : "링크 복사"}
                    </button>
                    <button
                      onClick={() => router.push(`/consulting/contracts/${c.id}`)}
                      className={`${btnClass} border-navy-200 bg-navy-50 text-navy-600`}
                    >
                      수정
                    </button>
                    <button onClick={() => cancel(c.id)} className={`${btnClass} border-rose-200 bg-rose-50 text-rose-600`}>
                      취소
                    </button>
                  </>
                )}
                {(c.status === "signed" || c.status === "terminated") && !c.pdf_url && (
                  <button
                    onClick={() => window.open(`/sign/${c.token}`)}
                    className={`${btnClass} border-emerald-200 bg-emerald-50 text-emerald-700`}
                  >
                    계약서 보기
                  </button>
                )}
                {c.pdf_url && (
                  <button
                    onClick={() => window.open(c.pdf_url!, "_blank")}
                    className={`${btnClass} border-emerald-200 bg-emerald-50 text-emerald-700`}
                  >
                    PDF 보기
                  </button>
                )}
                {(c.status === "signed" || c.status === "terminated") && (
                  <button onClick={() => openTerminate(c)} className={`${btnClass} border-amber-200 bg-amber-50 text-amber-700`}>
                    {c.status === "terminated" ? "해지 내용 수정" : "계약 해지"}
                  </button>
                )}
                <button
                  onClick={() => deleteContract(c.id, c.student_name)}
                  className={`${btnClass} border-navy-100 bg-navy-50 text-navy-400`}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {termModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setTermModal(null)}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 text-base font-semibold text-navy-900">
              {termModal.status === "terminated" ? "해지 내용 수정" : "계약 해지"} · {termModal.student_name}
            </div>
            <p className="mb-4 text-xs text-navy-400">
              학생 기록(성적·상담 등)은 그대로 남고, 컨설팅비용은 아래 인정 금액으로 바뀝니다.
            </p>
            <label className="mb-1 block text-xs text-navy-500">해지일</label>
            <input
              type="date"
              value={termForm.date}
              onChange={(e) => setTermForm({ ...termForm, date: e.target.value })}
              className="mb-3 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm"
            />
            <label className="mb-1 block text-xs text-navy-500">인정 금액 (환불 후 실제로 남는 컨설팅비, 원)</label>
            <input
              type="text"
              inputMode="numeric"
              value={termForm.fee ? Number(termForm.fee.replace(/[^0-9]/g, "")).toLocaleString() : ""}
              onChange={(e) => setTermForm({ ...termForm, fee: e.target.value.replace(/[^0-9]/g, "") })}
              placeholder="예: 5,000,000 (없으면 0)"
              className="mb-3 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm"
            />
            <label className="mb-1 block text-xs text-navy-500">해지 사유 (선택)</label>
            <textarea
              rows={3}
              value={termForm.reason}
              onChange={(e) => setTermForm({ ...termForm, reason: e.target.value })}
              className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setTermModal(null)}
                className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600"
              >
                취소
              </button>
              <button
                onClick={saveTerminate}
                className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-medium text-white"
              >
                {termModal.status === "terminated" ? "저장" : "해지하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
