"use client";

import { ChevronRight, ExternalLink, FileText, MapPin, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ageStatus, BadgeRow, BadgeSheet } from "@/components/badges";
import { IngredientSheet } from "@/components/ingredient-sheet";
import { ingredientRole } from "@/lib/ingredientRole";
import { BADGE_INFO, UI_COPY } from "@/lib/guard/uiCopy";
import { cn } from "@/lib/utils";
import type { ProductView } from "@/lib/catalog";
import { ProductImage } from "@/components/product-image";
import { packageImage } from "@/lib/packageImage";

function amount(value: number | null, unit: string | null): string {
  if (value === null || unit === null) return "不明";
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`;
}

// 上から「何の商品か」→「確認ポイント」→「成分・分量」→「場所」→「添付文書」の順。店頭で聞かれる順に並べる
export function ProductCard({ view }: { view: ProductView }) {
  const { product, badges, group, location, sku } = view;
  const image = packageImage(product.id, product.kind, product.name);
  const [ingredient, setIngredient] = useState<string | null>(null);
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

      <AgeBand view={view} />

      <dl className="grid grid-cols-3 divide-x divide-border rounded-xl bg-muted text-center">
        <Stat label="内容量" value={`${product.contentQty}${product.contentUnit}`} />
        <Stat label="1日最大" value={`${product.dailyMaxUnits}${product.contentUnit}`} />
        <Stat label="1日の回数" value={`${product.timesPerDay}回`} />
      </dl>

      <BadgeRow badges={badges} group={group} noticeLoaded={view.noticeLoaded} />

      {sku?.flags.drowsyMention && (
        <p className="rounded-xl border border-border px-3 py-2.5 text-sm">
          {UI_COPY.drowsyIngredient}
        </p>
      )}

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
                    <span className="text-xl font-bold whitespace-nowrap tabular-nums">
                      {amount(f.amountPerDay, f.unit)}
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
      <IngredientSheet
        target={
          ingredient ? { ingredient, products: [{ name: product.name, kind: product.kind }] } : null
        }
        onClose={() => setIngredient(null)}
      />
    </article>
  );
}

// 年齢は店頭で最初に確かめることが多いので、品名のすぐ下に大きく出す。押すと根拠（L-20261103-16）
function AgeBand({ view }: { view: ProductView }) {
  const [open, setOpen] = useState(false);
  const age = ageStatus(view.badges, view.noticeLoaded);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex min-h-14 items-center gap-3 rounded-xl px-4 py-2 text-left active:translate-y-px",
          age.state === "set"
            ? "bg-notice text-white"
            : age.state === "unloaded"
              ? "border-2 border-uncertain text-uncertain"
              : "border-2 border-border text-muted-foreground",
        )}
      >
        <UserRound className="size-5 shrink-0" aria-hidden="true" />
        <span className="text-sm">{BADGE_INFO.under15.name}</span>
        <span className={cn("flex-1 font-bold", age.state === "set" ? "text-2xl" : "text-base")}>
          {age.text}
        </span>
        <ChevronRight className="size-5 shrink-0 opacity-70" aria-hidden="true" />
      </button>
      <BadgeSheet
        target={
          open
            ? {
                kind: age.badge?.kind ?? "under15",
                badge: age.badge,
                group: view.group,
                empty: age.state === "set" ? undefined : age.state,
              }
            : null
        }
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-2 py-2.5">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-lg font-bold tabular-nums">{value}</dd>
    </div>
  );
}
