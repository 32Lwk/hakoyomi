"use client";

import { Columns3, MapPin, ScanBarcode, ScanLine, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStack } from "@/components/stack-provider";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "読む", icon: ScanLine },
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
          "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs",
          active ? "font-bold text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
        {t.label}
        {t.href === "/compare" && ids.length > 0 && (
          <span className="absolute top-1.5 right-[calc(50%-1.4rem)] rounded-full bg-primary px-1.5 text-[10px] leading-4 font-bold text-primary-foreground">
            {ids.length}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav
      aria-label="画面の切り替え"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-3xl items-end px-2">
        {tab(TABS[0])}
        {tab(TABS[1])}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="-mt-6 flex size-16 flex-col items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-md outline-offset-2"
          >
            <ScanBarcode className="size-6" aria-hidden="true" />
            JANを読む
          </button>
        </div>
        {tab(TABS[2])}
        {tab(TABS[3])}
      </div>
    </nav>
  );
}
