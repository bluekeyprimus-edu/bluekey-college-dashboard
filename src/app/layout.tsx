import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <ServiceWorkerRegister />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="min-w-0 flex-1 bg-background">
            <div className="mx-auto max-w-[1400px] px-8 py-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
