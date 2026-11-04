"use client";

import {
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileText,
  MapPin,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AbuseCheckBanner } from "@/components/abuse-check";
import { BadgeRow } from "@/components/badges";
import { IngredientSheet } from "@/components/ingredient-sheet";
import { MemoSection } from "@/components/memo-section";
import { factAmountText } from "@/lib/compare";
import { dailyMaxLabel, timesPerDayLabel } from "@/lib/dosage";
import { ingredientRole } from "@/lib/ingredientRole";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { cn } from "@/lib/utils";
import type { ProductView } from "@/lib/catalog";
import { ProductImage } from "@/components/product-image";
import { packageImage } from "@/lib/packageImage";
import type { DialogueChecklist } from "@/lib/veteran/checklist";

// 上から「何の商品か」→「確認ポイント」→「用法・用量」→「成分・分量」→「場所」→「添付文書」の順。店頭で聞かれる順に並べる
export function ProductCard({
  view,
  otherViews = [],
}: {
  view: ProductView;
  otherViews?: ProductView[];
}) {
  const { product, badges, group, location, sku } = view;
  const image = packageImage(product.id, product.kind, product.name);
  const [ingredient, setIngredient] = useState<string | null>(null);
  const [checklistData, setChecklistData] = useState<{
    id: string;
    checklist: DialogueChecklist | null;
  } | null>(null);

  const checklist = checklistData?.id === product.id ? checklistData.checklist : null;
  const checklistLoading = Boolean(checklistData?.id !== product.id);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/products/${product.id}/checklist`)
      .then((res) => res.json() as Promise<{ checklist: DialogueChecklist | null }>)
      .then((d) => {
        if (!cancelled) {
          setChecklistData({ id: product.id, checklist: d.checklist });
        }
      })
      .catch(() => {
        if (!cancelled) setChecklistData({ id: product.id, checklist: null });
      });

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  return (
    <article className="flex flex-col gap-5">
      <header className="flex gap-4">
        <figure className="flex shrink-0 flex-col items-center gap-1">
          {/* デモSKUはゆうが取得したパッケージ写真（L-40）、それ以外は種類のイメージ図（L-33） */}
          <ProductImage
            id={product.id}
            kind={product.kind}
            name={product.name}
            size={112}
            className="size-28 rounded-xl bg-muted p-1.5"
          />
          <figcaption className="text-[10px] text-muted-foreground">{image.caption}</figcaption>
        </figure>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
          <span className="self-start rounded border-2 border-primary px-1.5 text-xs font-bold text-primary">
            {product.riskClass}
          </span>
          <h1 className="text-xl leading-snug font-bold">{product.name}</h1>
          <p className="text-xs text-muted-foreground">
            {product.maker}
            <br />
            JAN <span className="tabular-nums">{product.jan}</span>
          </p>
        </div>
      </header>

      {/* 接客前チェックリスト（お客様への問いかけ） */}
      {(checklist || checklistLoading) && (
        <section
          aria-label="接客前の確認チェック"
          className="relative overflow-hidden rounded-xl border border-sky-500/30 bg-sky-50/40 p-3.5 text-card-foreground shadow-sm dark:bg-sky-950/20"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 dark:text-sky-200">
            <ClipboardCheck className="size-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <span>接客前チェック（先輩ならここを確認する）</span>
            {checklistLoading && (
              <span className="flex items-center gap-1 text-[10px] font-normal text-muted-foreground ml-auto animate-pulse">
                <Sparkles className="size-3 text-sky-500" />
                生成中…
              </span>
            )}
          </div>

          {checklist && (
            <div className="mt-2.5 flex flex-col gap-2">
              {checklist.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-1 rounded-lg border border-sky-200/50 bg-background/80 p-2.5 text-xs dark:border-sky-900/40"
                >
                  <div className="flex items-start gap-1.5">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                      {idx + 1}
                    </span>
                    <p className="font-bold text-foreground leading-snug">「{item.dialogue}」</p>
                  </div>
                  <div className="flex items-center gap-2 pl-5.5 text-[11px] text-muted-foreground">
                    <span className="rounded bg-sky-100/70 px-1.5 py-0.2 text-[10px] font-medium text-sky-900 dark:bg-sky-900/40 dark:text-sky-300">
                      {item.badgeText}
                    </span>
                    <span>{item.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <DosageStats view={view} />

      <AbuseCheckBanner view={view} otherViews={otherViews} />

      <BadgeRow badges={badges} group={group} unrecorded={view.unrecorded} />

      {sku?.flags.drowsyMention && (
        <p className="rounded-xl border border-border px-3 py-2.5 text-sm">
          {UI_COPY.drowsyIngredient}
        </p>
      )}

      {/* 確認ポイントの後に飲み方（L-20261104-22、ゆうの選択） */}
      <DosageTable view={view} />

      <section aria-labelledby="facts-title" className="flex flex-col gap-2">
        <h2 id="facts-title" className="flex items-baseline justify-between text-base font-bold">
          成分・分量
          <span className="text-xs font-normal text-muted-foreground">
            1日最大量あたり・タップで配合目的
          </span>
        </h2>
        {/* 成分名の下に、手引きの分類と配合目的。タップで原文と出典（L-20261103-05） */}
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {product.facts.map((f) => {
            const role = ingredientRole(product.kind, f.ingredient);
            return (
              <li key={f.ingredient}>
                <button
                  type="button"
                  onClick={() => setIngredient(f.ingredient)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-accent"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm">{f.ingredient}</span>
                    {role ? (
                      <span className="text-xs text-muted-foreground">
                        <span className="font-bold text-accent-foreground">{role.group}</span>・
                        {role.purpose}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">手引きに記載なし</span>
                    )}
                  </span>
                  {f.uncertain ? (
                    <span className="text-sm text-uncertain underline">{UI_COPY.uncertain}</span>
                  ) : (
                    // 濃度（100mL中 30mg など）は長いので小さめに（L-20261104-13）
                    <span
                      className={cn(
                        "font-bold whitespace-nowrap tabular-nums",
                        f.amountPerDay === null && f.concentration ? "text-sm" : "text-xl",
                      )}
                    >
                      {factAmountText(f)}
                    </span>
                  )}
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-muted-foreground">
          出典：この商品の成分・分量（入力：{product.enteredBy}
          {product.verifiedOn ? `、確認日 ${product.verifiedOn}` : "、未確認"}）
        </p>
        {sku && !product.verifiedOn && sku.research.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            {UI_COPY.researchedFacts}：
            {sku.research.map((r, i) => (
              <span key={r.url}>
                {i > 0 && "／"}
                <a href={r.url} target="_blank" rel="noreferrer" className="underline">
                  {r.label}
                </a>
              </span>
            ))}
          </p>
        )}
      </section>

      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border">
        {location && (
          <Link
            href="/shelf"
            className="flex min-h-14 items-center gap-3 px-3 py-2.5 active:bg-accent"
          >
            <MapPin className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs text-muted-foreground">
                売場の場所（{location.shelf.where}・{location.areaLabel}）
              </span>
              <span className="text-sm">
                <span className="font-bold">{location.shelf.label}</span>　上から{location.tier}
                段目・左から{location.column}列目
              </span>
            </span>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
          </Link>
        )}
        {product.pmdaUrl ? (
          <a
            href={product.pmdaUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-14 items-center gap-3 px-3 py-2.5 active:bg-accent"
          >
            <FileText className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs text-muted-foreground">効能・効果／用法・用量</span>
              <span className="text-sm">{sku?.source.label ?? "添付文書を PMDA で開く"}</span>
            </span>
            <ExternalLink className="size-4 text-muted-foreground" aria-hidden="true" />
          </a>
        ) : (
          <p className="px-3 py-2.5 text-xs text-muted-foreground">{UI_COPY.demoProducts}</p>
        )}
      </div>
      {product.pmdaUrl && (
        <p className="-mt-3 text-[11px] text-muted-foreground">{UI_COPY.linkOutText}</p>
      )}
      <MemoSection productId={product.id} ingredients={product.facts.map((f) => f.ingredient)} />
      <IngredientSheet
        target={
          ingredient ? { ingredient, products: [{ name: product.name, kind: product.kind }] } : null
        }
        onClose={() => setIngredient(null)}
      />
    </article>
  );
}

// 1日最大・服用間隔・内容量。品名のすぐ下、確認ポイントの上に置く（L-20261104-22、ゆうの指定）。
// 表と重なる「1日の回数」は表がないときだけ
function DosageStats({ view }: { view: ProductView }) {
  const { dosage, product } = view;
  return (
    <dl
      className={cn(
        "grid divide-x divide-border rounded-xl bg-muted text-center",
        dosage?.intervalHours == null && dosage ? "grid-cols-2" : "grid-cols-3",
      )}
    >
      <Stat label="1日最大" value={dailyMaxLabel(product)} small={product.dailyMaxUnits === null} />
      {!dosage && (
        <Stat
          label="1日の回数"
          value={timesPerDayLabel(product)}
          small={product.timesPerDay === null}
        />
      )}
      {dosage?.intervalHours != null && (
        <Stat label="服用間隔" value={`${dosage.intervalHours}時間以上`} small />
      )}
      <Stat label="内容量" value={`${product.contentQty}${product.contentUnit}`} />
    </dl>
  );
}

// 用法・用量の表（L-20261104-22）。年齢区分・1回量・1日の回数の値だけ。個人に合わせた量は出さない
function DosageTable({ view }: { view: ProductView }) {
  const { dosage, product } = view;
  const notTake = product.route === "external" ? UI_COPY.dosageNotUse : UI_COPY.dosageNotTake;
  return (
    <section aria-labelledby="dosage-title" className="flex flex-col gap-2">
      <h2 id="dosage-title" className="text-base font-bold">
        用法・用量
      </h2>
      {dosage ? (
        <>
          <table className="w-full overflow-hidden rounded-xl border border-border text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-1.5 text-left font-normal">
                  年齢
                </th>
                <th scope="col" className="px-3 py-1.5 text-right font-normal">
                  1回量
                </th>
                <th scope="col" className="px-3 py-1.5 text-right font-normal">
                  1日
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dosage.rows.map((r) => (
                <tr key={r.age}>
                  <th scope="row" className="px-3 py-2 text-left font-normal">
                    {r.age}
                  </th>
                  {r.dose ? (
                    <>
                      <td className="px-3 py-2 text-right text-lg font-bold tabular-nums">
                        {r.dose}
                      </td>
                      <td className="px-3 py-2 text-right font-bold tabular-nums">
                        {r.times ?? dosage.timesPerDay ?? (timesPerDayLabel(product) || "—")}
                      </td>
                    </>
                  ) : (
                    <td colSpan={2} className="px-3 py-2 text-right text-muted-foreground">
                      {notTake}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="rounded-xl border border-border px-3 py-2.5 text-sm text-uncertain">
          {UI_COPY.dosageNone}
        </p>
      )}
      {dosage && (
        <p className="text-[11px] text-muted-foreground">
          {UI_COPY.dosageSource}（{dosage.checkedOn}）
        </p>
      )}
    </section>
  );
}

// small：添付文書の表記（「1日1回〜数回」など）は長いので一段小さく
function Stat({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 px-2 py-2.5">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className={cn("font-bold tabular-nums", small ? "text-sm leading-7" : "text-lg")}>
        {value}
      </dd>
    </div>
  );
}
