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
          "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
          active ? "font-bold text-primary" : "text-muted-foreground",
        )}
      >
        <span
          className={cn(
            "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
            active && "bg-accent",
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {t.label}
        {t.href === "/compare" && ids.length > 0 && (
          <span className="absolute top-1 right-[calc(50%-1.5rem)] min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 font-bold text-primary-foreground ring-2 ring-background">
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
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            aria-label="JANを読む"
            className="-mt-5 mb-1 flex size-16 flex-col items-center justify-center gap-0.5 rounded-2xl bg-primary text-[10px] font-bold text-primary-foreground shadow-lg ring-4 ring-background outline-offset-2 active:translate-y-px"
          >
            <ScanBarcode className="size-6" aria-hidden="true" />
            JAN
          </button>
        </div>
        {tab(TABS[2])}
        {tab(TABS[3])}
      </div>
    </nav>
  );
}
