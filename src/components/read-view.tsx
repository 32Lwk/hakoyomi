"use client";

import { ChevronLeft, ChevronRight, Columns3, MapPin, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { useStack } from "@/components/stack-provider";
import { Input } from "@/components/ui/input";
import { useProductViews } from "@/components/use-product-views";
import type { ProductView } from "@/lib/catalog";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { KIND_LABEL } from "@/lib/illustration";
import type { MedicineKind } from "@/lib/schema/product";
import { cleanJan, isValidJan } from "@/lib/jan";
import { cn } from "@/lib/utils";

export function ReadView() {
  const { ids, currentId } = useStack();
  const { views, loading } = useProductViews(ids);
  const current = views.find((v) => v.product.id === currentId) ?? null;

  if (!currentId) return <Home read={views} />;
  if (!current) return <p className="pt-6 text-muted-foreground">{loading ? "…" : ""}</p>;
  return <Detail current={current} read={views} />;
}

// 商品を開いた画面：読んだ商品の切り替え → 商品カード → 次の操作（比べる・棚）
function Detail({ current, read }: { current: ProductView; read: ProductView[] }) {
  const { select, setScannerOpen } = useStack();
  const canCompare = read.length >= 2;

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
        <button
          type="button"
          onClick={() => select(null)}
          className="flex min-h-10 shrink-0 items-center gap-0.5 rounded-full pr-2 text-sm text-muted-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {UI_COPY.backToList}
        </button>
        {read.length > 1 && (
          <ul className="flex gap-1.5" aria-label={UI_COPY.readList}>
            {read.map((v) => {
              const active = v.product.id === current.product.id;
              return (
                <li key={v.product.id}>
                  <button
                    type="button"
                    onClick={() => select(v.product.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex min-h-10 items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 text-sm whitespace-nowrap",
                      active
                        ? "border-primary bg-primary font-bold text-primary-foreground"
                        : "border-border bg-background",
                    )}
                  >
                    <ProductImage
                      id={v.product.id}
                      kind={v.product.kind}
                      name={v.product.name}
                      size={28}
                      decorative
                      className="size-7 rounded-full bg-white p-0.5"
                    />
                    {v.product.name}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ProductCard view={current} />

      {/* 下部タブの上に重ねる操作バー。読んだ後に迷わず次へ進めるように */}
      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 px-4">
        <div className="mx-auto flex max-w-3xl gap-2 rounded-2xl border border-border bg-background/95 p-2 shadow-lg backdrop-blur">
          {canCompare ? (
            <Link
              href="/compare"
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
            >
              <Columns3 className="size-5" aria-hidden="true" />
              {read.length}品を比べる
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
            >
              <Plus className="size-5" aria-hidden="true" />
              {UI_COPY.readAnother}
            </button>
          )}
          <Link
            href="/shelf"
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border-2 border-primary px-4 text-sm font-bold text-primary"
          >
            <MapPin className="size-5" aria-hidden="true" />
            {UI_COPY.openShelf}
          </Link>
        </div>
      </div>
      {/* 操作バーの分だけ下を空ける */}
      <div aria-hidden="true" className="h-16" />
    </div>
  );
}

// 種類の並びは KIND_LABEL の定義順で固定（棚の並びに近い順。順位ではない）
const KIND_ORDER = Object.keys(KIND_LABEL) as MedicineKind[];

// 何も開いていない画面：検索と種類で絞る一覧（L-20261103-21）。読み取りは下部中央の JAN ボタンから
function Home({ read }: { read: ProductView[] }) {
  const { ids, add } = useStack();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<MedicineKind | "all">("all");
  const [all, setAll] = useState<ProductView[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/search?q=")
      .then((res) => res.json() as Promise<{ views: ProductView[] }>)
      .then((d) => {
        if (!cancelled) setAll(d.views);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const term = q.trim().toLowerCase();
  const digits = /^[\d０-９\s-]+$/.test(term);
  const matched = (all ?? []).filter((v) => {
    if (!term) return true;
    if (digits) return v.product.jan.includes(cleanJan(term));
    return `${v.product.name} ${v.product.maker}`.toLowerCase().includes(term);
  });

  // 種類ごとにまとめる。種類の並びは KIND_LABEL の定義順、種類の中は品名順（どちらも順位ではない）
  const counts = new Map<MedicineKind, number>();
  for (const v of matched) counts.set(v.product.kind, (counts.get(v.product.kind) ?? 0) + 1);
  const kinds = KIND_ORDER.filter((k) => counts.has(k));
  // 検索で選んだ種類の品がなくなったら「すべて」に戻して見せる
  const current = kind !== "all" && kinds.includes(kind) ? kind : "all";
  const groups = (current === "all" ? kinds : [current]).map((k) => ({
    kind: k,
    views: matched.filter((v) => v.product.kind === k),
  }));

  async function submit() {
    setMessage(null);
    if (matched.length === 1) return add(matched[0].product.id);
    if (!digits) return;
    const code = cleanJan(term);
    if (!isValidJan(code)) return setMessage(UI_COPY.invalidJan);
    const res = await fetch(`/api/jan?code=${code}`);
    if (!res.ok) return setMessage(res.status === 404 ? UI_COPY.unknownJan : UI_COPY.readError);
    add(((await res.json()) as { product: { id: string } }).product.id);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 検索と種類は送っても見えるよう上に留める */}
      <div className="sticky top-12 z-20 -mx-4 -mt-4 flex flex-col gap-2 bg-background/95 px-4 pt-3 pb-2 backdrop-blur">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="relative"
        >
          <label htmlFor="home-q" className="sr-only">
            {UI_COPY.findPlaceholder}
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="home-q"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setMessage(null);
            }}
            placeholder={UI_COPY.findPlaceholder}
            inputMode="search"
            autoComplete="off"
            className="h-11 rounded-xl pl-11 text-base"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="検索語を消す"
              className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </form>
        <div
          role="group"
          aria-label="種類"
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]"
        >
          {[
            { key: "all" as const, label: UI_COPY.showAll, n: matched.length },
            ...kinds.map((k) => ({ key: k, label: KIND_LABEL[k], n: counts.get(k) ?? 0 })),
          ].map((t) => {
            const on = current === t.key;
            return (
              <button
                type="button"
                key={t.key}
                onClick={() => setKind(t.key)}
                aria-pressed={on}
                className={cn(
                  "min-h-9 shrink-0 rounded-full border px-3 text-[13px] whitespace-nowrap",
                  on
                    ? "border-primary bg-primary font-bold text-primary-foreground"
                    : "border-border bg-background",
                )}
              >
                {t.label}
                <span className="ml-1 tabular-nums opacity-80">{t.n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {message && (
        <p role="status" className="rounded-lg bg-muted p-3 text-sm">
          {message}
        </p>
      )}

      {!term && read.length > 0 && (
        <section aria-labelledby="read-title" className="flex flex-col gap-1.5">
          <h2 id="read-title" className="text-xs font-bold text-muted-foreground">
            {UI_COPY.readList}（{read.length}/4）
          </h2>
          <ul className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
            {read.map((v) => (
              <li key={v.product.id}>
                <button
                  type="button"
                  onClick={() => add(v.product.id)}
                  className="flex min-h-10 items-center gap-1.5 rounded-full border border-border py-1 pr-3 pl-1 text-sm whitespace-nowrap active:bg-accent"
                >
                  <ProductImage
                    id={v.product.id}
                    kind={v.product.kind}
                    name={v.product.name}
                    size={28}
                    decorative
                    className="size-7 rounded-full bg-white object-contain p-0.5"
                  />
                  {v.product.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {all === null ? (
        <p className="text-muted-foreground">…</p>
      ) : groups.length === 0 ? (
        <p className="rounded-lg bg-muted p-3 text-sm">{UI_COPY.noMatch}</p>
      ) : (
        <>
          <p className="-mb-2 text-[11px] text-muted-foreground">
            {UI_COPY.demoList} {matched.length}品・{UI_COPY.sortedByName}
          </p>
          {groups.map((g) => (
            <section
              key={g.kind}
              aria-labelledby={`home-${g.kind}`}
              className="flex flex-col gap-1.5"
            >
              <h2 id={`home-${g.kind}`} className="flex items-baseline gap-2 text-sm font-bold">
                {KIND_LABEL[g.kind]}
                <span className="text-xs font-normal text-muted-foreground">
                  {g.views.length}品
                </span>
              </h2>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {g.views.map((v) => (
                  <li key={v.product.id}>
                    <ProductRow view={v} read={ids.includes(v.product.id)} onPick={add} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

// 一覧の1行。写真は小さく、品名を主に（1画面に多く見えるように）
function ProductRow({
  view,
  read,
  onPick,
}: {
  view: ProductView;
  read: boolean;
  onPick: (id: string) => void;
}) {
  const { product } = view;
  return (
    <button
      type="button"
      onClick={() => onPick(product.id)}
      className="flex w-full items-center gap-3 px-2.5 py-2 text-left active:bg-accent"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-border">
        <ProductImage
          id={product.id}
          kind={product.kind}
          name={product.name}
          size={48}
          decorative
          className="size-11 object-contain"
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-bold">{product.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {product.maker}・{product.riskClass}
        </span>
      </span>
      {read && (
        <span className="shrink-0 rounded bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">
          {UI_COPY.readMark}
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}
