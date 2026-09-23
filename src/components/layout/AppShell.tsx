"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-navy-100 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="-ml-1.5 rounded-md p-1.5 text-navy-600 hover:bg-navy-50"
            aria-label="메뉴 열기"
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>
          <Image src="/logo.png" alt="BlueKey" width={24} height={24} className="h-6 w-6 rounded object-cover" />
          <span className="font-serif text-base font-semibold text-navy-900">BlueKey</span>
        </header>

        <main className="min-w-0 flex-1 bg-background">
          <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
