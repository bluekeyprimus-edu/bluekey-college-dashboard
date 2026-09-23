import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudent, getPersonalStatement, getSupplementalEssays } from "@/lib/data";
import { upsertPersonalStatement, addSupplementalEssay, updateSupplementalEssay, deleteSupplementalEssay } from "@/lib/actions";
import { SupplementalEssay } from "@/lib/types";
import { ESSAY_STATUS_LABEL, ESSAY_STATUS_OPTIONS } from "@/lib/labels";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-navy-500";

function statusTone(status: string): "green" | "amber" | "neutral" | "gold" {
  if (status === "Completed") return "green";
  if (status === "Brainstorming" || status === "Topic Selected") return "neutral";
  return "amber";
}

function EssayFields({ d = {} }: { d?: Partial<SupplementalEssay> }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="lg:col-span-2">
        <label className={labelClass}>대학명 *</label>
        <input name="university_name" required defaultValue={d.university_name ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>글자수 제한</label>
        <input type="number" name="word_limit" defaultValue={d.word_limit ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>진행 상태</label>
        <select name="status" defaultValue={d.status ?? "Brainstorming"} className={inputClass}>
          {ESSAY_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{ESSAY_STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <label className={labelClass}>에세이 프롬프트</label>
        <textarea name="prompt" rows={2} defaultValue={d.prompt ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>초안 링크</label>
        <input name="draft_link" defaultValue={d.draft_link ?? ""} placeholder="https://docs.google.com/..." className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>담당 카운슬러</label>
        <input name="counselor" defaultValue={d.counselor ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>편집자</label>
        <input name="editor" defaultValue={d.editor ?? ""} className={inputClass} />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <label className={labelClass}>카운슬러 코멘트</label>
        <textarea name="counselor_comments" rows={2} defaultValue={d.counselor_comments ?? ""} className={inputClass} />
      </div>
    </div>
  );
}

export default async function EssaysPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();

  const [personalStatement, essays] = await Promise.all([getPersonalStatement(id), getSupplementalEssays(id)]);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/students/${id}`} className="text-xs font-medium text-navy-400 hover:text-navy-600">
          ← {student.english_name ?? student.student_name}
        </Link>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-navy-900">에세이 관리</h1>
        <p className="text-sm text-navy-500">자기소개서와 대학별 추가 에세이의 진행 상황을 관리하세요.</p>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>자기소개서 (Personal Statement)</CardTitle>
          {personalStatement && <Pill tone={statusTone(personalStatement.status)}>{ESSAY_STATUS_LABEL[personalStatement.status]}</Pill>}
        </CardHeader>
        <CardBody>
          <form action={upsertPersonalStatement.bind(null, id)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className={labelClass}>주제</label>
                <input name="topic" defaultValue={personalStatement?.topic ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>진행 상태</label>
                <select name="status" defaultValue={personalStatement?.status ?? "Brainstorming"} className={inputClass}>
                  {ESSAY_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{ESSAY_STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>초안 링크</label>
              <input
                name="draft_link"
                defaultValue={personalStatement?.draft_link ?? ""}
                placeholder="https://docs.google.com/..."
                className={inputClass}
              />
            </div>
            {personalStatement?.last_updated && (
              <p className="text-xs text-navy-400">최근 수정: {new Date(personalStatement.last_updated).toLocaleDateString("ko-KR")}</p>
            )}
            <div className="flex justify-end">
              <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                저장
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>대학별 추가 에세이 (Supplemental Essays)</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <details className="rounded-lg border border-navy-100">
            <summary className="cursor-pointer list-none rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50">
              + 새 에세이 추가
            </summary>
            <form action={addSupplementalEssay.bind(null, id)} className="space-y-4 border-t border-navy-100 p-3">
              <EssayFields />
              <div className="flex justify-end">
                <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                  추가
                </button>
              </div>
            </form>
          </details>

          {essays.length === 0 && <p className="text-sm text-navy-400">등록된 추가 에세이가 아직 없어요.</p>}

          {essays.map((e) => (
            <details key={e.id} className="rounded-lg border border-navy-100">
              <summary className="cursor-pointer list-none rounded-lg px-3 py-2.5 hover:bg-navy-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-navy-900">{e.university_name}</span>
                    {e.word_limit && <span className="ml-2 text-xs text-navy-400">{e.word_limit}자 제한</span>}
                  </div>
                  <Pill tone={statusTone(e.status)}>{ESSAY_STATUS_LABEL[e.status]}</Pill>
                </div>
                {e.prompt && <div className="mt-1 line-clamp-1 text-xs text-navy-400">{e.prompt}</div>}
              </summary>
              <div className="border-t border-navy-100 p-3">
                <form action={updateSupplementalEssay.bind(null, id, e.id)} className="space-y-4">
                  <EssayFields d={e} />
                  <div className="flex justify-end">
                    <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                      저장
                    </button>
                  </div>
                </form>
                <form action={deleteSupplementalEssay.bind(null, id, e.id)} className="mt-2 flex justify-end">
                  <button type="submit" className="text-xs font-medium text-rose-500 hover:text-rose-700">
                    이 에세이 삭제
                  </button>
                </form>
              </div>
            </details>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
