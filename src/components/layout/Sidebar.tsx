"use client";

import Link from "next/link";
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
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/academics", label: "Academics", icon: GraduationCap },
  { href: "/activities", label: "Activities", icon: Trophy },
  { href: "/college-list", label: "College List", icon: ListChecks },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/essays", label: "Essays", icon: PenLine },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/admissions-data", label: "Admissions Data", icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-navy-950 text-navy-100">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gold-400 font-serif text-sm font-bold text-navy-950">
          BK
        </div>
        <div>
          <div className="font-serif text-[15px] font-semibold leading-tight text-white">BlueKey</div>
          <div className="text-[11px] tracking-wide text-navy-300">College Consulting</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
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
        BlueKey Consulting · Gangnam
      </div>
    </aside>
  );
}
