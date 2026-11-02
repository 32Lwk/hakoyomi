"use client";

import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  MapPin,
  Plus,
  ScanBarcode,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { useStack } from "@/components/stack-provider";
import { Input } from "@/components/ui/input";
import { useProductViews } from "@/components/use-product-views";
import type { ProductView } from "@/lib/catalog";
import { UI_COPY } from "@/lib/guard/uiCopy";
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

// 何も開いていない画面：読む／探す の2つの入口と、読んだ商品・デモ商品の一覧
function Home({ read }: { read: ProductView[] }) {
  const { add, setScannerOpen } = useStack();
  const [q, setQ] = useState("");
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
  const shown =
    all?.filter((v) => {
      if (!term) return true;
      if (digits) return v.product.jan.includes(cleanJan(term));
      return `${v.product.name} ${v.product.maker}`.toLowerCase().includes(term);
    }) ?? null;

  async function submit() {
    setMessage(null);
    if (shown?.length === 1) return add(shown[0].product.id);
    if (!digits) return;
    const code = cleanJan(term);
    if (!isValidJan(code)) return setMessage(UI_COPY.invalidJan);
    const res = await fetch(`/api/jan?code=${code}`);
    if (!res.ok) return setMessage(res.status === 404 ? UI_COPY.unknownJan : UI_COPY.readError);
    add(((await res.json()) as { product: { id: string } }).product.id);
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => setScannerOpen(true)}
        className="flex items-center gap-4 rounded-2xl bg-primary p-5 text-left text-primary-foreground shadow-md active:translate-y-px"
      >
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <ScanBarcode className="size-8" aria-hidden="true" />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-lg font-bold">JANを読む</span>
          <span className="text-sm opacity-85">{UI_COPY.scanLead}</span>
        </span>
        <ChevronRight className="size-5 opacity-70" aria-hidden="true" />
      </button>

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
          className="h-12 rounded-xl pl-11 text-base"
        />
      </form>
      {message && (
        <p role="status" className="-mt-3 rounded-lg bg-muted p-3 text-sm">
          {message}
        </p>
      )}

      {!term && read.length > 0 && (
        <section aria-labelledby="read-title" className="flex flex-col gap-2">
          <h2 id="read-title" className="text-sm font-bold text-muted-foreground">
            {UI_COPY.readList}（{read.length}/4）
          </h2>
          <ProductGrid views={read} onPick={add} />
        </section>
      )}

      <section aria-labelledby="demo-title" className="flex flex-col gap-2">
        <h2
          id="demo-title"
          className="flex items-baseline justify-between text-sm font-bold text-muted-foreground"
        >
          {term ? `「${q.trim()}」の商品` : UI_COPY.demoList}
          <span className="text-xs font-normal">{UI_COPY.sortedByName}</span>
        </h2>
        {shown === null ? (
          <p className="text-muted-foreground">…</p>
        ) : shown.length ? (
          <ProductGrid views={shown} onPick={add} />
        ) : (
          <p className="rounded-lg bg-muted p-3 text-sm">{UI_COPY.noMatch}</p>
        )}
      </section>
    </div>
  );
}

function ProductGrid({ views, onPick }: { views: ProductView[]; onPick: (id: string) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {views.map((v) => (
        <li key={v.product.id}>
          <button
            type="button"
            onClick={() => onPick(v.product.id)}
            className="flex h-full w-full flex-col gap-2 rounded-xl border border-border bg-card p-2 text-left transition-colors active:bg-accent"
          >
            <span className="flex h-20 items-center justify-center rounded-lg bg-white">
              <ProductImage
                id={v.product.id}
                kind={v.product.kind}
                name={v.product.name}
                size={80}
                decorative
                className="h-full w-auto max-w-full object-contain"
              />
            </span>
            <span className="flex flex-col px-0.5">
              <span className="text-sm leading-snug font-bold">{v.product.name}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {v.product.maker}・{v.product.riskClass}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
