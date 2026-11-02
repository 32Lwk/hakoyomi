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
import { illustrationSrc, KIND_LABEL } from "@/lib/illustration";
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
// 選んだ種類はタブを閉じるまで覚える（商品を見て戻ったとき同じ一覧に戻すため）。検索語は保存しない。
// ヘッダのロゴを押したときは HOME_RESET を送り、種類のタイルに戻す
const KIND_KEY = "hakoyomi.homeKind";
const HOME_RESET = "hakoyomi:home-reset";

export function resetHome() {
  try {
    sessionStorage.removeItem(KIND_KEY);
  } catch {
    // 保存領域が使えない環境では何もしない
  }
  window.dispatchEvent(new Event(HOME_RESET));
}

function isKind(value: string | null): value is MedicineKind {
  return value !== null && value in KIND_LABEL;
}

// 何も開いていない画面（L-20261103-23）。検索欄 → 種類のタイル → 種類を押すとその一覧。
// 読み取りは下部中央の JAN ボタンから
function Home({ read }: { read: ProductView[] }) {
  const { ids, add } = useStack();
  const [q, setQ] = useState("");
  const [kind, setKindState] = useState<MedicineKind | null>(null);
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

  // サーバーの描画と食い違わないよう、復元はハイドレーションの後に行う
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KIND_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部ストレージからの一度きりの復元
      if (isKind(saved)) setKindState(saved);
    } catch {
      // 保存領域が使えない環境では覚えない
    }
  }, []);

  useEffect(() => {
    const reset = () => {
      setKindState(null);
      setQ("");
    };
    window.addEventListener(HOME_RESET, reset);
    return () => window.removeEventListener(HOME_RESET, reset);
  }, []);

  function setKind(next: MedicineKind | null) {
    setKindState(next);
    window.scrollTo({ top: 0 });
    try {
      if (next) sessionStorage.setItem(KIND_KEY, next);
      else sessionStorage.removeItem(KIND_KEY);
    } catch {
      // 同上
    }
  }

  const term = q.trim().toLowerCase();
  const digits = /^[\d０-９\s-]+$/.test(term);
  const products = all ?? [];
  const matched = products.filter((v) => {
    if (!term) return true;
    if (digits) return v.product.jan.includes(cleanJan(term));
    return `${v.product.name} ${v.product.maker}`.toLowerCase().includes(term);
  });
  const byKind = (list: ProductView[]) =>
    KIND_ORDER.map((k) => ({ kind: k, views: list.filter((v) => v.product.kind === k) })).filter(
      (g) => g.views.length > 0,
    );

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

  const kindViews = kind ? products.filter((v) => v.product.kind === kind) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-12 z-20 -mx-4 -mt-4 bg-background/95 px-4 pt-3 pb-2 backdrop-blur">
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
      </div>

      {message && (
        <p role="status" className="-mt-3 rounded-lg bg-muted p-3 text-sm">
          {message}
        </p>
      )}

      {all === null ? (
        <p className="text-muted-foreground">…</p>
      ) : term ? (
        // 検索中：種類ごとにまとめた結果
        matched.length === 0 ? (
          <p className="rounded-lg bg-muted p-3 text-sm">{UI_COPY.noMatch}</p>
        ) : (
          <>
            <ListHeading title={`「${q.trim()}」`} count={matched.length} />
            {byKind(matched).map((g) => (
              <section key={g.kind} className="-mt-2 flex flex-col gap-1.5">
                <h3 className="text-xs font-bold text-muted-foreground">
                  {KIND_LABEL[g.kind]}　{g.views.length}品
                </h3>
                <ProductList views={g.views} ids={ids} onPick={add} />
              </section>
            ))}
          </>
        )
      ) : kind ? (
        // 種類を選んだとき：その種類の一覧
        <section className="-mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setKind(null)}
            className="-ml-1 flex min-h-10 items-center gap-0.5 self-start rounded-lg pr-2 text-sm text-primary active:bg-accent"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
            {UI_COPY.kindsTitle}
          </button>
          <ListHeading title={KIND_LABEL[kind]} count={kindViews.length} />
          <ProductList views={kindViews} ids={ids} onPick={add} />
        </section>
      ) : (
        // 最初の画面：種類のタイル（12種類が1画面に収まる）と読んだ商品
        <>
          <section aria-labelledby="kinds-title" className="-mt-2 flex flex-col gap-2">
            <h2
              id="kinds-title"
              className="flex items-baseline justify-between text-base font-bold"
            >
              {UI_COPY.kindsTitle}
              <span className="text-xs font-normal text-muted-foreground">{products.length}品</span>
            </h2>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {byKind(products).map((g) => (
                <li key={g.kind}>
                  <button
                    type="button"
                    onClick={() => setKind(g.kind)}
                    className="flex h-full w-full flex-col items-center gap-1 rounded-xl border border-border bg-card px-1 py-3 text-center active:bg-accent"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- 小さな静的 SVG */}
                    <img
                      src={illustrationSrc(g.kind, "form")}
                      alt=""
                      width={44}
                      height={44}
                      className="size-11"
                    />
                    <span className="text-sm leading-tight font-bold">{KIND_LABEL[g.kind]}</span>
                    <span className="text-[11px] text-muted-foreground">{g.views.length}品</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {read.length > 0 && (
            <section aria-labelledby="read-title" className="flex flex-col gap-2">
              <h2
                id="read-title"
                className="flex items-baseline justify-between text-base font-bold"
              >
                {UI_COPY.readList}
                <span className="text-xs font-normal text-muted-foreground">{read.length}/4品</span>
              </h2>
              <ProductList views={read} ids={[]} onPick={add} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ListHeading({ title, count }: { title: string; count: number }) {
  return (
    <h2 className="flex items-baseline gap-2 text-lg font-bold">
      {title}
      <span className="text-sm font-normal text-muted-foreground">{count}品</span>
      <span className="ml-auto text-[11px] font-normal text-muted-foreground">
        {UI_COPY.sortedShort}
      </span>
    </h2>
  );
}

function ProductList({
  views,
  ids,
  onPick,
}: {
  views: ProductView[];
  ids: string[];
  onPick: (id: string) => void;
}) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {views.map((v) => (
        <li key={v.product.id}>
          <ProductRow view={v} read={ids.includes(v.product.id)} onPick={onPick} />
        </li>
      ))}
    </ul>
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
        <span className="truncate text-[15px] font-bold">{product.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {/* 一覧では「株式会社」を省いて読みやすくする */}
          {product.maker.replace(/株式会社/g, "").trim()}・{product.riskClass}
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
