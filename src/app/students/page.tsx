import Link from "next/link";
import { getRosterRows } from "@/lib/data";
import { getCounselorRestriction } from "@/lib/current-counselor";
import { StudentsTable } from "@/components/students/StudentsTable";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const [rows, restricted] = await Promise.all([getRosterRows(), getCounselorRestriction()]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">학생</h1>
          <p className="mt-1 text-sm text-navy-500">
            {restricted ? "내 담당 학생 명단 — 정렬·필터링하고 프로필로 들어가서 확인하세요." : "전체 학생 명단 — 정렬·필터링하고 프로필로 들어가서 확인하세요."}
          </p>
        </div>
        <Link
          href="/students/new"
          className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
        >
          + 새 학생 추가
        </Link>
      </div>
      <StudentsTable rows={rows} />
    </div>
  );
}
