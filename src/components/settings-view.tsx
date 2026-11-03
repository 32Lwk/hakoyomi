"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { useStack } from "@/components/stack-provider";
import { useTextSize, type TextSize } from "@/components/text-size";
import { ABOUT_LINES, UI_COPY } from "@/lib/guard/uiCopy";
import { cn } from "@/lib/utils";

export type DataStatus = {
  products: number;
  unverified: number;
  notices: { name: string; url: string; fetchedOn: string; items: number }[];
  sources: { label: string; url: string | null; state: string }[];
};

// 設定（L-20261103-43）。店頭で使う順に：表示 → 選んでいる商品 → 出典とデータ → このアプリについて
export function SettingsView({ status }: { status: DataStatus }) {
  const [size, setSize] = useTextSize();
  const { ids, clear } = useStack();
  const [cleared, setCleared] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <Section title="表示">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <span className="text-sm font-bold">文字の大きさ</span>
          <div role="radiogroup" aria-label="文字の大きさ" className="flex rounded-lg bg-muted p-1">
            {(
              [
                { key: "standard", label: "標準" },
                { key: "large", label: "大きい" },
              ] as { key: TextSize; label: string }[]
            ).map((o) => (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={size === o.key}
                onClick={() => setSize(o.key)}
                className={cn(
                  "min-h-9 rounded-md px-3 text-sm",
                  size === o.key
                    ? "bg-background font-bold text-primary shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="選んでいる商品">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <span className="text-sm">
            {cleared && ids.length === 0 ? UI_COPY.clearProductsDone : `いま ${ids.length}品`}
          </span>
          <button
            type="button"
            disabled={ids.length === 0}
            onClick={() => {
              clear();
              setCleared(true);
            }}
            className="min-h-10 rounded-lg border-2 border-primary px-3 text-sm font-bold text-primary disabled:border-border disabled:text-muted-foreground"
          >
            {UI_COPY.clearProducts}
          </button>
        </div>
      </Section>

      <Section title="出典とデータの状態">
        <div className="flex flex-col gap-1 px-3 py-2.5 text-sm">
          <p>
            商品 <span className="font-bold tabular-nums">{status.products}</span>
            品（うち実物の箱で未確認{" "}
            <span className="font-bold tabular-nums">{status.unverified}</span>品）
          </p>
          <p className="text-xs text-muted-foreground">{UI_COPY.demoData}</p>
        </div>
        <div className="flex flex-col gap-1.5 px-3 py-2.5">
          <h3 className="text-xs font-bold text-muted-foreground">
            取り込んだ通知「使用上の注意」（{status.notices.length}薬効群）
          </h3>
          <ul className="flex flex-col gap-1 text-sm">
            {status.notices.map((n) => (
              <li key={n.name} className="flex items-baseline justify-between gap-2">
                <a
                  href={n.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 underline"
                >
                  {n.name}
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {n.items}項目・取得 {n.fetchedOn}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{UI_COPY.noticeOthers}</p>
        </div>
        <ul className="flex flex-col">
          {status.sources.map((s) => (
            <li key={s.label} className="flex flex-col gap-0.5 px-3 py-2.5 text-sm">
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 underline"
                >
                  {s.label}
                  <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                </a>
              ) : (
                s.label
              )}
              {s.state && <span className="text-xs text-muted-foreground">{s.state}</span>}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="このアプリについて">
        <ul className="flex list-disc flex-col gap-1.5 py-2.5 pr-3 pl-7 text-sm">
          {ABOUT_LINES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="px-1 text-xs font-bold text-muted-foreground">{title}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {children}
      </div>
    </section>
  );
}
