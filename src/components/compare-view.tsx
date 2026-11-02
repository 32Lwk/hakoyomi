"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BadgeChip } from "@/components/badges";
import { ProductImage } from "@/components/product-image";
import { useStack } from "@/components/stack-provider";
import { ProductPicker } from "@/components/product-picker";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ProductView } from "@/lib/catalog";
import type { BadgeRowCompare, CompareRow } from "@/lib/compare";
import { UI_COPY } from "@/lib/guard/uiCopy";
import type { BadgeKind } from "@/lib/schema/notice";
import { cn } from "@/lib/utils";

type CompareData = { views: ProductView[]; rows: CompareRow[]; badges: BadgeRowCompare[] };

export function CompareView() {
  const { ids, remove } = useStack();
  const key = ids.join(",");
  const [data, setData] = useState<{ key: string; data: CompareData } | null>(null);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (ids.length < 2) return;
    let cancelled = false;
    fetch(`/api/compare?ids=${encodeURIComponent(key)}`)
      .then((res) => res.json() as Promise<CompareData>)
      .then((d) => {
        if (!cancelled) setData({ key, data: d });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [key, ids.length]);

  if (ids.length < 2) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-bold">比べる商品を選ぶ</h1>
        <p className="text-sm">{UI_COPY.needTwo}</p>
        <ProductPicker />
      </div>
    );
  }
  if (!data || data.key !== key) return <p className="pt-6 text-muted-foreground">…</p>;

  const { views, rows, badges } = data.data;
  const shownRows = onlyDiff ? rows.filter((r) => r.diff) : rows;
  const cols = `5.5rem repeat(${views.length}, minmax(5.5rem, 1fr))`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold">{views.length}品の違い</h1>
        <button
          type="button"
          onClick={() => setOnlyDiff((v) => !v)}
          aria-pressed={onlyDiff}
          className={cn(
            "min-h-10 rounded-md border-2 border-primary px-3 text-sm font-bold",
            onlyDiff ? "bg-primary text-primary-foreground" : "bg-background text-primary",
          )}
        >
          違う行だけ
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        分量は1日最大量あたり。並びは読んだ順です。{UI_COPY.judgeNotice}
      </p>

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetTrigger
          disabled={views.length >= 4}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary text-sm font-bold text-primary disabled:border-border disabled:text-muted-foreground"
        >
          <Plus className="size-5" aria-hidden="true" />
          {views.length >= 4 ? UI_COPY.compareFull : `商品を追加（${views.length}/4品）`}
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{UI_COPY.addToCompare}</SheetTitle>
            <SheetDescription>{UI_COPY.chooseNotice}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <ProductPicker onPicked={() => setPickerOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="overflow-x-auto rounded-lg border border-border">
        <div
          role="table"
          aria-label="商品の比較"
          style={{ minWidth: `${5.5 * (views.length + 1)}rem` }}
        >
          <div role="row" className="grid bg-muted text-sm" style={{ gridTemplateColumns: cols }}>
            <span
              role="columnheader"
              className="sticky left-0 bg-muted p-2 text-xs text-muted-foreground"
            >
              項目
            </span>
            {views.map((v) => (
              <span
                role="columnheader"
                key={v.product.id}
                className="flex items-start gap-1 p-2 font-bold"
              >
                <span className="flex flex-1 flex-col items-start gap-1">
                  <ProductImage
                    id={v.product.id}
                    kind={v.product.kind}
                    name={v.product.name}
                    size={48}
                    className="size-12 rounded-md bg-background p-0.5"
                  />
                  <span className="text-sm leading-snug">{v.product.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => remove(v.product.id)}
                  aria-label={`${v.product.name} を外す`}
                  className="-m-1 flex size-8 items-center justify-center"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>

          {badges
            .filter((b) => !onlyDiff || b.diff)
            .map((b) => (
              <div
                role="row"
                key={b.kind}
                className={cn("grid border-t border-border", b.diff && "bg-diff-soft")}
                style={{ gridTemplateColumns: cols }}
              >
                <span
                  role="rowheader"
                  className={cn(
                    "sticky left-0 flex flex-col gap-1 p-2 text-xs",
                    b.diff ? "bg-diff-soft" : "bg-background",
                  )}
                >
                  {KIND_LABEL[b.kind]}
                  {b.diff && <DiffTag />}
                </span>
                {b.labels.map((label, i) => {
                  const badge = views[i]?.badges.find((x) => x.kind === b.kind);
                  return (
                    <span role="cell" key={i} className="p-2">
                      {badge && label ? (
                        <BadgeChip badge={badge} compact />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>
                  );
                })}
              </div>
            ))}

          {shownRows.map((r) => (
            <div
              role="row"
              key={r.key}
              className={cn("grid border-t border-border", r.diff && "bg-diff-soft")}
              style={{ gridTemplateColumns: cols }}
            >
              <span
                role="rowheader"
                className={cn(
                  "sticky left-0 flex flex-col gap-1 p-2 text-sm",
                  r.diff ? "bg-diff-soft" : "bg-background",
                )}
              >
                {r.label}
                {r.diff && <DiffTag />}
              </span>
              {r.cells.map((c, i) => (
                <span role="cell" key={i} className="p-2">
                  {c.kind === "none" ? (
                    <span className="text-muted-foreground">なし</span>
                  ) : c.uncertain ? (
                    <span className="text-sm text-uncertain underline">{UI_COPY.uncertain}</span>
                  ) : (
                    <span className="text-base font-bold break-all tabular-nums">{c.text}</span>
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 比較表の行見出し（バッジの種類）
const KIND_LABEL: Record<BadgeKind, string> = {
  abuse: "濫用防止",
  drive: "運転",
  breastfeeding: "授乳",
  under15: "15歳未満",
  under12: "12歳未満",
  alcohol: "飲酒",
  caffeine: "カフェイン",
  doping: "禁止表",
};

function DiffTag() {
  return (
    <span className="self-start rounded bg-diff px-1 text-[11px] font-bold text-foreground">
      違う
    </span>
  );
}
