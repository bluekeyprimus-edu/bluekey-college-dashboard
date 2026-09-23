import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { getCurrentCounselor } from "@/lib/current-counselor";

// Supabase project lives in ap-northeast-2 (Seoul) — without this, Vercel
// runs the app's server functions in the US by default, so every page
// render does a US<->Seoul round trip to the database on top of the
// Korea<->Vercel one. Colocating fixes both dashboard and per-student
// pages, not just the roster query.
export const preferredRegion = "icn1";

export const metadata: Metadata = {
  title: "BlueKey College Consulting Dashboard",
  description: "학생 대입 준비 현황을 관리하는 카운슬러 대시보드",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "블루키 대시보드",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d121f",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // A signed-in, non-admin counselor gets a trimmed-down sidebar (no
  // account-management link) — computed once here so every page doesn't
  // need to re-fetch it. Admins and non-counselor sessions (parents) see
  // the default nav; parents don't get the sidebar at all (see AppShell).
  const actingCounselor = await getCurrentCounselor();
  const isRestrictedCounselor = Boolean(actingCounselor && !actingCounselor.isAdmin);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <ServiceWorkerRegister />
        <AppShell isRestrictedCounselor={isRestrictedCounselor}>{children}</AppShell>
      </body>
    </html>
  );
}
