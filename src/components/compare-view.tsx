"use client";

import { ChevronRight, CircleHelp, Lightbulb, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ageStatus, BadgeChip, BadgeSheet, type BadgeTarget } from "@/components/badges";
import { IngredientSheet, type IngredientTarget } from "@/components/ingredient-sheet";
import { useStack } from "@/components/stack-provider";
import type { ProductView } from "@/lib/catalog";
import { badgeRowKind, type BadgeRowCompare, type CompareRow } from "@/lib/compare";
import { BADGE_INFO, UI_COPY } from "@/lib/guard/uiCopy";
import type { CompareInsight } from "@/lib/veteran/compareInsight";
import { cn } from "@/lib/utils";

type CompareData = { views: ProductView[]; rows: CompareRow[]; badges: BadgeRowCompare[] };

// 項目の列と、商品1品あたりの列の幅（rem）。3〜4品は横に送って見る
const LABEL_W = 5.5;
const COL_W = 7;

// 比べる表（2〜4品）。選んでいる商品の並びと追加は「商品」の画面が持つ（L-20261103-43）
export function CompareView() {
  const { ids } = useStack();
  const key = ids.join(",");
  const [data, setData] = useState<{ key: string; data: CompareData } | null>(null);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [ingredient, setIngredient] = useState<IngredientTarget | null>(null);
  const [badge, setBadge] = useState<BadgeTarget | null>(null);
  const [insightData, setInsightData] = useState<{
    key: string;
    insight: CompareInsight | null;
  } | null>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const insight = insightData?.key === key ? insightData.insight : null;
  const insightLoading = Boolean(ids.length >= 2 && insightData?.key !== key);

  useEffect(() => {
    if (ids.length < 2) return;
    let cancelled = false;

    fetch(`/api/compare?ids=${encodeURIComponent(key)}`)
      .then((res) => res.json() as Promise<CompareData>)
      .then((d) => {
        if (!cancelled) setData({ key, data: d });
      })
      .catch(() => undefined);

    fetch(`/api/compare/insight?ids=${encodeURIComponent(key)}`)
      .then((res) => res.json() as Promise<{ insight: CompareInsight | null }>)
      .then((d) => {
        if (!cancelled) {
          setInsightData({ key, insight: d.insight });
        }
      })
      .catch(() => {
        if (!cancelled) setInsightData({ key, insight: null });
      });

    return () => {
      cancelled = true;
    };
  }, [key, ids.length]);

  if (!data || data.key !== key) return <p className="pt-6 text-muted-foreground">…</p>;

  const { views, rows, badges } = data.data;
  const meta = rows.filter((r) => r.group === undefined);
  const ingredients = rows.filter((r) => r.group !== undefined);
  const show = <T extends { diff: boolean }>(list: T[]) =>
    onlyDiff ? list.filter((r) => r.diff) : list;
  // 年齢は重要なので「確認ポイント」から「基本」に上げ、文字を大きく出す（L-20261103-16）
  const ages = views.map((v) => ageStatus(v.badges, v.unrecorded));
  const ageDiff = new Set(ages.map((a) => a.text)).size > 1;
  const points = badges.filter((b) => b.kind !== "under15");
  const diffCount =
    rows.filter((r) => r.diff).length + points.filter((b) => b.diff).length + Number(ageDiff);

  // 成分は手引きの分類順に並んでいる（サーバー側）。分類は各行の成分名の後ろに括弧で出す
  const shownIngredients = show(ingredients);

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
      {/* ベテランの着眼点（接客の分岐点）カード */}
      {(insight || insightLoading) && (
        <section
          aria-label="ベテランの着眼点"
          className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-50/40 p-3.5 text-card-foreground shadow-sm dark:bg-amber-950/20"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
            <Lightbulb className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>ベテランの着眼点（接客の分岐点）</span>
            {insightLoading && (
              <span className="flex items-center gap-1 text-[10px] font-normal text-muted-foreground ml-auto animate-pulse">
                <Sparkles className="size-3 text-amber-500" />
                分析中…
              </span>
            )}
          </div>

          {insight && (
            <div className="mt-2 flex flex-col gap-2.5 text-xs">
              <p className="font-medium text-foreground leading-relaxed">{insight.summary}</p>

              {insight.points.length > 0 && (
                <div className="flex flex-col gap-1.5 rounded-lg bg-background/60 p-2.5 border border-amber-200/50 dark:border-amber-900/40">
                  {insight.points.map((p, idx) => (
                    <div key={idx} className="flex flex-col gap-0.5">
                      <span className="font-bold text-amber-950 dark:text-amber-200">
                        ・{p.title}
                      </span>
                      <span className="pl-3 text-muted-foreground leading-normal">
                        {p.description}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg bg-amber-100/60 p-2.5 dark:bg-amber-900/30 border border-amber-300/40 dark:border-amber-800/40">
                <p className="text-[11px] font-bold text-amber-950 dark:text-amber-200 mb-0.5">
                  🗣️ お客様への確認ポイント
                </p>
                <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                  {insight.hearingPrompt}
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 表の操作：違う項目の数と、すべて／違いだけ */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm">
          違う項目
          <span className="mx-1 rounded bg-diff px-1.5 text-base font-bold tabular-nums">
            {diffCount}
          </span>
          ／ {rows.length + points.length + 1}
        </p>
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
      <p className="-mt-1 text-xs text-muted-foreground">{UI_COPY.purposeHint}</p>

      <div role="table" aria-label="商品の比較">
        {/* 列の見出しは画面の上に残し、表を横に送ると一緒に動く */}
        <div
          ref={headRef}
          className="sticky top-12 z-20 overflow-hidden rounded-t-xl border border-border bg-muted shadow-[0_2px_4px_-2px_rgb(0_0_0/0.15)]"
        >
          <div role="row" className="grid" style={{ gridTemplateColumns: cols, minWidth }}>
            <span
              role="columnheader"
              className="sticky left-0 z-10 flex items-center bg-muted p-2 text-xs text-muted-foreground"
            >
              商品
            </span>
            {views.map((v, i) => (
              <span
                role="columnheader"
                key={v.product.id}
                className="flex min-w-0 items-start gap-1.5 p-2"
              >
                <ColumnNo n={i + 1} />
                <span className="line-clamp-2 text-xs leading-snug font-bold">
                  {v.product.name}
                </span>
              </span>
            ))}
          </div>
        </div>
        <div
          ref={bodyRef}
          onScroll={() => {
            if (headRef.current && bodyRef.current)
              headRef.current.scrollLeft = bodyRef.current.scrollLeft;
          }}
          className="overflow-x-auto rounded-b-xl border border-t-0 border-border"
        >
          <div style={{ minWidth }}>
            <Section title="基本" show={show(meta).length > 0 || !onlyDiff || ageDiff} />
            {show(meta).map((r) => (
              <Row key={r.key} cols={cols} label={r.label} diff={r.diff}>
                {r.cells.map((c, i) => (
                  <ValueCell key={i} cell={c} />
                ))}
              </Row>
            ))}
            {(!onlyDiff || ageDiff) && (
              <Row
                cols={cols}
                diff={ageDiff}
                label={
                  <button
                    type="button"
                    onClick={() => setBadge({ kind: "under15", badge: null, group: null })}
                    className="-m-1 flex flex-wrap items-center gap-1 rounded p-1 text-left active:bg-accent"
                  >
                    {BADGE_INFO.under15.name}
                    <CircleHelp
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </button>
                }
              >
                {ages.map((a, i) => {
                  const v = views[i];
                  return (
                    <span role="cell" key={v.product.id} className="p-2">
                      <button
                        type="button"
                        onClick={() =>
                          setBadge({
                            kind: a.badge?.kind ?? "under15",
                            badge: a.badge,
                            group: v.group,
                            productName: v.product.name,
                            empty: a.state === "set" ? undefined : a.state,
                          })
                        }
                        className={cn(
                          "-m-1 rounded p-1 text-left active:bg-accent",
                          a.state === "set"
                            ? "text-base font-bold"
                            : a.state === "unloaded"
                              ? "text-xs text-uncertain underline"
                              : "text-xs text-muted-foreground underline decoration-dotted",
                        )}
                      >
                        {a.text}
                      </button>
                    </span>
                  );
                })}
              </Row>
            )}

            <Section
              title="確認ポイント"
              show={show(points).length > 0}
              aside={UI_COPY.badgeRowHint}
            />
            {show(points).map((b) => (
              <Row
                key={b.kind}
                cols={cols}
                diff={b.diff}
                small
                label={
                  <button
                    type="button"
                    onClick={() => setBadge({ kind: b.kind, badge: null, group: null })}
                    className="-m-1 flex flex-wrap items-center gap-1 rounded p-1 text-left font-bold active:bg-accent"
                  >
                    {BADGE_INFO[b.kind].short ?? BADGE_INFO[b.kind].name}
                    <CircleHelp
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </button>
                }
              >
                {b.labels.map((label, i) => {
                  const v = views[i];
                  const found = v?.badges.find((x) => badgeRowKind(x.kind) === b.kind);
                  return (
                    <span role="cell" key={i} className="min-w-0 p-2">
                      {v && found && label ? (
                        <BadgeChip
                          badge={found}
                          compact
                          onClick={() =>
                            setBadge({
                              kind: found.kind,
                              badge: found,
                              group: v.group,
                              productName: v.product.name,
                            })
                          }
                        />
                      ) : v ? (
                        <EmptyCell
                          unloaded={v.unrecorded.includes(b.kind)}
                          onClick={(empty) =>
                            setBadge({
                              kind: b.kind,
                              badge: null,
                              group: v.group,
                              productName: v.product.name,
                              empty,
                            })
                          }
                        />
                      ) : null}
                    </span>
                  );
                })}
              </Row>
            ))}

            <Section
              title="成分"
              show={shownIngredients.length > 0}
              aside="1日最大量あたり・（ ）は手引きの分類"
            />
            {shownIngredients.map((r) => (
              <IngredientRow key={r.key} cols={cols} row={r} onOpen={() => openIngredient(r)} />
            ))}
          </div>
        </div>
      </div>

      <IngredientSheet target={ingredient} onClose={() => setIngredient(null)} />
      <BadgeSheet target={badge} onClose={() => setBadge(null)} />
    </div>
  );
}

// 列の番号。選んでいる商品と表の見出しで同じ番号を使い、列と商品を対応させる
export function ColumnNo({ n, className }: { n: number; className?: string }) {
  return (
    <span
      aria-label={`${n}列目`}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground tabular-nums",
        className,
      )}
    >
      {n}
    </span>
  );
}

// 区分の見出し。補足は見出しと同じ1行に短く（L-20261103-16）
function Section({ title, show, aside }: { title: string; show: boolean; aside?: string }) {
  if (!show) return null;
  return (
    <div className="border-t border-border bg-muted px-2 pt-3 pb-1.5">
      {/* 横に送っても読めるよう、画面幅に収めて左に留める */}
      <div className="sticky left-2 flex w-[calc(100vw-4rem)] max-w-xl items-baseline justify-between gap-2">
        <span className="text-xs font-bold text-muted-foreground">{title}</span>
        {aside && <span className="truncate text-[11px] text-muted-foreground">{aside}</span>}
      </div>
    </div>
  );
}

// バッジがないセル。押すと「該当なし」「未収録」の意味を出す
function EmptyCell({
  unloaded,
  onClick,
}: {
  unloaded: boolean;
  onClick: (empty: "none" | "unloaded") => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(unloaded ? "unloaded" : "none")}
      className={cn(
        "-m-1 rounded p-1 text-xs active:bg-accent",
        unloaded
          ? "text-uncertain underline"
          : "text-muted-foreground underline decoration-dotted underline-offset-2",
      )}
    >
      {unloaded ? UI_COPY.badgeUnloaded : UI_COPY.badgeNone}
    </button>
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
          // 項目名は文節で折り返す（「リスク区分」→「リスク／区分」。L-20261103-32）
          "sticky left-0 z-10 flex flex-col items-start gap-1 border-l-4 bg-background p-2 leading-snug [word-break:auto-phrase]",
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
          className="sticky left-2 inline-flex max-w-[calc(100vw-4rem)] min-h-8 items-center gap-1 rounded text-left active:bg-accent"
        >
          <span className="text-sm">
            <span className="font-bold underline decoration-border underline-offset-4">
              {row.label}
            </span>
            {/* 何の成分かを一目で：手引きの分類を括弧で */}
            <span
              className={cn(
                "ml-0.5 text-xs",
                row.group ? "font-bold text-accent-foreground" : "text-muted-foreground",
              )}
            >
              （{row.group ?? "手引きに記載なし"}）
            </span>
          </span>
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

function DiffTag() {
  return <span className="rounded bg-diff px-1 text-[11px] font-bold text-foreground">違う</span>;
}
