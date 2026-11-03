"use client";

import { Columns3, MapPin, Package, ScanBarcode, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStack } from "@/components/stack-provider";
import { cn } from "@/lib/utils";

// 「読む」は中央の「JANを読む」と紛らわしいので「商品」と呼ぶ（L-20261103-04）
const TABS = [
  { href: "/", label: "商品", icon: Package },
  { href: "/compare", label: "比べる", icon: Columns3 },
  { href: "/search", label: "さがす", icon: Search },
  { href: "/shelf", label: "棚", icon: MapPin },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { ids, setScannerOpen } = useStack();

  const tab = (t: (typeof TABS)[number]) => {
    const active = pathname === t.href;
    const Icon = t.icon;
    return (
      <Link
        key={t.href}
        href={t.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px]",
          active ? "font-bold text-primary" : "text-muted-foreground",
        )}
      >
        {/* 今いる画面：上辺の線＋アイコンを紺の丸で塗る（L-20261103-42） */}
        {active && (
          <span
            aria-hidden="true"
            className="absolute top-0 left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-b-full bg-primary"
          />
        )}
        <span
          className={cn(
            "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
            active ? "bg-primary text-primary-foreground shadow-sm" : "",
          )}
        >
          <Icon className="size-5" strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
        </span>
        {t.label}
        {t.href === "/compare" && ids.length > 0 && (
          <span
            className={cn(
              "absolute top-1.5 right-[calc(50%-2.1rem)] min-w-[1.125rem] rounded-full px-1 text-center text-[10px] leading-[1.125rem] font-bold ring-2 ring-background",
              active ? "bg-diff text-foreground" : "bg-primary text-primary-foreground",
            )}
          >
            {ids.length}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav
      aria-label="画面の切り替え"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-3xl items-end px-2">
        {tab(TABS[0])}
        {tab(TABS[1])}
        {/* 読み取りは中央に浮かせた丸いボタン。下に名前を置いて他のタブと高さをそろえる */}
        <div className="flex flex-1 flex-col items-center justify-end gap-1 pb-1.5 text-[11px] font-bold text-primary">
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            aria-label="JANを読む"
            className="-mt-7 flex size-[3.75rem] items-center justify-center rounded-full bg-gradient-to-br from-[#2d5a8c] to-primary text-primary-foreground shadow-[0_6px_16px_-4px_rgb(30_58_95/0.55)] ring-4 ring-background transition-transform active:scale-95"
          >
            <ScanBarcode className="size-7" aria-hidden="true" />
          </button>
          <span aria-hidden="true">JANを読む</span>
        </div>
        {tab(TABS[2])}
        {tab(TABS[3])}
      </div>
    </nav>
  );
}
