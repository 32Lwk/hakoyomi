"use client";

import {
  MapPin,
  MessageCircleQuestion,
  Package,
  ScanSearch,
  Settings,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStack } from "@/components/stack-provider";
import { cn } from "@/lib/utils";

// 下部：［商品］［質問］［●探す］［棚］［設定］（L-20261103-43）。
// 塗りつぶしの紺の丸は中央の「探す」だけ。今いるタブは薄い紺の下地＋上辺の線で示し、押すボタンと見分ける
type Tab = { href: string; label: string; icon: LucideIcon };
const LEFT: Tab[] = [
  { href: "/products", label: "商品", icon: Package },
  { href: "/ask", label: "質問", icon: MessageCircleQuestion },
];
const RIGHT: Tab[] = [
  { href: "/shelf", label: "棚", icon: MapPin },
  { href: "/settings", label: "設定", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { ids, setScannerOpen } = useStack();
  const onSearch = pathname === "/";

  const tab = (t: Tab) => {
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
        {active && (
          <span
            aria-hidden="true"
            className="absolute top-0 left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-b-full bg-primary"
          />
        )}
        <span
          className={cn(
            "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
            active && "bg-primary/12",
          )}
        >
          <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
        </span>
        {t.label}
        {t.href === "/products" && ids.length > 0 && (
          <span className="absolute top-1.5 right-[calc(50%-2.1rem)] min-w-[1.125rem] rounded-full bg-primary px-1 text-center text-[10px] leading-[1.125rem] font-bold text-primary-foreground ring-2 ring-background">
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
        {LEFT.map(tab)}
        {/* 中央の「探す」。探す画面にいるときにもう一度押すとカメラで JAN を読む */}
        <div
          className={cn(
            "relative flex flex-1 flex-col items-center justify-end gap-1 pb-1.5 text-[11px]",
            onSearch ? "font-bold text-primary" : "text-muted-foreground",
          )}
        >
          <button
            type="button"
            onClick={() => (onSearch ? setScannerOpen(true) : router.push("/"))}
            aria-label={onSearch ? "JANを読む" : "探す"}
            aria-current={onSearch ? "page" : undefined}
            className={cn(
              "-mt-7 flex size-[3.75rem] items-center justify-center rounded-full bg-gradient-to-br from-[#2d5a8c] to-primary text-primary-foreground shadow-[0_6px_16px_-4px_rgb(30_58_95/0.55)] ring-4 transition-transform active:scale-95",
              onSearch ? "ring-primary/25" : "ring-background",
            )}
          >
            <ScanSearch className="size-7" aria-hidden="true" />
          </button>
          <span aria-hidden="true">{onSearch ? "JANを読む" : "探す"}</span>
        </div>
        {RIGHT.map(tab)}
      </div>
    </nav>
  );
}
