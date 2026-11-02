import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ハコよみ",
  description: "登録販売者向けの店頭業務支援（材料をそろえるツール。判断は販売者が行います）",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
