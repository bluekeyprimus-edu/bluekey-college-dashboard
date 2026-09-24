import { notFound } from "next/navigation";
import Link from "next/link";
import { getStudent, getConsultationNotes } from "@/lib/data";
import { addConsultationNote, updateConsultationNote, deleteConsultationNote } from "@/lib/actions";
import { ConsultationNote } from "@/lib/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-navy-500";

function NoteFields({ d = {} }: { d?: Partial<ConsultationNote> }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className={labelClass}>미팅 날짜 *</label>
        <input type="date" name="meeting_date" required defaultValue={d.meeting_date ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>참석자</label>
        <input name="attendees" defaultValue={d.attendees ?? ""} placeholder="예: 학생, 학부모" className={inputClass} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>상담 내용 *</label>
        <textarea name="content" required rows={5} defaultValue={d.content ?? ""} className={inputClass} />
      </div>
    </div>
  );
}

export default async function ConsultationNotesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();

  const notes = await getConsultationNotes(id);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/students/${id}`} className="text-xs font-medium text-navy-400 hover:text-navy-600">
          ← {student.english_name ?? student.student_name}
        </Link>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-navy-900">상담 내역</h1>
        <p className="text-sm text-navy-500">학생·학부모 미팅 내용을 정리해서 기록해요. 학부모 화면에도 함께 표시돼요.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>상담 기록</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <details className="rounded-lg border border-navy-100">
            <summary className="cursor-pointer list-none rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50">
              + 새 상담 기록 추가
            </summary>
            <form action={addConsultationNote.bind(null, id)} className="space-y-4 border-t border-navy-100 p-3">
              <NoteFields d={{ meeting_date: new Date().toISOString().slice(0, 10) }} />
              <div className="flex justify-end">
                <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                  추가
                </button>
              </div>
            </form>
          </details>

          {notes.length === 0 && <p className="text-sm text-navy-400">등록된 상담 기록이 아직 없어요.</p>}

          {notes.map((n) => (
            <details key={n.id} className="rounded-lg border border-navy-100">
              <summary className="cursor-pointer list-none rounded-lg px-3 py-2.5 hover:bg-navy-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-navy-900">{n.meeting_date}</span>
                    {n.attendees && <span className="ml-2 text-xs text-navy-400">{n.attendees}</span>}
                  </div>
                  {n.counselor_name && <span className="text-xs text-navy-400">{n.counselor_name}</span>}
                </div>
                <div className="mt-1 line-clamp-2 text-xs text-navy-500">{n.content}</div>
              </summary>
              <div className="border-t border-navy-100 p-3">
                <form action={updateConsultationNote.bind(null, id, n.id)} className="space-y-4">
                  <NoteFields d={n} />
                  <div className="flex justify-end">
                    <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                      저장
                    </button>
                  </div>
                </form>
                <form action={deleteConsultationNote.bind(null, id, n.id)} className="mt-2 flex justify-end">
                  <button type="submit" className="text-xs font-medium text-rose-500 hover:text-rose-700">
                    이 상담 기록 삭제
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
