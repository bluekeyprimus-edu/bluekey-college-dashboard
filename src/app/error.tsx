"use client";

import { useEffect } from "react";

// Root error boundary for every page under RootLayout. Before this
// existed, a thrown Server Component error (e.g. a real Supabase query
// failure) fell through to Next's generic crash screen — or, in
// getStudents()'s old mock-data fallback, didn't surface at all. Now any
// data-layer error that throws instead of silently falling back lands
// here, in plain Korean, with a way to retry.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="font-serif text-lg font-semibold text-navy-900">문제가 발생했어요</p>
        <p className="mt-2 text-sm text-navy-600">
          데이터를 불러오는 중 오류가 났어요. 데이터가 잘못 표시되는 대신 여기서 멈췄어요.
        </p>
        <p className="mt-2 break-words rounded-lg bg-white px-3 py-2 text-left text-xs text-rose-700">
          {error.message || "알 수 없는 오류"}
        </p>
        <button
          onClick={() => reset()}
          className="mt-4 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
