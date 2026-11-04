"use client";

import { ScanBarcode } from "lucide-react";
import { useStack } from "@/components/stack-provider";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { cn } from "@/lib/utils";

// 検索ボックスの左に置く JAN の読み取り（L-20261104-21）。どの検索ボックスでも同じ位置・同じ形
export function JanButton({ className }: { className?: string }) {
  const { setScannerOpen } = useStack();
  return (
    <button
      type="button"
      onClick={() => setScannerOpen(true)}
      aria-label={UI_COPY.readJan}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl border border-input bg-background text-primary active:bg-accent",
        className,
      )}
    >
      <ScanBarcode className="size-5" aria-hidden="true" />
    </button>
  );
}
