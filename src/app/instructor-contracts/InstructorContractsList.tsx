"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Contract } from "@/lib/types";
import { CONTRACT_STATUS_LABEL, CONTRACT_STATUS_TONE } from "@/lib/labels";
import { Pill } from "@/components/ui/Pill";

const btnClass = "rounded-md border px-2.5 py-1 text-xs font-medium hover:opacity-80";

export function InstructorContractsList() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

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
      .eq("contract_type", "instructor")
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

  async function deleteContract(id: string, name: string | null) {
    if (!supabase) return;
    if (!confirm(`'${name}' 계약서를 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
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
          <h1 className="font-serif text-2xl font-semibold text-navy-900">강사 계약서</h1>
          <p className="text-sm text-navy-500">
            강사 위촉 계약서 발송 및 서명 현황 <span className="text-navy-300">(날짜는 한국시간 기준)</span>
          </p>
        </div>
        <button
          onClick={() => router.push("/instructor-contracts/new")}
          className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
        >
          + 새 계약서 작성
        </button>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-navy-400">불러오는 중...</p>
      ) : contracts.length === 0 ? (
        <div className="rounded-xl border border-navy-100 bg-white py-16 text-center">
          <p className="mb-3 text-sm text-navy-500">아직 작성된 계약서가 없어요</p>
          <button
            onClick={() => router.push("/instructor-contracts/new")}
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
                  <div className="text-xs text-navy-400">강사 계약</div>
                </div>
                <Pill tone={CONTRACT_STATUS_TONE[c.status]}>{CONTRACT_STATUS_LABEL[c.status] ?? c.status}</Pill>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-1.5 text-xs text-navy-600">
                <div>
                  <span className="text-navy-400">강사료 </span>
                  <span className="font-semibold text-navy-900">{c.amount || "—"}</span>
                </div>
                <div>
                  <span className="text-navy-400">계약기간 </span>
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
                {c.parent_address && (
                  <div>
                    <span className="text-navy-400">주소 </span>
                    {c.parent_address}
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
                      onClick={() => router.push(`/instructor-contracts/${c.id}`)}
                      className={`${btnClass} border-navy-200 bg-navy-50 text-navy-600`}
                    >
                      수정
                    </button>
                    <button onClick={() => cancel(c.id)} className={`${btnClass} border-rose-200 bg-rose-50 text-rose-600`}>
                      취소
                    </button>
                  </>
                )}
                {c.status === "signed" && (
                  <button
                    onClick={() => window.open(`/sign/${c.token}`)}
                    className={`${btnClass} border-emerald-200 bg-emerald-50 text-emerald-700`}
                  >
                    계약서 보기
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
    </div>
  );
}
