import { getCounselors } from "@/lib/data";
import { createStudent } from "@/lib/actions";
import { StudentForm } from "@/components/students/StudentForm";

export const dynamic = "force-dynamic";

export default async function NewStudentPage() {
  const counselors = await getCounselors();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-900">새 학생 추가</h1>
        <p className="mt-1 text-sm text-navy-500">기본 프로필 정보를 입력하세요. 나머지 항목은 등록 후 이어서 추가할 수 있어요.</p>
      </div>
      <StudentForm action={createStudent} counselors={counselors} submitLabel="학생 등록" />
    </div>
  );
}
