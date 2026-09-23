"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Trophy,
  ListChecks,
  FileText,
  PenLine,
  CheckSquare,
  Database,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/students", label: "학생", icon: Users },
  { href: "/academics", label: "학업", icon: GraduationCap },
  { href: "/activities", label: "활동", icon: Trophy },
  { href: "/college-list", label: "컬리지 리스트", icon: ListChecks },
  { href: "/applications", label: "지원 현황", icon: FileText },
  { href: "/essays", label: "에세이", icon: PenLine },
  { href: "/tasks", label: "할일", icon: CheckSquare },
  { href: "/admissions-data", label: "입시 데이터", icon: Database },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-navy-950/50 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col bg-navy-950 text-navy-100 transition-transform duration-200 ease-out lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2.5 px-6 py-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="BlueKey"
              width={36}
              height={36}
              className="h-9 w-9 rounded-md object-cover"
            />
            <div>
              <div className="font-serif text-[15px] font-semibold leading-tight text-white">BlueKey</div>
              <div className="text-[11px] tracking-wide text-navy-300">대학 입시 컨설팅</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-navy-300 hover:text-white lg:hidden"
            aria-label="메뉴 닫기"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-navy-800 text-white font-medium"
                    : "text-navy-300 hover:bg-navy-900 hover:text-white"
                )}
              >
                <Icon size={17} strokeWidth={1.75} className={active ? "text-gold-400" : "text-navy-400"} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-navy-800 px-6 py-4 text-[11px] text-navy-400">
          블루키 컨설팅 · 강남
        </div>
      </aside>
    </>
  );
}
