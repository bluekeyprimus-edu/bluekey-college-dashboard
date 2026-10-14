import { notFound } from "next/navigation";
import Link from "next/link";
import { getStudent, getStudentAccess, getExtracurriculars, getAwards, getAttachments } from "@/lib/data";
import {
  addExtracurricular,
  updateExtracurricular,
  deleteExtracurricular,
  addAward,
  updateAward,
  deleteAward,
} from "@/lib/actions";
import { Extracurricular, Award } from "@/lib/types";
import { AttachmentsSection } from "@/components/students/AttachmentsSection";
import { EC_STATUS_LABEL, EC_STATUS_OPTIONS, AWARD_LEVEL_LABEL, AWARD_LEVEL_OPTIONS } from "@/lib/labels";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-navy-500";

function EcFields({ d = {} }: { d?: Partial<Extracurricular> }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className={labelClass}>활동명 *</label>
          <input name="activity_name" required defaultValue={d.activity_name ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>카테고리</label>
          <input name="category" defaultValue={d.category ?? ""} placeholder="예: STEM, 봉사, 예술" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>진행 상태</label>
          <select name="status" defaultValue={d.status ?? "Developing"} className={inputClass}>
            {EC_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{EC_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>역할/직책</label>
          <input name="position_role" defaultValue={d.position_role ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>참여 학년</label>
          <input name="grades_participated" defaultValue={d.grades_participated ?? ""} placeholder="예: 10, 11, 12" className={inputClass} />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" name="common_app_activity" defaultChecked={d.common_app_activity ?? false} />
            Common App 활동으로 표시
          </label>
        </div>
        <div>
          <label className={labelClass}>시작일</label>
          <input type="date" name="start_date" defaultValue={d.start_date ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>종료일</label>
          <input type="date" name="end_date" defaultValue={d.end_date ?? ""} className={inputClass} />
          <p className="mt-1 text-[11px] text-navy-400">비워두면 현재 진행 중인 활동으로 표시돼요.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>활동 설명</label>
          <textarea name="description" rows={2} defaultValue={d.description ?? ""} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>전공 연관성</label>
          <input name="major_relevance" defaultValue={d.major_relevance ?? ""} className={inputClass} />
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gold-600">카운슬러 전용 평가 (학생·학부모 비공개)</div>
        <div className="rounded-lg border border-gold-200 bg-gold-50/40 p-3">
          <textarea
            name="counselor_evaluation"
            rows={4}
            placeholder="강점, 리더십, 임팩트, 독창성, 전공 연관성 등 자유롭게 서술해주세요."
            defaultValue={d.counselor_evaluation ?? ""}
            className={inputClass}
          />
        </div>
      </div>
    </>
  );
}

function AwardFields({ d = {} }: { d?: Partial<Award> }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="lg:col-span-2">
        <label className={labelClass}>수상명 *</label>
        <input name="award_name" required defaultValue={d.award_name ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>주최 기관</label>
        <input name="organization" defaultValue={d.organization ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>수상 학년</label>
        <select name="grade_level" defaultValue={d.grade_level ?? ""} className={inputClass}>
          <option value="">선택</option>
          {[8, 9, 10, 11, 12].map((g) => (
            <option key={g} value={g}>{g}학년</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>수상 레벨</label>
        <select name="award_level" defaultValue={d.award_level ?? "School"} className={inputClass}>
          {AWARD_LEVEL_OPTIONS.map((l) => (
            <option key={l} value={l}>{AWARD_LEVEL_LABEL[l]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>순위/등수</label>
        <input name="placement" defaultValue={d.placement ?? ""} placeholder="예: 1st Place" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>총 참가자 수</label>
        <input type="number" name="num_participants" defaultValue={d.num_participants ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>경쟁 강도/선발률</label>
        <input name="selectivity" defaultValue={d.selectivity ?? ""} placeholder="예: 상위 1%" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>학문 분야</label>
        <input name="academic_area" defaultValue={d.academic_area ?? ""} className={inputClass} />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <label className={labelClass}>전공 연관성</label>
        <input name="major_relevance" defaultValue={d.major_relevance ?? ""} className={inputClass} />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <label className={labelClass}>설명</label>
        <textarea name="description" rows={2} defaultValue={d.description ?? ""} className={inputClass} />
      </div>
    </div>
  );
}

export default async function ActivitiesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();
  const access = await getStudentAccess(id);
  if (!(access?.canViewAll || access?.canViewEc)) notFound();

  const [ecs, awards, attachments] = await Promise.all([getExtracurriculars(id), getAwards(id), getAttachments(id)]);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/students/${id}`} className="text-xs font-medium text-navy-400 hover:text-navy-600">
          ← {student.english_name ?? student.student_name}
        </Link>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-navy-900">과외활동 · 수상 경력</h1>
        <p className="text-sm text-navy-500">카운슬러 전용 평가는 학생/학부모 화면에 노출되지 않아요.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>과외활동</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <details className="rounded-lg border border-navy-100">
            <summary className="cursor-pointer list-none rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50">
              + 새 활동 추가
            </summary>
            <form action={addExtracurricular.bind(null, id)} className="space-y-4 border-t border-navy-100 p-3">
              <EcFields />
              <div className="flex justify-end">
                <SubmitButton label="추가" toastMessage="추가되었습니다" />
              </div>
            </form>
          </details>

          {ecs.length === 0 && <p className="text-sm text-navy-400">등록된 활동이 아직 없어요.</p>}

          {ecs.map((e) => (
            <details key={e.id} className="rounded-lg border border-navy-100">
              <summary className="cursor-pointer list-none rounded-lg px-3 py-2.5 hover:bg-navy-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-navy-900">{e.activity_name}</span>
                    <span className="ml-2 text-xs text-navy-400">
                      {e.position_role}
                      {e.start_date && ` · ${e.start_date} ~ ${e.end_date || "현재"}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {e.common_app_activity && <Pill tone="gold">Common App</Pill>}
                    <Pill tone="neutral">{EC_STATUS_LABEL[e.status] ?? e.status}</Pill>
                  </div>
                </div>
                {e.counselor_evaluation && (
                  <div className="mt-1 line-clamp-1 text-[11px] text-gold-600">{e.counselor_evaluation}</div>
                )}
              </summary>
              <div className="border-t border-navy-100 p-3">
                <form action={updateExtracurricular.bind(null, id, e.id)} className="space-y-4">
                  <EcFields d={e} />
                  <div className="flex justify-end">
                    <SubmitButton label="저장" toastMessage="저장되었습니다" />
                  </div>
                </form>
                <AttachmentsSection
                  studentId={id}
                  entityType="extracurricular"
                  entityId={e.id}
                  attachments={attachments.filter((a) => a.entity_id === e.id)}
                />
                <form action={deleteExtracurricular.bind(null, id, e.id)} className="mt-2 flex justify-end">
                  <SubmitButton label="이 활동 삭제" variant="ghost-danger" toastMessage="삭제되었습니다" />
                </form>
              </div>
            </details>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>수상 경력</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <details className="rounded-lg border border-navy-100">
            <summary className="cursor-pointer list-none rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50">
              + 새 수상 추가
            </summary>
            <form action={addAward.bind(null, id)} className="space-y-4 border-t border-navy-100 p-3">
              <AwardFields />
              <div className="flex justify-end">
                <SubmitButton label="추가" toastMessage="추가되었습니다" />
              </div>
            </form>
          </details>

          {awards.length === 0 && <p className="text-sm text-navy-400">등록된 수상 내역이 아직 없어요.</p>}

          {awards.map((a) => (
            <details key={a.id} className="rounded-lg border border-navy-100">
              <summary className="cursor-pointer list-none rounded-lg px-3 py-2.5 hover:bg-navy-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-navy-900">{a.award_name}</span>
                    <span className="ml-2 text-xs text-navy-400">{a.organization}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Pill tone="gold">{AWARD_LEVEL_LABEL[a.award_level] ?? a.award_level}</Pill>
                    {a.placement && <Pill tone="neutral">{a.placement}</Pill>}
                  </div>
                </div>
              </summary>
              <div className="border-t border-navy-100 p-3">
                <form action={updateAward.bind(null, id, a.id)} className="space-y-4">
                  <AwardFields d={a} />
                  <div className="flex justify-end">
                    <SubmitButton label="저장" toastMessage="저장되었습니다" />
                  </div>
                </form>
                <AttachmentsSection
                  studentId={id}
                  entityType="award"
                  entityId={a.id}
                  attachments={attachments.filter((att) => att.entity_id === a.id)}
                />
                <form action={deleteAward.bind(null, id, a.id)} className="mt-2 flex justify-end">
                  <SubmitButton label="이 수상 삭제" variant="ghost-danger" toastMessage="삭제되었습니다" />
                </form>
              </div>
            </details>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
