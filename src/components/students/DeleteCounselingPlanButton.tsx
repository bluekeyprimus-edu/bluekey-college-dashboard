"use client";

import { deleteCounselingPlan } from "@/lib/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function DeleteCounselingPlanButton({ studentId, planId, academicYear }: { studentId: string; planId: string; academicYear: string }) {
  const warning = `"${academicYear}" Plan과 그 안의 모든 Goal/Milestone을 삭제할까요? 되돌릴 수 없어요.`;

  return (
    <form
      action={deleteCounselingPlan.bind(null, studentId, planId)}
      onSubmit={(e) => {
        if (!confirm(warning)) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton label="이 Plan 전체 삭제" pendingLabel="삭제 중..." variant="ghost-danger-sm" toastMessage="삭제되었습니다" />
    </form>
  );
}
