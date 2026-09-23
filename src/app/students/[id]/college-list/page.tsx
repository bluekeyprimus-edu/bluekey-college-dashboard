import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudent, getCollegeList } from "@/lib/data";
import { addCollegeToList } from "@/lib/actions";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { CollegeBoard } from "@/components/students/CollegeBoard";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-gold-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-navy-500";

export default async function CollegeListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();

  const colleges = await getCollegeList(id);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/students/${id}`} className="text-xs font-medium text-navy-400 hover:text-navy-600">
          ← {student.english_name ?? student.student_name}
        </Link>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-navy-900">컬리지 리스트</h1>
        <p className="text-sm text-navy-500">
          카드를 드래그해서 분류를 바꾸거나, 카드를 클릭해서 지원 세부정보와 체크리스트를 관리하세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>대학 추가</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={addCollegeToList.bind(null, id)} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}>분류 *</label>
              <select name="category" required defaultValue="" className={inputClass}>
                <option value="" disabled>선택</option>
                {["Reach", "High Target", "Target", "Likely", "Safety"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-1 lg:col-span-2">
              <label className={labelClass}>대학명 *</label>
              <input name="university_name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>희망 전공</label>
              <input name="intended_major" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>지원 라운드</label>
              <select name="application_round" defaultValue="" className={inputClass}>
                <option value="">미정</option>
                {["ED", "ED2", "EA", "REA", "RD"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>마감일</label>
              <input type="date" name="application_deadline" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>학생 선호도</label>
              <select name="student_preference_level" defaultValue="" className={inputClass}>
                <option value="">미정</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} / 5</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>학부모 선호도</label>
              <select name="parent_preference_level" defaultValue="" className={inputClass}>
                <option value="">미정</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} / 5</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className={labelClass}>카운슬러 추천 코멘트</label>
              <input name="counselor_recommendation" className={inputClass} />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className={labelClass}>메모</label>
              <input name="notes" className={inputClass} />
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-4">
              <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                + 대학 추가
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      <CollegeBoard studentId={id} initialColleges={colleges} />
    </div>
  );
}
