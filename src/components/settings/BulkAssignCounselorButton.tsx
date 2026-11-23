"use client";

import { bulkAssignCounselorToAllStudents } from "@/lib/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function BulkAssignCounselorButton({
  counselorId,
  counselorName,
  missingCount,
}: {
  counselorId: string;
  counselorName: string;
  // How many students don't yet have this counselor in counselor_id —
  // precomputed on the page (same roster/array it already reads) so this
  // button never needs its own extra fetch just to show a number.
  missingCount: number;
}) {
  if (missingCount === 0) return null;

  const warning = `${counselorName}님을 담당 카운슬러가 아직 없는 학생을 포함해 ${missingCount}명의 학생에게 "담당 카운슬러"로 한번에 추가할까요? 이미 배정된 카운슬러는 그대로 유지되고, ${counselorName}님만 추가돼요.`;

  return (
    <form
      action={bulkAssignCounselorToAllStudents.bind(null, counselorId)}
      onSubmit={(e) => {
        if (!confirm(warning)) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton
        label={`전체 학생에 추가 (${missingCount}명)`}
        pendingLabel="추가 중..."
        variant="secondary-sm"
        toastMessage="전체 학생에게 추가되었습니다"
      />
    </form>
  );
}
