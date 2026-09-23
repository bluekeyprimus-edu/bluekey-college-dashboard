"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RosterRow } from "@/lib/data";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusDot } from "@/components/ui/StatusDot";
import { cn } from "@/lib/cn";

type SortKey = "name" | "grade" | "school" | "major" | "counselor" | "progress" | "deadline";

export function StudentsTable({ rows }: { rows: RosterRow[] }) {
  const [search, setSearch] = useState("");
  const [counselor, setCounselor] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("deadline");
  const [sortAsc, setSortAsc] = useState(true);

  const counselors = useMemo(
    () => Array.from(new Set(rows.map((r) => r.student.counselor_name).filter(Boolean))) as string[],
    [rows]
  );
  const grades = useMemo(
    () => Array.from(new Set(rows.map((r) => r.student.current_grade))).sort((a, b) => a - b),
    [rows]
  );

  const filtered = rows.filter((r) => {
    if (counselor !== "all" && r.student.counselor_name !== counselor) return false;
    if (gradeFilter !== "all" && String(r.student.current_grade) !== gradeFilter) return false;
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
      case "name":
        cmp = (a.student.english_name ?? a.student.student_name).localeCompare(b.student.english_name ?? b.student.student_name);
        break;
      case "grade":
        cmp = a.student.current_grade - b.student.current_grade;
        break;
      case "school":
        cmp = a.student.high_school.localeCompare(b.student.high_school);
        break;
      case "major":
        cmp = (a.student.intended_major ?? "").localeCompare(b.student.intended_major ?? "");
        break;
      case "counselor":
        cmp = (a.student.counselor_name ?? "").localeCompare(b.student.counselor_name ?? "");
        break;
      case "progress":
        cmp = a.progress - b.progress;
        break;
      case "deadline":
        cmp = (a.nextDeadline?.days ?? 9999) - (b.nextDeadline?.days ?? 9999);
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
      className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-400 hover:text-navy-600"
    >
      {label}
      {sortKey === key && <span className="ml-1 text-gold-500">{sortAsc ? "↑" : "↓"}</span>}
    </th>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, school, or major…"
          className="w-72 rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-gold-400 focus:outline-none"
        />
        <select
          value={counselor}
          onChange={(e) => setCounselor(e.target.value)}
          className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-700 focus:border-gold-400 focus:outline-none"
        >
          <option value="all">All Counselors</option>
          {counselors.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-700 focus:border-gold-400 focus:outline-none"
        >
          <option value="all">All Grades</option>
          {grades.map((g) => (
            <option key={g} value={g}>Grade {g}</option>
          ))}
        </select>
        <span className="text-xs text-navy-400">{sorted.length} of {rows.length} students</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
        <table className="w-full border-collapse">
          <thead className="border-b border-navy-100 bg-navy-50/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">Status</th>
              {th("name", "Student")}
              {th("school", "School")}
              {th("grade", "Grade / Class")}
              {th("major", "Intended Major")}
              {th("counselor", "Counselor")}
              {th("progress", "Progress")}
              {th("deadline", "Next Deadline")}
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">Tasks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {sorted.map((row) => (
              <tr key={row.student.id} className="hover:bg-navy-50/40">
                <td className="px-4 py-3"><StatusDot status={row.status} /></td>
                <td className="px-4 py-3">
                  <Link href={`/students/${row.student.id}`} className="font-medium text-navy-900 hover:text-gold-600">
                    {row.student.english_name ?? row.student.student_name}
                  </Link>
                  <div className="text-xs text-navy-400">{row.student.student_name}</div>
                </td>
                <td className="px-4 py-3 text-sm text-navy-600">{row.student.high_school}</td>
                <td className="px-4 py-3 text-sm text-navy-600">
                  Grade {row.student.current_grade} · Class of {row.student.graduation_year}
                </td>
                <td className="px-4 py-3 text-sm text-navy-600">{row.student.intended_major ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-navy-600">{row.student.counselor_name ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="w-32">
                    <ProgressBar value={row.progress} showLabel size="sm" />
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {row.nextDeadline ? (
                    <span className={cn("font-medium", row.nextDeadline.days < 14 ? "text-rose-600" : "text-navy-700")}>
                      {row.nextDeadline.name} · {row.nextDeadline.days}d
                    </span>
                  ) : (
                    <span className="text-navy-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-navy-600">{row.pendingTasks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
