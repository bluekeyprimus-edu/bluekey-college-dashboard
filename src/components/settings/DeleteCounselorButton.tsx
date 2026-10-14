"use client";

import { deleteCounselor } from "@/lib/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function DeleteCounselorButton({
  counselorId,
  counselorName,
  assignedStudentCount,
}: {
  counselorId: string;
  counselorName: string;
  assignedStudentCount: number;
}) {
  const warning =
    assignedStudentCount > 0
      ? `${counselorName} 카운슬러를 삭제할까요? 배정되어 있던 학생 ${assignedStudentCount}명은 삭제되지 않고 "미배정" 상태가 돼요. 되돌릴 수 없어요.`
      : `${counselorName} 카운슬러를 삭제할까요? 되돌릴 수 없어요.`;

  return (
    <form
      action={deleteCounselor.bind(null, counselorId)}
      onSubmit={(e) => {
        if (!confirm(warning)) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton label="계정 삭제" pendingLabel="삭제 중..." variant="ghost-danger" toastMessage="삭제되었습니다" />
    </form>
  );
}
