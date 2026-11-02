import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { JanScanner } from "@/components/jan-scanner";
import { StackProvider } from "@/components/stack-provider";
import "./globals.css";

const noto = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  variable: "--font-noto",
  preload: false,
});

export const metadata: Metadata = {
  title: "ハコよみ",
  description: "登録販売者向けの店頭業務支援（説明の根拠をそろえるツール）",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e3a5f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`h-full antialiased ${noto.variable}`}>
      <body className="flex min-h-full flex-col">
        <StackProvider>
          <AppHeader />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-36">{children}</main>
          <BottomNav />
          <JanScanner />
        </StackProvider>
      </body>
    </html>
  );
}
