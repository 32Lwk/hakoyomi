"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStack } from "@/components/stack-provider";
import { UI_COPY } from "@/lib/guard/uiCopy";

// 画面名はタブと同じ語にそろえる。ロゴを押すと商品一覧へ戻る
const TITLE: Record<string, string> = {
  "/compare": "比べる",
  "/search": "さがす",
  "/shelf": "棚",
};

export function AppHeader() {
  const pathname = usePathname();
  const { select } = useStack();
  const title = TITLE[pathname];
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-3xl items-center gap-2 px-4">
        <Link
          href="/"
          onClick={() => select(null)}
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
