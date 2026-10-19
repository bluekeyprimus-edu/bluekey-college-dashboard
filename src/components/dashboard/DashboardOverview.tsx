"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { RosterRow } from "@/lib/data";
import { Card, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusDot } from "@/components/ui/StatusDot";
import { Pill } from "@/components/ui/Pill";
import { NextActionCell } from "@/components/dashboard/NextActionCell";
import { AttentionNeededPanel } from "@/components/dashboard/AttentionNeededPanel";
import { UpcomingDeadlinesPanel } from "@/components/dashboard/UpcomingDeadlinesPanel";
import { StudentDrilldown } from "@/components/dashboard/StudentDrilldown";
import { cn } from "@/lib/cn";
import { TrackStatus } from "@/lib/types";

type QuickFilter = "all" | "green" | "yellow" | "red" | "deadlineWeek" | "pendingTasks";

const STATUS_RANK: Record<TrackStatus, number> = { red: 0, yellow: 1, green: 2 };

type SortKey = "priority" | "name" | "grade" | "classOf" | "progress" | "deadline" | "pendingTasks";

function StatCard({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number | string;
  tone?: "gold" | "green" | "amber" | "red";
  active: boolean;
  onClick: () => void;
}) {
  const toneClass =
    tone === "gold" ? "text-gold-600" : tone === "green" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : tone === "red" ? "text-rose-600" : "text-navy-900";
  return (
    <button type="button" onClick={onClick} className="flex-1 text-left">
      <Card className={cn("transition-all hover:border-gold-300", active && "border-gold-400 ring-1 ring-gold-300")}>
        <CardBody>
          <div className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</div>
          <div className={`mt-1.5 font-serif text-3xl font-semibold ${toneClass}`}>{value}</div>
        </CardBody>
      </Card>
    </button>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function DashboardOverview({ rows, restricted }: { rows: RosterRow[]; restricted: boolean }) {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [classOfFilter, setClassOfFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const total = rows.length;
  const onTrack = rows.filter((r) => r.status === "green").length;
  const attention = rows.filter((r) => r.status === "yellow").length;
  const urgent = rows.filter((r) => r.status === "red").length;
  const deadlinesThisWeek = rows.filter((r) => r.nextDeadline && r.nextDeadline.days >= 0 && r.nextDeadline.days <= 7).length;
  const totalPendingTasks = rows.reduce((a, r) => a + r.pendingTasks, 0);

  const grades = useMemo(
    () => Array.from(new Set(rows.map((r) => r.student.current_grade))).sort((a, b) => a - b),
    [rows]
  );
  const classYears = useMemo(
    () => Array.from(new Set(rows.map((r) => r.student.graduation_year))).sort((a, b) => a - b),
    [rows]
  );

  function toggleQuickFilter(f: QuickFilter) {
    setQuickFilter((cur) => (cur === f ? "all" : f));
  }

  const filtered = rows.filter((r) => {
    if (quickFilter === "green" && r.status !== "green") return false;
    if (quickFilter === "yellow" && r.status !== "yellow") return false;
    if (quickFilter === "red" && r.status !== "red") return false;
    if (quickFilter === "deadlineWeek" && !(r.nextDeadline && r.nextDeadline.days >= 0 && r.nextDeadline.days <= 7)) return false;
    if (quickFilter === "pendingTasks" && r.pendingTasks <= 0) return false;
    if (gradeFilter !== "all" && String(r.student.current_grade) !== gradeFilter) return false;
    if (classOfFilter !== "all" && String(r.student.graduation_year) !== classOfFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${r.student.student_name} ${r.student.english_name ?? ""} ${r.student.high_school} ${r.student.intended_major ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "priority": {
        cmp = STATUS_RANK[a.status] - STATUS_RANK[b.status];
        if (cmp === 0) cmp = (a.nextDeadline?.days ?? 9999) - (b.nextDeadline?.days ?? 9999);
        break;
      }
      case "name":
        cmp = (a.student.english_name ?? a.student.student_name).localeCompare(b.student.english_name ?? b.student.student_name);
        break;
      case "grade":
        cmp = a.student.current_grade - b.student.current_grade;
        break;
      case "classOf":
        cmp = a.student.graduation_year - b.student.graduation_year;
        break;
      case "progress":
        cmp = a.progress - b.progress;
        break;
      case "deadline":
        cmp = (a.nextDeadline?.days ?? 9999) - (b.nextDeadline?.days ?? 9999);
        break;
      case "pendingTasks":
        cmp = a.pendingTasks - b.pendingTasks;
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const th = (key: SortKey, label: string) => (
    <th
      onClick={() => toggleSort(key)}
      className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-400 hover:text-navy-600"
    >
      {label}
      {sortKey === key && <span className="ml-1 text-gold-500">{sortAsc ? "↑" : "↓"}</span>}
    </th>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-900">카운슬러 대시보드</h1>
        <p className="mt-1 text-sm text-navy-500">{restricted ? "내 담당 학생 현황 개요" : "전체 재학생 현황 개요"}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="재학생 수" value={total} active={quickFilter === "all"} onClick={() => setQuickFilter("all")} />
        <StatCard label="정상 진행" value={onTrack} tone="green" active={quickFilter === "green"} onClick={() => toggleQuickFilter("green")} />
        <StatCard label="주의 필요" value={attention} tone="amber" active={quickFilter === "yellow"} onClick={() => toggleQuickFilter("yellow")} />
        <StatCard label="긴급" value={urgent} tone="red" active={quickFilter === "red"} onClick={() => toggleQuickFilter("red")} />
        <StatCard label="이번주 마감" value={deadlinesThisWeek} tone="gold" active={quickFilter === "deadlineWeek"} onClick={() => toggleQuickFilter("deadlineWeek")} />
        <StatCard label="미완료 할일" value={totalPendingTasks} active={quickFilter === "pendingTasks"} onClick={() => toggleQuickFilter("pendingTasks")} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-100 px-5 py-4">
          <h2 className="font-serif text-lg font-semibold text-navy-900">My Students</h2>
          <Link href="/students" className="text-sm font-medium text-gold-600 hover:text-gold-700">
            전체 학생 보기 →
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-b border-navy-100 px-5 py-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 학교, 전공으로 검색…"
            className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-gold-400 focus:outline-none sm:w-64"
          />
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-700 focus:border-gold-400 focus:outline-none"
          >
            <option value="all">전체 학년</option>
            {grades.map((g) => (
              <option key={g} value={g}>{g}학년</option>
            ))}
          </select>
          <select
            value={classOfFilter}
            onChange={(e) => setClassOfFilter(e.target.value)}
            className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-700 focus:border-gold-400 focus:outline-none"
          >
            <option value="all">전체 졸업연도</option>
            {classYears.map((y) => (
              <option key={y} value={y}>Class of {y}</option>
            ))}
          </select>
          {quickFilter !== "all" && (
            <button
              type="button"
              onClick={() => setQuickFilter("all")}
              className="text-xs font-medium text-gold-600 hover:text-gold-700"
            >
              빠른 필터 해제
            </button>
          )}
          <span className="text-xs text-navy-400">전체 {rows.length}명 중 {sorted.length}명</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse">
            <thead className="border-b border-navy-100 bg-navy-50/60">
              <tr>
                <th className="w-8 px-2 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">상태</th>
                {th("name", "학생")}
                {th("grade", "학년")}
                {th("classOf", "Class of")}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">고등학교</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">희망 전공</th>
                {th("progress", "진행률")}
                {th("deadline", "다음 마감일")}
                {th("pendingTasks", "할일")}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">Next Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">마지막 상담일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-5 py-6 text-sm text-navy-400">조건에 맞는 학생이 없어요.</td>
                </tr>
              )}
              {sorted.map((row) => (
                <Fragment key={row.student.id}>
                <tr className="hover:bg-navy-50/40">
                  <td className="px-2 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setExpandedId((cur) => (cur === row.student.id ? null : row.student.id))}
                      className="text-navy-400 hover:text-gold-600"
                      aria-label="자세히 보기"
                    >
                      {expandedId === row.student.id ? "▾" : "▸"}
                    </button>
                  </td>
                  <td className="px-4 py-3"><StatusDot status={row.status} /></td>
                  <td className="px-4 py-3">
                    <Link href={`/students/${row.student.id}`} className="font-medium text-navy-900 hover:text-gold-600">
                      {row.student.english_name ?? row.student.student_name}
                    </Link>
                    <div className="text-xs text-navy-400">{row.student.student_name}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy-600">{row.student.current_grade}학년</td>
                  <td className="px-4 py-3 text-sm text-navy-600">{row.student.graduation_year}</td>
                  <td className="px-4 py-3 text-sm text-navy-600">{row.student.high_school}</td>
                  <td className="px-4 py-3 text-sm text-navy-600">{row.student.intended_major ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="w-28">
                      <ProgressBar value={row.progress} showLabel size="sm" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {row.nextDeadline ? (
                      <span className={cn("font-medium", row.nextDeadline.days < 14 ? "text-rose-600" : "text-navy-700")}>
                        {row.nextDeadline.name} · {row.nextDeadline.days}일
                      </span>
                    ) : (
                      <span className="text-navy-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.pendingTasks > 0 ? (
                      <Pill tone={row.pendingTasks >= 3 ? "amber" : "neutral"}>{row.pendingTasks}건</Pill>
                    ) : (
                      <span className="text-sm text-navy-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <NextActionCell studentId={row.student.id} value={row.student.next_action} />
                  </td>
                  <td className="px-4 py-3 text-sm text-navy-600">{formatDate(row.lastCounselingDate)}</td>
                </tr>
                {expandedId === row.student.id && (
                  <tr>
                    <td colSpan={12} className="p-0">
                      <StudentDrilldown row={row} />
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AttentionNeededPanel rows={rows} />
        <UpcomingDeadlinesPanel items={rows.flatMap((r) => r.deadlineItems)} />
      </div>
    </div>
  );
}
