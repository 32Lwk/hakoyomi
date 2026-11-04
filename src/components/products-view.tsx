"use client";

import { MapPin, MessageCircleQuestion, Plus, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AbuseStackNotice } from "@/components/abuse-check";
import { ColumnNo, CompareView } from "@/components/compare-view";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { ProductPicker } from "@/components/product-picker";
import { SearchView } from "@/components/search-view";
import { useStack } from "@/components/stack-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useProductViews } from "@/components/use-product-views";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { cn } from "@/lib/utils";

const MAX = 4;

// 商品（L-20261103-43）：上に選んでいる商品（番号つき）、その下で【商品ごと】【比べる】を切り替える。
// 番号は比べる表の列の見出しと同じ
export function ProductsView() {
  const initialView = useSearchParams().get("view") === "compare" ? "compare" : "card";
  const { ids, currentId, select, remove, clear } = useStack();
  const { views, loading } = useProductViews(ids);
  const [view, setView] = useState(initialView);
  const [pickerOpen, setPickerOpen] = useState(false);
  const canCompare = ids.length >= 2;
  const mode = view === "compare" && canCompare ? "compare" : "card";
  const current = views.find((v) => v.product.id === currentId) ?? views.at(-1) ?? null;

  // 0品のときは探すと同じ画面をそのまま出す。選ぶとこの画面に切り替わる（L-20261103-44）
  if (ids.length === 0) return <SearchView />;

  return (
    <div className="flex flex-col gap-3">
      <section aria-labelledby="picked-title" className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <h1 id="picked-title" className="text-base font-bold">
            選んでいる商品
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              {ids.length}/{MAX}品・読んだ順
            </span>
          </h1>
          <button
            type="button"
            onClick={clear}
            className="min-h-8 px-1 text-xs text-primary underline underline-offset-2"
          >
            {UI_COPY.clearProducts}
          </button>
        </div>
        <ul className="grid grid-cols-4 gap-1.5">
          {views.map((v, i) => {
            const active = mode === "card" && current?.product.id === v.product.id;
            return (
              <li key={v.product.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    select(v.product.id);
                    setView("card");
                  }}
                  aria-pressed={active}
                  aria-label={`${i + 1}. ${v.product.name} を開く`}
                  className={cn(
                    "flex h-full w-full flex-col items-center gap-1 rounded-xl border-2 bg-card px-1 pt-2 pb-1.5",
                    active ? "border-primary bg-primary/8 shadow-sm" : "border-border",
                  )}
                >
                  <ColumnNo n={i + 1} className="absolute top-1 left-1" />
                  <ProductImage
                    id={v.product.id}
                    kind={v.product.kind}
                    name={v.product.name}
                    size={44}
                    decorative
                    className="size-11 rounded-md bg-white object-contain"
                  />
                  <span className="line-clamp-2 w-full text-center text-[11px] leading-tight font-bold">
                    {v.product.name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(v.product.id)}
                  aria-label={`${v.product.name} を外す`}
                  className="absolute -top-1.5 -right-1.5 z-10 flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm active:bg-accent"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            );
          })}
          {ids.length < MAX && (
            <li>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex h-full min-h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary/50 text-xs font-bold text-primary active:bg-accent"
              >
                <Plus className="size-5" aria-hidden="true" />
                追加
              </button>
            </li>
          )}
        </ul>
        <AbuseStackNotice views={views} />
      </section>

      {/* 商品ごと／比べる。比べるは2品から */}
      <div role="tablist" aria-label="表示" className="grid grid-cols-2 rounded-xl bg-muted p-1">
        {[
          { key: "card" as const, label: "商品ごと", disabled: false },
          {
            key: "compare" as const,
            label: canCompare ? `比べる（${ids.length}品）` : "比べる",
            disabled: !canCompare,
          },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={mode === t.key}
            disabled={t.disabled}
            onClick={() => setView(t.key)}
            className={cn(
              "min-h-10 rounded-lg text-sm",
              mode === t.key
                ? "bg-background font-bold text-primary shadow-sm"
                : "text-muted-foreground disabled:opacity-50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {!canCompare && <p className="-mt-1 text-xs text-muted-foreground">{UI_COPY.needTwo}</p>}

      {mode === "compare" ? (
        <CompareView />
      ) : current ? (
        <>
          <ProductCard
            view={current}
            otherViews={views.filter((v) => v.product.id !== current.product.id)}
          />
          {/* 下部タブの上に重ねる操作バー */}
          <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 px-4">
            <div className="mx-auto flex max-w-3xl gap-2 rounded-2xl border border-border bg-background/95 p-2 shadow-lg backdrop-blur">
              <Link
                href={`/ask?id=${encodeURIComponent(current.product.id)}`}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
              >
                <MessageCircleQuestion className="size-5" aria-hidden="true" />
                {UI_COPY.askAbout}
              </Link>
              <Link
                href="/shelf"
                className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border-2 border-primary px-4 text-sm font-bold text-primary"
              >
                <MapPin className="size-5" aria-hidden="true" />
                {UI_COPY.openShelf}
              </Link>
            </div>
          </div>
          <div aria-hidden="true" className="h-16" />
        </>
      ) : (
        <p className="pt-6 text-muted-foreground">{loading ? "…" : ""}</p>
      )}

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>商品を追加</SheetTitle>
            <SheetDescription>{UI_COPY.chooseNotice}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <ProductPicker onPicked={() => setPickerOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
