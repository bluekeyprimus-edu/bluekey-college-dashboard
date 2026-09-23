import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getLinkedStudentsForParent } from "@/lib/parent";
import { LogoutButton } from "@/components/auth/LogoutButton";

export const dynamic = "force-dynamic";

export default async function ParentHomePage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const students = await getLinkedStudentsForParent(user.id);

  if (students.length === 1) {
    redirect(`/parent/${students[0].studentId}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="BlueKey" width={32} height={32} className="h-8 w-8 rounded-md object-cover" />
          <span className="font-serif text-lg font-semibold text-navy-900">BlueKey 학부모 포털</span>
        </div>
        <LogoutButton />
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border border-navy-100 bg-white p-6 text-sm text-navy-500">
          연결된 학생 정보가 아직 없어요. 담당 카운슬러에게 문의해주세요.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-navy-500">확인할 자녀를 선택하세요.</p>
          {students.map((s) => (
            <Link
              key={s.studentId}
              href={`/parent/${s.studentId}`}
              className="block rounded-xl border border-navy-100 bg-white px-4 py-3.5 text-sm font-medium text-navy-900 shadow-sm hover:border-gold-300 hover:bg-gold-50/40"
            >
              {s.englishName ?? s.studentName}
              {s.englishName && s.englishName !== s.studentName && (
                <span className="ml-2 text-xs font-normal text-navy-400">{s.studentName}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
