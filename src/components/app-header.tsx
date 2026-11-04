"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UI_COPY } from "@/lib/guard/uiCopy";

export const HEADER_ACTION_ID = "header-action";

// 画面名はタブと同じ語にそろえる。ロゴを押すと「探す」へ戻る（L-20261103-43）
const TITLE: Record<string, string> = {
  "/": "探す",
  "/products": "商品",
  "/ask": "質問",
  "/shelf": "棚",
  "/settings": "設定",
};

export function AppHeader() {
  const pathname = usePathname();
  const title = TITLE[pathname];
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-3xl items-center gap-2 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-base font-bold tracking-wide"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            fill="none"
            className="size-7 shrink-0"
          >
            <defs>
              <linearGradient id="hakoBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#274C7E" />
                <stop offset="100%" stopColor="#152A47" />
              </linearGradient>
              <linearGradient id="hakoTop" x1="26" y1="24" x2="74" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E2ECF8" />
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#hakoBg)" stroke="#8FB4E8" strokeWidth="2.5" strokeOpacity="0.45" />
            <path d="M18 30V21C18 19.3431 19.3431 18 21 18H30" stroke="#8FB4E8" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M70 18H79C80.6569 18 82 19.3431 82 21V30" stroke="#8FB4E8" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M18 70V79C18 80.6569 19.3431 82 21 82H30" stroke="#8FB4E8" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M82 70V79C82 80.6569 80.6569 82 79 82H70" stroke="#8FB4E8" strokeWidth="4.5" strokeLinecap="round" />
            <polygon points="50,23 75,36 50,49 25,36" fill="url(#hakoTop)" />
            <polygon points="25,39 48.5,51.2 48.5,77 25,64.5" fill="#F1F6FC" />
            <line x1="31" y1="48" x2="43" y2="54.2" stroke="#1E3A5F" strokeWidth="3.2" strokeLinecap="round" />
            <line x1="31" y1="55" x2="40" y2="59.7" stroke="#5B86C4" strokeWidth="2.6" strokeLinecap="round" />
            <polygon points="51.5,51.2 75,39 75,64.5 51.5,77" fill="#BFD6F2" />
            <line x1="56.5" y1="53" x2="56.5" y2="69.5" stroke="#152A47" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="61" y1="50.7" x2="61" y2="67.2" stroke="#152A47" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="65" y1="48.6" x2="65" y2="65.1" stroke="#152A47" strokeWidth="3.2" strokeLinecap="round" />
            <line x1="69.5" y1="46.3" x2="69.5" y2="62.8" stroke="#152A47" strokeWidth="2" strokeLinecap="round" />
          </svg>
          ハコよみ
        </Link>
        {title && (
          <span className="shrink-0 text-sm text-muted-foreground">
            <span aria-hidden="true">／</span>
            {title}
          </span>
        )}
        {pathname === "/ask" ? (
          // 質問の画面は、右上に「新しい会話」を出す（画面側が差し込む。L-20261104-09）
          <div id={HEADER_ACTION_ID} className="ml-auto" />
        ) : (
          <span
            title={UI_COPY.demoData}
            className="ml-auto truncate rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
          >
            {UI_COPY.demoShort}
          </span>
        )}
      </div>
    </header>
  );
}
