import { notFound } from "next/navigation";
import { getStudent, getCounselors } from "@/lib/data";
import { updateStudent } from "@/lib/actions";
import { getCurrentCounselor } from "@/lib/current-counselor";
import { StudentForm } from "@/components/students/StudentForm";

export const dynamic = "force-dynamic";

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [student, counselors, actingCounselor] = await Promise.all([getStudent(id), getCounselors(), getCurrentCounselor()]);
  if (!student) notFound();

  const boundUpdate = updateStudent.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-900">
          {student.english_name ?? student.student_name} 정보 수정
        </h1>
      </div>
      <StudentForm
        action={boundUpdate}
        defaultValues={student}
        counselors={counselors}
        submitLabel="변경사항 저장"
        canAssignCounselor={actingCounselor?.isAdmin ?? false}
      />
    </div>
  );
}
