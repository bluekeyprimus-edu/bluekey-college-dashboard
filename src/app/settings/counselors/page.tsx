import { redirect } from "next/navigation";
import { getCounselors } from "@/lib/data";
import { createCounselorAccount, unlinkCounselorAccount, addCounselor } from "@/lib/actions";
import { getCurrentCounselor } from "@/lib/current-counselor";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-navy-500";

export default async function CounselorSettingsPage() {
  // 계정/권한 관리는 관리자 카운슬러만 — 담당 학생 스코핑이 있는 일반 카운슬러는
  // 이 페이지에 접근할 수 없게 막아요.
  const actingCounselor = await getCurrentCounselor();
  if (!actingCounselor?.isAdmin) redirect("/");

  const counselors = await getCounselors();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-900">카운슬러 계정</h1>
        <p className="mt-1 text-sm text-navy-500">카운슬러 로그인 계정을 만들고 관리하세요. 로그인은 `/login`에서 해요.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>카운슬러 목록</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {counselors.map((c) => (
            <div key={c.id} className="rounded-lg border border-navy-100 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-semibold text-navy-900">{c.name}</span>
                  <span className="ml-2 text-xs text-navy-400">{c.email ?? "이메일 없음"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {c.is_admin && <Pill tone="gold">관리자</Pill>}
                  <Pill tone={c.auth_user_id ? "green" : "neutral"}>{c.auth_user_id ? "로그인 연결됨" : "미연결"}</Pill>
                </div>
              </div>

              {c.auth_user_id ? (
                <form action={unlinkCounselorAccount.bind(null, c.id)} className="mt-2 flex justify-end">
                  <button type="submit" className="text-xs font-medium text-rose-500 hover:text-rose-700">
                    로그인 연결 해제
                  </button>
                </form>
              ) : (
                <details className="mt-3">
                  <summary className="cursor-pointer list-none text-xs font-medium text-gold-600 hover:text-gold-700">
                    + 로그인 계정 만들기
                  </summary>
                  <form action={createCounselorAccount.bind(null, c.id)} className="mt-2 grid grid-cols-1 gap-3 border-t border-navy-100 pt-3 sm:grid-cols-3">
                    <div>
                      <label className={labelClass}>이메일 *</label>
                      <input type="email" name="email" required defaultValue={c.email ?? ""} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>임시 비밀번호 *</label>
                      <input type="text" name="password" required minLength={6} className={inputClass} />
                    </div>
                    <div className="flex items-end">
                      <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                        계정 생성
                      </button>
                    </div>
                  </form>
                </details>
              )}
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>+ 새 카운슬러 추가</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={addCounselor} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>이름 *</label>
              <input name="name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>이메일</label>
              <input type="email" name="email" className={inputClass} />
            </div>
            <div className="flex items-end">
              <button type="submit" className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">
                추가
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
