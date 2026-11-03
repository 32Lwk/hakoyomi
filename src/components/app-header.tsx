"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UI_COPY } from "@/lib/guard/uiCopy";

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
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground"
          >
            箱
          </span>
          ハコよみ
        </Link>
        {title && (
          <span className="shrink-0 text-sm text-muted-foreground">
            <span aria-hidden="true">／</span>
            {title}
          </span>
        )}
        <span
          title={UI_COPY.demoData}
          className="ml-auto truncate rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
        >
          {UI_COPY.demoShort}
        </span>
      </div>
    </header>
  );
}
