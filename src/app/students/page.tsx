import { getRosterRows } from "@/lib/data";
import { StudentsTable } from "@/components/students/StudentsTable";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const rows = await getRosterRows();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-900">학생</h1>
        <p className="mt-1 text-sm text-navy-500">전체 학생 명단 — 정렬·필터링하고 프로필로 들어가서 확인하세요.</p>
      </div>
      <StudentsTable rows={rows} />
    </div>
  );
}
