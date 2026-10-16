"use client";

import { useState, type ReactNode } from "react";

export function Disclosure({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-navy-100 pb-2 last:border-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <div className="flex-1">{summary}</div>
        <span className="mt-0.5 shrink-0 text-xs text-navy-300">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="mt-2 space-y-1 border-t border-navy-100 pt-2">{children}</div>}
    </div>
  );
}
