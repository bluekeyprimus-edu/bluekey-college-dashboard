import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isParentLinkedToStudent } from "@/lib/parent";
import {
  getStudent,
  getAcademicOverview,
  getGradeRecords,
  getTerms,
  getCourses,
  getSatScores,
  getActScores,
  getApScores,
  getExtracurriculars,
  getAwards,
  getCollegeList,
  getPersonalStatement,
  getSupplementalEssays,
  getTasks,
  getConsultationNotes,
  getAttachments,
} from "@/lib/data";
import { computeCourseLevelCounts, computeGradeGpa, computeTermGpa, computeCumulativeGpa, computeGpaTrendFromGrades, isLowGrade } from "@/lib/gpa";
import { Attachment } from "@/lib/types";
import { buildActivityFeed, relativeKorean, type ActivityItem } from "@/lib/activity";
import {
  EC_STATUS_LABEL,
  AWARD_LEVEL_LABEL,
  COLLEGE_CATEGORY_LABEL,
  ESSAY_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  SUBJECT_CATEGORY_LABEL,
  TERM_NOUN,
} from "@/lib/labels";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Disclosure } from "@/components/ui/Disclosure";
import { LogoutButton } from "@/components/auth/LogoutButton";

export const dynamic = "force-dynamic";

// Parent-facing view. Deliberately never reads or renders: extracurricular
// rating_* fields, college_list.counselor_recommendation/notes, essay
// draft_link/counselor/editor/counselor_comments, or task notes — those are
// counselor-internal and must never reach this page. Consultation notes ARE
// shown here — the counselor confirmed parents should see meeting summaries.
// Attachments are shown here too, but view-only — no upload/delete form,
// unlike the counselor-facing activities/essays pages.

const GRADE_LEVELS = [9, 10, 11, 12] as const;

function attachmentsFor(all: Attachment[], entityId: string): Attachment[] {
  return all.filter((a) => a.entity_id === entityId);
}

function AttachmentLinks({ items }: { items: Attachment[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
      {items.map((a) => (
        <a
          key={a.id}
          href={a.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-gold-600 hover:text-gold-700"
        >
          📎 {a.file_name}
        </a>
      ))}
    </div>
  );
}

export default async function ParentStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const authorized = await isParentLinkedToStudent(user.id, studentId);
  if (!authorized) redirect("/parent");

  const student = await getStudent(studentId);
  if (!student) notFound();

  const [academic, gradeRecords, terms, courses, sat, act, ap, ecs, awards, colleges, personalStatement, essays, tasks, consultationNotes, attachments] =
    await Promise.all([
      getAcademicOverview(studentId),
      getGradeRecords(studentId),
      getTerms(studentId),
      getCourses(studentId),
      getSatScores(studentId),
      getActScores(studentId),
      getApScores(studentId),
      getExtracurriculars(studentId),
      getAwards(studentId),
      getCollegeList(studentId),
      getPersonalStatement(studentId),
      getSupplementalEssays(studentId),
      getTasks(studentId),
      getConsultationNotes(studentId),
      getAttachments(studentId),
    ]);

  const bestSat = sat.length ? Math.max(...sat.map((s) => s.total_score)) : null;
  const bestAct = act.length ? Math.max(...act.map((a) => a.composite)) : null;
  const levelCounts = computeCourseLevelCounts(courses);
  const trend = computeGpaTrendFromGrades(gradeRecords, terms, courses);
  const cumulativeGpa = computeCumulativeGpa(
    gradeRecords,
    terms,
    courses,
    academic ? { unweighted: academic.unweighted_gpa, weighted: academic.weighted_gpa } : undefined
  );
  const pendingTasks = tasks.filter((t) => t.status !== "Completed");

  const gpaByGradeLevel: Record<number, ReturnType<typeof computeGradeGpa> | null> = { 9: null, 10: null, 11: null, 12: null };
  for (const gr of gradeRecords) {
    gpaByGradeLevel[gr.grade_level] = computeGradeGpa(gr, terms, courses);
  }

  const activityFeed = buildActivityFeed({
    tasks,
    extracurriculars: ecs,
    awards,
    colleges,
    personalStatement,
    essays,
    consultationNotes,
    attachments,
  }).slice(0, 10);

  const categoriesByCollege: Record<string, typeof colleges> = {};
  for (const c of colleges) {
    categoriesByCollege[c.category] = [...(categoriesByCollege[c.category] ?? []), c];
  }

  // Adaptive layout (per counselor feedback): a 12th grader actively
  // applying needs the college-list/essay tracking front and center; an
  // underclassman with no application activity yet just sees empty grids
  // there, which reads as broken rather than "not started yet" — so for
  // them those two sections collapse into one short notice and the
  // profile-building sections (academics, EC, consultation notes, tasks)
  // move up instead. A junior who already started early still gets the
  // full view, since hasApplicationActivity flips it on regardless of grade.
  const hasApplicationActivity = colleges.length > 0 || essays.length > 0;
  const isApplicationStage = student.current_grade >= 12 || hasApplicationActivity;

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Image src="/logo.png" alt="BlueKey" width={32} height={32} className="h-8 w-8 rounded-md object-cover" />
        <div>
          <div className="font-serif text-lg font-semibold text-navy-900">
            {student.english_name ?? student.student_name}
          </div>
          <div className="text-xs text-navy-400">
            {student.high_school} · {student.graduation_year}년 졸업
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/parent" className="text-xs font-medium text-navy-400 hover:text-navy-600">
          다른 자녀 보기
        </Link>
        <LogoutButton />
      </div>
    </div>
  );

  function activityDetail(item: ActivityItem) {
    if (item.id === "personal-statement") {
      const ps = personalStatement;
      if (!ps) return null;
      return (
        <dl className="space-y-1 text-xs text-navy-500">
          {ps.topic && (
            <div>
              <dt className="inline font-medium text-navy-600">주제 · </dt>
              <dd className="inline">{ps.topic}</dd>
            </div>
          )}
          <div>
            <dt className="inline font-medium text-navy-600">상태 · </dt>
            <dd className="inline">{ESSAY_STATUS_LABEL[ps.status] ?? ps.status}</dd>
          </div>
        </dl>
      );
    }
    if (item.id.startsWith("task-")) {
      const t = tasks.find((x) => x.id === item.id.slice(5));
      if (!t) return null;
      return (
        <dl className="space-y-1 text-xs text-navy-500">
          <div>
            <dt className="inline font-medium text-navy-600">우선순위 · </dt>
            <dd className="inline">{TASK_PRIORITY_LABEL[t.priority] ?? t.priority}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-navy-600">상태 · </dt>
            <dd className="inline">{TASK_STATUS_LABEL[t.status] ?? t.status}</dd>
          </div>
          {t.deadline && (
            <div>
              <dt className="inline font-medium text-navy-600">마감일 · </dt>
              <dd className="inline">{t.deadline}</dd>
            </div>
          )}
          {t.assigned_to && (
            <div>
              <dt className="inline font-medium text-navy-600">담당 · </dt>
              <dd className="inline">{t.assigned_to}</dd>
            </div>
          )}
        </dl>
      );
    }
    if (item.id.startsWith("ec-")) {
      const e = ecs.find((x) => x.id === item.id.slice(3));
      if (!e) return null;
      return (
        <dl className="space-y-1 text-xs text-navy-500">
          {e.category && (
            <div>
              <dt className="inline font-medium text-navy-600">분야 · </dt>
              <dd className="inline">{e.category}</dd>
            </div>
          )}
          {e.position_role && (
            <div>
              <dt className="inline font-medium text-navy-600">역할 · </dt>
              <dd className="inline">{e.position_role}</dd>
            </div>
          )}
          {e.grades_participated && (
            <div>
              <dt className="inline font-medium text-navy-600">참여 학년 · </dt>
              <dd className="inline">{e.grades_participated}</dd>
            </div>
          )}
          {e.major_relevance && (
            <div>
              <dt className="inline font-medium text-navy-600">전공 연관성 · </dt>
              <dd className="inline">{e.major_relevance}</dd>
            </div>
          )}
          {e.description && (
            <div>
              <dt className="font-medium text-navy-600">상세 설명</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-navy-600">{e.description}</dd>
            </div>
          )}
        </dl>
      );
    }
    if (item.id.startsWith("award-")) {
      const a = awards.find((x) => x.id === item.id.slice(6));
      if (!a) return null;
      return (
        <dl className="space-y-1 text-xs text-navy-500">
          {a.organization && (
            <div>
              <dt className="inline font-medium text-navy-600">주관 기관 · </dt>
              <dd className="inline">{a.organization}</dd>
            </div>
          )}
          {a.academic_area && (
            <div>
              <dt className="inline font-medium text-navy-600">분야 · </dt>
              <dd className="inline">{a.academic_area}</dd>
            </div>
          )}
          {a.selectivity && (
            <div>
              <dt className="inline font-medium text-navy-600">경쟁률/선발성 · </dt>
              <dd className="inline">{a.selectivity}</dd>
            </div>
          )}
          {a.description && (
            <div>
              <dt className="font-medium text-navy-600">상세 설명</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-navy-600">{a.description}</dd>
            </div>
          )}
        </dl>
      );
    }
    if (item.id.startsWith("college-")) {
      const c = colleges.find((x) => x.id === item.id.slice(8));
      if (!c) return null;
      return (
        <dl className="space-y-1 text-xs text-navy-500">
          <div>
            <dt className="inline font-medium text-navy-600">분류 · </dt>
            <dd className="inline">{COLLEGE_CATEGORY_LABEL[c.category] ?? c.category}</dd>
          </div>
          {c.intended_major && (
            <div>
              <dt className="inline font-medium text-navy-600">희망 전공 · </dt>
              <dd className="inline">{c.intended_major}</dd>
            </div>
          )}
          {c.application_round && (
            <div>
              <dt className="inline font-medium text-navy-600">지원 라운드 · </dt>
              <dd className="inline">{c.application_round}</dd>
            </div>
          )}
          {c.application_deadline && (
            <div>
              <dt className="inline font-medium text-navy-600">마감일 · </dt>
              <dd className="inline">{c.application_deadline}</dd>
            </div>
          )}
        </dl>
      );
    }
    if (item.id.startsWith("essay-")) {
      const e = essays.find((x) => x.id === item.id.slice(6));
      if (!e) return null;
      return (
        <dl className="space-y-1 text-xs text-navy-500">
          {e.university_name && (
            <div>
              <dt className="inline font-medium text-navy-600">대학 · </dt>
              <dd className="inline">{e.university_name}</dd>
            </div>
          )}
          {e.prompt && (
            <div>
              <dt className="font-medium text-navy-600">프롬프트</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-navy-600">{e.prompt}</dd>
            </div>
          )}
          {e.word_limit && (
            <div>
              <dt className="inline font-medium text-navy-600">글자 제한 · </dt>
              <dd className="inline">{e.word_limit}자</dd>
            </div>
          )}
          <div>
            <dt className="inline font-medium text-navy-600">상태 · </dt>
            <dd className="inline">{ESSAY_STATUS_LABEL[e.status] ?? e.status}</dd>
          </div>
        </dl>
      );
    }
    if (item.id.startsWith("note-")) {
      const n = consultationNotes.find((x) => x.id === item.id.slice(5));
      if (!n) return null;
      return (
        <dl className="space-y-1 text-xs text-navy-500">
          {n.attendees && (
            <div>
              <dt className="inline font-medium text-navy-600">참석자 · </dt>
              <dd className="inline">{n.attendees}</dd>
            </div>
          )}
          {n.counselor_name && (
            <div>
              <dt className="inline font-medium text-navy-600">담당 카운슬러 · </dt>
              <dd className="inline">{n.counselor_name}</dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-navy-600">내용</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-navy-600">{n.content}</dd>
          </div>
        </dl>
      );
    }
    if (item.id.startsWith("attachment-")) {
      const att = attachments.find((x) => x.id === item.id.slice(11));
      if (!att) return null;
      return (
        <a
          href={att.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-gold-600 hover:text-gold-700"
        >
          📎 {att.file_name} 열기
        </a>
      );
    }
    return null;
  }

  const activityCard = (
    <Card>
      <CardHeader>
        <CardTitle>최근 진행 현황</CardTitle>
      </CardHeader>
      <CardBody>
        {activityFeed.length === 0 ? (
          <p className="text-sm text-navy-400">아직 업데이트된 내용이 없어요.</p>
        ) : (
          <ul className="space-y-3">
            {activityFeed.map((item) => {
              const detail = activityDetail(item);
              return (
                <Disclosure
                  key={item.id}
                  summary={
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Pill tone={item.state === "completed" ? "green" : item.state === "in_progress" ? "amber" : "neutral"}>
                            {item.state === "completed" ? "완료" : item.state === "in_progress" ? "진행 중" : "업데이트"}
                          </Pill>
                          <span className="text-[11px] font-medium uppercase tracking-wide text-navy-400">{item.category}</span>
                        </div>
                        <div className="mt-1 text-sm text-navy-900">{item.title}</div>
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-xs text-navy-400">{relativeKorean(item.at)}</span>
                    </div>
                  }
                >
                  {detail ?? <p className="text-xs text-navy-400">추가로 볼 수 있는 정보가 없어요.</p>}
                </Disclosure>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );

  const academicsRow = (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>학업 프로필</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">Unweighted GPA</div>
            <div className="mt-0.5 text-sm text-navy-900">{cumulativeGpa.unweighted?.toFixed(2) ?? "—"}</div>
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">Weighted GPA</div>
            <div className="mt-0.5 text-sm text-navy-900">{cumulativeGpa.weighted?.toFixed(2) ?? "—"}</div>
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">석차</div>
            <div className="mt-0.5 text-sm text-navy-900">
              {academic?.school_does_not_rank ? "석차 미산정 학교" : academic?.class_rank ? `${academic.class_rank} / ${academic.class_size}` : "—"}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">GPA 추세</div>
            <div className="mt-0.5 text-sm text-navy-900">{trend}</div>
          </div>
          <div className="col-span-2">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-navy-400">학년별 GPA</div>
            <div className="flex flex-wrap gap-2">
              {GRADE_LEVELS.map((g) => {
                const gradeRecord = gradeRecords.find((gr) => gr.grade_level === g);
                const eff = gpaByGradeLevel[g];
                const gradeTerms = gradeRecord
                  ? terms.filter((t) => t.grade_record_id === gradeRecord.id).sort((a, b) => a.term_number - b.term_number)
                  : [];
                const hasDetail = gradeTerms.some((t) => courses.some((c) => c.term_id === t.id));
                return (
                  <details key={g} className="group rounded-lg border border-navy-100 open:bg-navy-50/50">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-1.5 text-center select-none">
                      <div>
                        <div className="text-[10px] text-navy-400">{g}학년</div>
                        <div className="text-sm font-semibold text-navy-900">{eff?.unweighted?.toFixed(2) ?? "—"}</div>
                      </div>
                      {hasDetail && (
                        <span className="text-[10px] text-navy-300 group-open:rotate-180">▾</span>
                      )}
                    </summary>
                    {hasDetail && gradeRecord && (
                      <div className="w-56 space-y-2 border-t border-navy-100 px-3 py-2 sm:w-64">
                        {gradeTerms.map((term) => {
                          const termCourses = courses.filter((c) => c.term_id === term.id);
                          if (termCourses.length === 0) return null;
                          const termEff = computeTermGpa(term, courses);
                          return (
                            <div key={term.id} className="space-y-0.5">
                              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-navy-400">
                                <span>
                                  {TERM_NOUN[gradeRecord.term_system]} {term.term_number}
                                </span>
                                <span>{termEff.unweighted?.toFixed(2) ?? "—"}</span>
                              </div>
                              {termCourses.map((c) => (
                                <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                                  <span className="truncate text-navy-700">{c.course_name}</span>
                                  <span className="shrink-0 text-[10px] text-navy-400">
                                    <span className={isLowGrade(c) ? "font-semibold text-rose-600" : undefined}>
                                      {(c.grade_scale === "letter" ? c.letter_grade : c.grade_scale === "100_point" ? c.point_score : c.custom_grade) ?? "—"}
                                    </span>
                                    {" · "}
                                    {c.course_level}
                                    {c.subject_category ? ` · ${SUBJECT_CATEGORY_LABEL[c.subject_category]}` : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </details>
                );
              })}
            </div>
          </div>
          {(() => {
            // Only list the levels this student's school actually has courses
            // in — an AP-only school showing "IB HL: 0개" reads as something
            // missing rather than simply not applicable there.
            const present = [
              levelCounts.ap > 0 && { label: "AP", count: levelCounts.ap },
              levelCounts.ibHl > 0 && { label: "IB High Level", count: levelCounts.ibHl },
              levelCounts.ibSl > 0 && { label: "IB Standard Level", count: levelCounts.ibSl },
              levelCounts.honors > 0 && { label: "Honors", count: levelCounts.honors },
            ].filter((x): x is { label: string; count: number } => Boolean(x));
            if (present.length === 0) return null;
            return (
              <div className="col-span-2">
                <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">AP / IB / Honors</div>
                <div className="mt-0.5 text-sm text-navy-900">
                  {present.map((p) => `${p.label} ${p.count}개`).join(" · ")}
                </div>
              </div>
            );
          })()}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>표준화 시험</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">최고 SAT</div>
              <div className="mt-0.5 text-sm text-navy-900">{bestSat ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">최고 ACT</div>
              <div className="mt-0.5 text-sm text-navy-900">{bestAct ?? "—"}</div>
            </div>
          </div>
          {ap.length > 0 && (
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-navy-400">AP 시험</div>
              <div className="flex flex-wrap gap-1.5">
                {ap.map((a) => (
                  <Pill key={a.id} tone={a.score >= 4 ? "green" : "neutral"}>{a.subject} {a.score}</Pill>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );

  const ecAwardsCard = (
    <Card>
      <CardHeader>
        <CardTitle>과외활동 · 수상 경력</CardTitle>
      </CardHeader>
      <CardBody className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-navy-400">과외활동 (클릭하면 상세 정보)</div>
          {ecs.length === 0 && <p className="text-sm text-navy-400">등록된 활동이 아직 없어요.</p>}
          {ecs.map((e) => (
            <Disclosure
              key={e.id}
              summary={
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-navy-900">{e.activity_name}</span>
                    <Pill tone="neutral">{EC_STATUS_LABEL[e.status] ?? e.status}</Pill>
                  </div>
                  <div className="text-xs text-navy-400">
                    {e.position_role}
                    {e.start_date && ` · ${e.start_date} ~ ${e.end_date || "현재"}`}
                  </div>
                  <AttachmentLinks items={attachmentsFor(attachments, e.id)} />
                </div>
              }
            >
              <dl className="space-y-1 text-xs text-navy-500">
                {e.category && (
                  <div>
                    <dt className="inline font-medium text-navy-600">분야 · </dt>
                    <dd className="inline">{e.category}</dd>
                  </div>
                )}
                {e.grades_participated && (
                  <div>
                    <dt className="inline font-medium text-navy-600">참여 학년 · </dt>
                    <dd className="inline">{e.grades_participated}</dd>
                  </div>
                )}
                <div>
                  <dt className="inline font-medium text-navy-600">Common App 활동 · </dt>
                  <dd className="inline">{e.common_app_activity ? "예" : "아니오"}</dd>
                </div>
                {e.major_relevance && (
                  <div>
                    <dt className="inline font-medium text-navy-600">전공 연관성 · </dt>
                    <dd className="inline">{e.major_relevance}</dd>
                  </div>
                )}
                {e.description && (
                  <div>
                    <dt className="font-medium text-navy-600">상세 설명</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-navy-600">{e.description}</dd>
                  </div>
                )}
                {!e.category && !e.grades_participated && !e.major_relevance && !e.description && (
                  <p>추가로 등록된 상세 정보가 없어요.</p>
                )}
              </dl>
            </Disclosure>
          ))}
        </div>
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-navy-400">수상 경력 (클릭하면 상세 정보)</div>
          {awards.length === 0 && <p className="text-sm text-navy-400">등록된 수상 내역이 아직 없어요.</p>}
          {awards.map((a) => (
            <Disclosure
              key={a.id}
              summary={
                <div>
                  <div className="text-sm font-medium text-navy-900">{a.award_name}</div>
                  <div className="text-xs text-navy-400">
                    {AWARD_LEVEL_LABEL[a.award_level] ?? a.award_level}
                    {a.placement && ` · ${a.placement}`}
                  </div>
                  <AttachmentLinks items={attachmentsFor(attachments, a.id)} />
                </div>
              }
            >
              <dl className="space-y-1 text-xs text-navy-500">
                {a.organization && (
                  <div>
                    <dt className="inline font-medium text-navy-600">주관 기관 · </dt>
                    <dd className="inline">{a.organization}</dd>
                  </div>
                )}
                {a.grade_level && (
                  <div>
                    <dt className="inline font-medium text-navy-600">수상 학년 · </dt>
                    <dd className="inline">{a.grade_level}학년</dd>
                  </div>
                )}
                {a.academic_area && (
                  <div>
                    <dt className="inline font-medium text-navy-600">분야 · </dt>
                    <dd className="inline">{a.academic_area}</dd>
                  </div>
                )}
                {a.selectivity && (
                  <div>
                    <dt className="inline font-medium text-navy-600">경쟁률/선발성 · </dt>
                    <dd className="inline">{a.selectivity}</dd>
                  </div>
                )}
                {a.num_participants && (
                  <div>
                    <dt className="inline font-medium text-navy-600">참가 인원 · </dt>
                    <dd className="inline">{a.num_participants}명</dd>
                  </div>
                )}
                {a.major_relevance && (
                  <div>
                    <dt className="inline font-medium text-navy-600">전공 연관성 · </dt>
                    <dd className="inline">{a.major_relevance}</dd>
                  </div>
                )}
                {a.description && (
                  <div>
                    <dt className="font-medium text-navy-600">상세 설명</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-navy-600">{a.description}</dd>
                  </div>
                )}
                {!a.organization && !a.grade_level && !a.academic_area && !a.selectivity && !a.num_participants && !a.major_relevance && !a.description && (
                  <p>추가로 등록된 상세 정보가 없어요.</p>
                )}
              </dl>
            </Disclosure>
          ))}
        </div>
      </CardBody>
    </Card>
  );

  const consultationCard = (
    <Card>
      <CardHeader>
        <CardTitle>상담 내역</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        {consultationNotes.length === 0 && <p className="text-sm text-navy-400">등록된 상담 기록이 아직 없어요.</p>}
        {consultationNotes.map((n) => (
          <div key={n.id} className="border-b border-navy-100 pb-3 last:border-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-navy-900">{n.meeting_date}</span>
              <div className="flex items-center gap-2 text-xs text-navy-400">
                {n.attendees && <span>{n.attendees}</span>}
                {n.counselor_name && <span>{n.counselor_name}</span>}
              </div>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-navy-600">{n.content}</p>
          </div>
        ))}
      </CardBody>
    </Card>
  );

  const tasksCard = (
    <Card>
      <CardHeader>
        <CardTitle>진행 중인 할일</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        {pendingTasks.length === 0 && <p className="text-sm text-navy-400">진행 중인 할일이 없어요.</p>}
        {pendingTasks.map((t) => (
          <div key={t.id} className="border-b border-navy-100 pb-2 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-navy-900">{t.task}</span>
              <Pill tone={t.priority === "High" ? "red" : t.priority === "Medium" ? "amber" : "neutral"}>
                {TASK_PRIORITY_LABEL[t.priority] ?? t.priority}
              </Pill>
            </div>
            <div className="text-xs text-navy-400">
              {TASK_STATUS_LABEL[t.status] ?? t.status}
              {t.deadline && ` · 마감 ${t.deadline}`}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );

  const collegeListCard = (
    <Card>
      <CardHeader>
        <CardTitle>컬리지 리스트</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {(["Reach", "High Target", "Target", "Likely", "Safety"] as const).map((cat) => (
            <div key={cat}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">{COLLEGE_CATEGORY_LABEL[cat]}</div>
              <div className="space-y-2">
                {(categoriesByCollege[cat] ?? []).map((c) => (
                  <div key={c.id} className="rounded-lg border border-navy-100 px-3 py-2">
                    <div className="text-sm font-medium text-navy-900">{c.university_name}</div>
                    <div className="text-xs text-navy-400">
                      {c.application_round ?? "라운드 미정"}
                      {c.application_deadline && ` · ${c.application_deadline}`}
                    </div>
                  </div>
                ))}
                {(categoriesByCollege[cat] ?? []).length === 0 && (
                  <div className="rounded-lg border border-dashed border-navy-200 px-3 py-2 text-xs text-navy-300">없음</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );

  const essayCard = (
    <Card>
      <CardHeader>
        <CardTitle>에세이</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-navy-900">자기소개서</span>
          <Pill tone="gold">{personalStatement ? ESSAY_STATUS_LABEL[personalStatement.status] : "미작성"}</Pill>
        </div>
        <AttachmentLinks items={attachmentsFor(attachments, studentId)} />
        {essays.length === 0 && <p className="text-sm text-navy-400">등록된 추가 에세이가 아직 없어요.</p>}
        {essays.map((e) => (
          <div key={e.id} className="border-b border-navy-100 pb-2 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-navy-900">{e.university_name}</span>
              <Pill tone="neutral">{ESSAY_STATUS_LABEL[e.status] ?? e.status}</Pill>
            </div>
            <AttachmentLinks items={attachmentsFor(attachments, e.id)} />
          </div>
        ))}
      </CardBody>
    </Card>
  );

  const notYetApplyingCard = (
    <Card>
      <CardHeader>
        <CardTitle>컬리지 리스트 · 에세이</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-sm text-navy-400">
          아직 대학 지원 준비 단계 전이에요. 지원 시즌이 다가오면 이 자리에 컬리지 리스트와 에세이 진행 상황이 표시돼요.
        </p>
      </CardBody>
    </Card>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {header}
      {activityCard}
      {academicsRow}
      {ecAwardsCard}
      {isApplicationStage ? (
        <>
          {collegeListCard}
          {consultationCard}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {essayCard}
            {tasksCard}
          </div>
        </>
      ) : (
        <>
          {consultationCard}
          {tasksCard}
          {notYetApplyingCard}
        </>
      )}
    </div>
  );
}
