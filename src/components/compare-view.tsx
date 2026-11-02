"use client";

import { ChevronRight, Plus, X } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { BadgeChip } from "@/components/badges";
import { IngredientSheet, type IngredientTarget } from "@/components/ingredient-sheet";
import { ProductImage } from "@/components/product-image";
import { useStack } from "@/components/stack-provider";
import { ProductPicker } from "@/components/product-picker";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ProductView } from "@/lib/catalog";
import type { BadgeRowCompare, CompareRow } from "@/lib/compare";
import { UI_COPY } from "@/lib/guard/uiCopy";
import type { BadgeKind } from "@/lib/schema/notice";
import { cn } from "@/lib/utils";

type CompareData = { views: ProductView[]; rows: CompareRow[]; badges: BadgeRowCompare[] };

const MAX = 4;
// 項目の列と、商品1品あたりの列の幅（rem）。3〜4品は横に送って見る
const LABEL_W = 5.5;
const COL_W = 7;

export function CompareView() {
  const { ids, remove } = useStack();
  const key = ids.join(",");
  const [data, setData] = useState<{ key: string; data: CompareData } | null>(null);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [ingredient, setIngredient] = useState<IngredientTarget | null>(null);

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

  const picker = (
    <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
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
  );

  if (ids.length < 2) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-bold">比べる商品を選ぶ</h1>
        <p className="rounded-xl bg-muted p-3 text-sm">
          {UI_COPY.needTwo}（いま {ids.length}品）
        </p>
        <ProductPicker />
      </div>
    );
  }
  if (!data || data.key !== key) return <p className="pt-6 text-muted-foreground">…</p>;

  const { views, rows, badges } = data.data;
  const canAdd = views.length < MAX;
  const meta = rows.filter((r) => r.group === undefined);
  const ingredients = rows.filter((r) => r.group !== undefined);
  const show = <T extends { diff: boolean }>(list: T[]) =>
    onlyDiff ? list.filter((r) => r.diff) : list;
  const diffCount = rows.filter((r) => r.diff).length + badges.filter((b) => b.diff).length;

  // 成分は手引きの分類ごとに見出しを入れる（並びはサーバーで分類順にしてある）
  const groups: { group: string | null; rows: CompareRow[] }[] = [];
  for (const r of show(ingredients)) {
    const last = groups.at(-1);
    if (last && last.group === r.group) last.rows.push(r);
    else groups.push({ group: r.group ?? null, rows: [r] });
  }

  const cols = `${LABEL_W}rem repeat(${views.length}, minmax(${COL_W}rem, 1fr))`;
  const minWidth = `${LABEL_W + COL_W * views.length}rem`;

  const openIngredient = (r: CompareRow) =>
    setIngredient({
      ingredient: r.label,
      products: views
        .filter((_, i) => r.cells[i]?.kind === "value")
        .map((v) => ({ name: v.product.name, kind: v.product.kind })),
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-lg font-bold">{views.length}品の違い</h1>
        <p className="text-sm">
          違う項目
          <span className="mx-1 rounded bg-diff px-1.5 text-base font-bold tabular-nums">
            {diffCount}
          </span>
          ／ {rows.length + badges.length}
        </p>
      </div>

      {/* 表の操作は表の上にまとめる。追加は品数が増えても画面内に見える位置に置く */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={!canAdd}
          className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-primary px-3 text-sm font-bold text-primary disabled:border-border disabled:text-muted-foreground"
        >
          <Plus className="size-5" aria-hidden="true" />
          {canAdd ? `商品を追加（${views.length}/${MAX}）` : `${MAX}品まで`}
        </button>
        <div role="group" aria-label="表示する行" className="flex rounded-lg bg-muted p-1 text-sm">
          {[
            { on: false, label: UI_COPY.showAll },
            { on: true, label: UI_COPY.showDiff },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => setOnlyDiff(o.on)}
              aria-pressed={onlyDiff === o.on}
              className={cn(
                "min-h-9 rounded-md px-2.5 whitespace-nowrap",
                onlyDiff === o.on
                  ? "bg-background font-bold text-primary shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <p className="-mt-1 text-xs text-muted-foreground">
        並びは読んだ順です。{UI_COPY.purposeHint}
      </p>

      {picker}

      <div className="overflow-x-auto rounded-xl border border-border">
        <div role="table" aria-label="商品の比較" style={{ minWidth }}>
          <div role="row" className="grid bg-muted" style={{ gridTemplateColumns: cols }}>
            <span
              role="columnheader"
              className="sticky left-0 z-10 flex items-end bg-muted p-2 text-xs text-muted-foreground"
            >
              商品
            </span>
            {views.map((v) => (
              <span
                role="columnheader"
                key={v.product.id}
                className="relative flex flex-col items-start gap-1 p-2 pr-7"
              >
                <ProductImage
                  id={v.product.id}
                  kind={v.product.kind}
                  name={v.product.name}
                  size={48}
                  className="size-12 rounded-md bg-background p-0.5"
                />
                <span className="text-sm leading-snug font-bold">{v.product.name}</span>
                <button
                  type="button"
                  onClick={() => remove(v.product.id)}
                  aria-label={`${v.product.name} を外す`}
                  className="absolute top-1 right-0.5 flex size-9 items-center justify-center rounded-full text-muted-foreground active:bg-background"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>

          <Section title="基本" show={show(meta).length > 0} />
          {show(meta).map((r) => (
            <Row key={r.key} cols={cols} label={r.label} diff={r.diff}>
              {r.cells.map((c, i) => (
                <ValueCell key={i} cell={c} />
              ))}
            </Row>
          ))}

          <Section title="確認ポイント" show={show(badges).length > 0} />
          {show(badges).map((b) => (
            <Row key={b.kind} cols={cols} label={KIND_LABEL[b.kind]} diff={b.diff} small>
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
            </Row>
          ))}

          <Section title="成分（1日最大量あたり）" show={groups.length > 0} />
          {groups.map((g) => (
            <Fragment key={g.group ?? "none"}>
              <div className="border-t border-border bg-accent/60 px-2 py-1">
                <span className="sticky left-2 text-xs font-bold text-accent-foreground">
                  {g.group ?? "その他（手引きに記載なし）"}
                </span>
              </div>
              {g.rows.map((r) => (
                <IngredientRow key={r.key} cols={cols} row={r} onOpen={() => openIngredient(r)} />
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      <IngredientSheet target={ingredient} onClose={() => setIngredient(null)} />
    </div>
  );
}

function Section({ title, show }: { title: string; show: boolean }) {
  if (!show) return null;
  return (
    <div className="border-t border-border bg-muted px-2 pt-3 pb-1">
      <span className="sticky left-2 text-xs font-bold text-muted-foreground">{title}</span>
    </div>
  );
}

// 違う行は、行見出しに琥珀の帯と「違う」を付ける（行全体は塗らない。3品以上だとほぼ全行が違うため）
function Row({
  cols,
  label,
  diff,
  small = false,
  children,
}: {
  cols: string;
  label: React.ReactNode;
  diff: boolean;
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div role="row" className="grid border-t border-border" style={{ gridTemplateColumns: cols }}>
      <span
        role="rowheader"
        className={cn(
          "sticky left-0 z-10 flex flex-col items-start gap-1 border-l-4 bg-background p-2 leading-snug",
          small ? "text-xs" : "text-sm",
          diff ? "border-diff bg-diff-soft" : "border-transparent",
        )}
      >
        {label}
        {diff && <DiffTag />}
      </span>
      {children}
    </div>
  );
}

// 成分名は長いので、値の上に1行で出す（項目の列に押し込むと縦に何行も折れる）
function IngredientRow({
  cols,
  row,
  onOpen,
}: {
  cols: string;
  row: CompareRow;
  onOpen: () => void;
}) {
  return (
    <div
      className={cn(
        "border-t border-l-4 border-t-border",
        row.diff ? "border-l-diff" : "border-l-transparent",
      )}
    >
      <div className={cn("px-2 pt-2", row.diff && "bg-diff-soft")}>
        <button
          type="button"
          onClick={onOpen}
          className="sticky left-2 inline-flex min-h-8 items-center gap-1 rounded text-left text-sm font-bold underline decoration-border underline-offset-4 active:bg-accent"
        >
          {row.label}
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </div>
      <div role="row" className="grid" style={{ gridTemplateColumns: cols }}>
        <span
          role="rowheader"
          className={cn("sticky left-0 z-10 p-2", row.diff ? "bg-diff-soft" : "bg-background")}
        >
          <span className="sr-only">{row.label}</span>
          {row.diff && <DiffTag />}
        </span>
        {row.cells.map((c, i) => (
          <ValueCell key={i} cell={c} />
        ))}
      </div>
    </div>
  );
}

function ValueCell({ cell }: { cell: CompareRow["cells"][number] }) {
  return (
    <span role="cell" className="p-2">
      {cell.kind === "none" ? (
        <span className="text-sm text-muted-foreground">なし</span>
      ) : cell.uncertain ? (
        <span className="text-sm text-uncertain underline">{UI_COPY.uncertain}</span>
      ) : (
        <span className="text-base font-bold break-all tabular-nums">{cell.text}</span>
      )}
    </span>
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
  return <span className="rounded bg-diff px-1 text-[11px] font-bold text-foreground">違う</span>;
}
