"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("아직 서비스 연결이 준비되지 않았어요. 카운슬러에게 문의해주세요.");
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("이메일 또는 비밀번호가 올바르지 않아요.");
      return;
    }
    router.push("/parent");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="BlueKey" width={48} height={48} className="mb-3 h-12 w-12 rounded-md object-cover" />
          <h1 className="font-serif text-xl font-semibold text-navy-900">BlueKey 학부모 포털</h1>
          <p className="mt-1 text-sm text-navy-500">자녀의 입시 준비 현황을 확인하세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-500">이메일</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-500">비밀번호</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
          >
            {loading ? "로그인 중…" : "로그인"}
          </button>
          <p className="text-center text-xs text-navy-400">
            로그인 정보는 담당 카운슬러에게 받으실 수 있어요.
          </p>
        </form>
      </div>
    </div>
  );
}
