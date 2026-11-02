import { UI_COPY } from "@/lib/guard/uiCopy";

// 全画面の上部に常時表示（rules §4.5-1）
export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
        <span className="text-lg font-bold tracking-wide">ハコよみ</span>
        <span className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {UI_COPY.demoData}
        </span>
      </div>
      <p className="bg-primary px-4 py-2 text-center text-sm font-bold text-primary-foreground">
        {UI_COPY.judgeNotice}
      </p>
    </header>
  );
}
