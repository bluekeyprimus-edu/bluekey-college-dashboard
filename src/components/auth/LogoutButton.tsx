"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/cn";

const VARIANT_CLASS = {
  light: "rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50",
  dark: "rounded-lg border border-navy-700 px-3 py-1.5 text-xs font-medium text-navy-300 hover:bg-navy-900 hover:text-white",
};

export function LogoutButton({ variant = "light", className }: { variant?: "light" | "dark"; className?: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} className={cn(VARIANT_CLASS[variant], className)}>
      로그아웃
    </button>
  );
}
