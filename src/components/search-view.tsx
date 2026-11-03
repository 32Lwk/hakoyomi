"use client";

import { BookOpen, Check, ChevronDown, Loader2, Plus, ScanBarcode, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ProductList } from "@/components/product-row";
import { useStack } from "@/components/stack-provider";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ProductView } from "@/lib/catalog";
import { amountText } from "@/lib/compare";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { illustrationSrc, KIND_LABEL } from "@/lib/illustration";
import { ingredientRole } from "@/lib/ingredientRole";
import { matchedTerms, standardOf, type ReverseResult } from "@/lib/reverse/match";
import { canonicalName, normalizeName } from "@/lib/rules/normalize";
import type { BadgeKind } from "@/lib/schema/notice";
import type { MedicineKind } from "@/lib/schema/product";
import { cn } from "@/lib/utils";

// 「含まない」の条件。該当するバッジを持たない商品だけを残す。short は選んだ条件のチップ用
const CONDITIONS: { kind: BadgeKind; label: string; short: string }[] = [
  { kind: "drive", label: "運転注意の成分を含まない", short: "運転注意なし" },
  { kind: "caffeine", label: "カフェインを含まない", short: "カフェインなし" },
  { kind: "abuse", label: "指定濫用防止の対象外", short: "濫用防止の対象外" },
  { kind: "doping", label: "ドーピング禁止成分を含まない", short: "禁止成分なし" },
];

// 種類の並びは KIND_LABEL の定義順で固定（棚の並びに近い順。順位ではない）
const KIND_ORDER = Object.keys(KIND_LABEL) as MedicineKind[];

type Filters = {
  term: string;
  kind: MedicineKind | null;
  // 成分は canonicalName でそろえた名前。選んだ成分をすべて含む商品を残す
  ingredients: string[];
  exclude: BadgeKind[];
};

type Ingredient = { key: string; name: string; group: string | null; count: number };

function hasIngredient(view: ProductView, key: string): boolean {
  return view.product.facts.some((f) => canonicalName(f.ingredient) === key);
}

function matchesTerm(view: ProductView, term: string): boolean {
  if (!term) return true;
  const { product } = view;
  if (/^\d+$/.test(term)) return product.jan.includes(term);
  return (
    normalizeName(`${product.name}${product.maker}`).includes(term) ||
    product.facts.some((f) => normalizeName(f.ingredient).includes(term))
  );
}

// skip に挙げた条件は当てない（シートで「この条件を変えたら何品か」を数えるため）
function apply(views: ProductView[], f: Filters, skip?: keyof Filters): ProductView[] {
  return views.filter(
    (v) =>
      (skip === "term" || matchesTerm(v, f.term)) &&
      (skip === "kind" || !f.kind || v.product.kind === f.kind) &&
      (skip === "ingredients" || f.ingredients.every((k) => hasIngredient(v, k))) &&
      // 通知由来の条件は、通知を取り込んでいない薬効群の商品では確かめられないので残さない
      (skip === "exclude" ||
        f.exclude.every(
          (kind) => !v.badges.some((b) => b.kind === kind) && !v.unrecorded.includes(kind),
        )),
  );
}

// 成分の一覧（手引きの分類つき）。並びは分類ごとの名前順
function ingredientIndex(views: ProductView[]): Map<string, Ingredient> {
  const index = new Map<string, Ingredient>();
  for (const v of views) {
    for (const fact of v.product.facts) {
      const key = canonicalName(fact.ingredient);
      const group = ingredientRole(v.product.kind, fact.ingredient)?.group ?? null;
      const found = index.get(key);
      if (found) {
        found.count++;
        found.group ??= group;
      } else index.set(key, { key, name: fact.ingredient, group, count: 1 });
    }
  }
  return index;
}

type Panel = "kind" | "ingredients" | "exclude";

// さがす（L-20261103-30）：検索欄 → 種類・成分・含まないの3つのボタン → 選んだ条件 → 結果。
// 結果は品名順（順位なし）。検索語・条件は保存しない
export function SearchView() {
  const { ids, add, setScannerOpen } = useStack();
  const router = useRouter();
  const [all, setAll] = useState<ProductView[] | null>(null);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<MedicineKind | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [exclude, setExclude] = useState<BadgeKind[]>([]);
  const [panel, setPanel] = useState<Panel | null>(null);
  // 逆引き（T302）の結果。検索語を変えたら外す。入力は保存しない
  const [reverse, setReverse] = useState<ReverseResult | null>(null);
  const [reversing, setReversing] = useState(false);

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

  const products = all ?? [];
  const index = ingredientIndex(products);
  // 逆引き中は、検索語を品名ではなく効能・効果の語として使う
  const filters: Filters = { term: reverse ? "" : normalizeName(q), kind, ingredients, exclude };
  const shown = apply(products, filters).filter(
    (v) => !reverse || matchedTerms(v.product, reverse.terms).length > 0,
  );
  const groups = KIND_ORDER.map((k) => ({
    kind: k,
    views: shown.filter((v) => v.product.kind === k),
  })).filter((g) => g.views.length > 0);

  // 入力が成分名に当たるときは、成分の条件として選べるようにする
  const suggested = filters.term
    ? [...index.values()]
        .filter((i) => !ingredients.includes(i.key) && normalizeName(i.name).includes(filters.term))
        .sort((a, b) => a.name.localeCompare(b.name, "ja"))
        .slice(0, 6)
    : [];

  // 結果の行に、絞った成分（または入力に当たった成分）の分量を添える。逆引きでは当たった承認基準の語
  const note = (v: ProductView) => {
    if (reverse) {
      const words = matchedTerms(v.product, reverse.terms).map((t) => t.word);
      return `${UI_COPY.reverseMatched}：${words.join("・")}`;
    }
    const facts = v.product.facts.filter(
      (f) =>
        ingredients.includes(canonicalName(f.ingredient)) ||
        (filters.term && normalizeName(f.ingredient).includes(filters.term)),
    );
    if (facts.length === 0) return null;
    return facts
      .map(
        (f) =>
          `${f.ingredient} ${f.uncertain ? UI_COPY.uncertain : amountText(f.amountPerDay, f.unit)}`,
      )
      .join("・");
  };

  const toggleIngredient = (key: string) =>
    setIngredients((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  const toggleExclude = (k: BadgeKind) =>
    setExclude((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const chips = [
    ...(kind ? [{ key: `k-${kind}`, label: KIND_LABEL[kind], remove: () => setKind(null) }] : []),
    ...ingredients.map((key) => ({
      key: `i-${key}`,
      label: index.get(key)?.name ?? key,
      remove: () => toggleIngredient(key),
    })),
    ...exclude.map((k) => ({
      key: `e-${k}`,
      label: CONDITIONS.find((c) => c.kind === k)?.short ?? k,
      remove: () => toggleExclude(k),
    })),
  ];
  const clearAll = () => {
    setKind(null);
    setIngredients([]);
    setExclude([]);
  };

  const runReverse = async () => {
    setReversing(true);
    try {
      const res = await fetch("/api/reverse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const result = (await res.json()) as ReverseResult;
      setReverse(result);
      // 「眠くならない」などの条件は、含まないの条件として選んだ状態にする（チップで外せる）
      setExclude((prev) => [...new Set([...prev, ...result.exclude])]);
    } catch {
      setReverse({ terms: [], exclude: [], via: "keyword" });
    } finally {
      setReversing(false);
    }
  };

  // 選んだ商品は「商品」で開く（L-20261103-43）
  const pick = (id: string) => {
    add(id);
    router.push("/products");
  };
  // 何も入れていないときは、一覧ではなく種類のタイルを出す
  const idle = !q.trim() && !kind && ingredients.length === 0 && exclude.length === 0 && !reverse;

  return (
    <div className="flex flex-col gap-4">
      {/* 主経路は JAN（prd）。探すの最上部に大きく置く。下部の中央をもう一度押しても読める */}
      <button
        type="button"
        onClick={() => setScannerOpen(true)}
        className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#2d5a8c] to-primary p-3.5 text-left text-primary-foreground shadow-md active:translate-y-px"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15">
          <ScanBarcode className="size-7" aria-hidden="true" />
        </span>
        <span className="flex flex-col">
          <span className="text-lg font-bold">{UI_COPY.readJan}</span>
          <span className="text-xs opacity-85">{UI_COPY.readJanHint}</span>
        </span>
      </button>

      <div className="sticky top-12 z-20 -mx-4 -mt-2 flex flex-col gap-2 bg-background/95 px-4 pt-2 pb-2 backdrop-blur">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
          <label htmlFor="search-q" className="sr-only">
            {UI_COPY.searchPlaceholder}
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="search-q"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setReverse(null);
            }}
            placeholder={UI_COPY.searchPlaceholder}
            inputMode="search"
            autoComplete="off"
            className="h-11 rounded-xl pl-11 text-base"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setReverse(null);
              }}
              aria-label="検索語を消す"
              className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </form>

        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { panel: "kind", label: "種類", n: kind ? 1 : 0 },
              { panel: "ingredients", label: "成分", n: ingredients.length },
              { panel: "exclude", label: "含まない", n: exclude.length },
            ] as const
          ).map((b) => (
            <button
              key={b.panel}
              type="button"
              onClick={() => setPanel(b.panel)}
              aria-haspopup="dialog"
              className={cn(
                "flex min-h-10 items-center justify-center gap-1 rounded-lg border text-sm font-bold",
                b.n > 0 ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {b.label}
              {b.n > 0 && (
                <span className="rounded-full bg-primary-foreground px-1.5 text-[11px] text-primary tabular-nums">
                  {b.n}
                </span>
              )}
              <ChevronDown className="size-4 opacity-70" aria-hidden="true" />
            </button>
          ))}
        </div>

        {chips.length > 0 && (
          <ul className="flex flex-wrap items-center gap-1.5" aria-label="選んだ条件">
            {chips.map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={c.remove}
                  aria-label={`${c.label} の条件を外す`}
                  className="flex min-h-8 items-center gap-1 rounded-full bg-accent pr-1.5 pl-2.5 text-xs font-bold text-accent-foreground"
                >
                  {c.label}
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={clearAll}
                className="min-h-8 px-1 text-xs text-primary underline underline-offset-2"
              >
                {UI_COPY.clearFilters}
              </button>
            </li>
          </ul>
        )}
      </div>

      {q.trim() && !reverse && (
        <button
          type="button"
          onClick={runReverse}
          disabled={reversing}
          className="-mt-2 flex min-h-11 items-center gap-2 rounded-xl border border-primary px-3 text-left text-sm font-bold text-primary disabled:opacity-60"
        >
          {reversing ? (
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <BookOpen className="size-4 shrink-0" aria-hidden="true" />
          )}
          <span className="min-w-0 [word-break:auto-phrase]">
            「{q.trim()}」を{UI_COPY.reverseAction}
          </span>
        </button>
      )}

      {reverse && <ReversePanel result={reverse} onClear={() => setReverse(null)} />}

      {suggested.length > 0 && !reverse && (
        <section aria-labelledby="suggest-title" className="-mt-2 flex flex-col gap-1.5">
          <h2 id="suggest-title" className="text-xs font-bold text-muted-foreground">
            {UI_COPY.ingredientSuggest}
          </h2>
          <ul className="flex flex-wrap gap-1.5">
            {suggested.map((i) => (
              <li key={i.key}>
                <button
                  type="button"
                  onClick={() => {
                    toggleIngredient(i.key);
                    setQ("");
                  }}
                  className="flex min-h-9 items-center gap-1 rounded-full border border-primary px-3 text-sm text-primary"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  {i.name}
                  <span className="text-xs tabular-nums opacity-70">{i.count}品</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {all === null ? (
        <p className="text-muted-foreground">…</p>
      ) : idle ? (
        <section aria-labelledby="kinds-title" className="-mt-1 flex flex-col gap-2">
          <h2 id="kinds-title" className="flex items-baseline justify-between text-base font-bold">
            {UI_COPY.kindsTitle}
            <span className="text-xs font-normal text-muted-foreground">{products.length}品</span>
          </h2>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {KIND_ORDER.filter((k) => products.some((v) => v.product.kind === k)).map((k) => (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => setKind(k)}
                  className="flex h-full w-full flex-col items-center gap-1 rounded-xl border border-border bg-card px-1 py-3 text-center active:bg-accent"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- 小さな静的 SVG */}
                  <img
                    src={illustrationSrc(k, "form")}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11"
                  />
                  <span className="text-sm leading-tight font-bold">{KIND_LABEL[k]}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {products.filter((v) => v.product.kind === k).length}品
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-lg bg-muted p-3 text-sm">
          <p>{UI_COPY.noMatch}</p>
          {chips.length > 0 && (
            <button type="button" onClick={clearAll} className="text-primary underline">
              {UI_COPY.clearFilters}
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="-mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold tabular-nums">{shown.length}品</span>
            <span className="ml-auto text-[11px] text-muted-foreground">{UI_COPY.sortedShort}</span>
          </p>
          {groups.map((g) => (
            <section
              key={g.kind}
              aria-labelledby={`kind-${g.kind}`}
              className="-mt-2 flex flex-col gap-1.5"
            >
              {/* 種類を選んでいるときは見出しを省く（ボタンとチップに出ている） */}
              {!kind && (
                <h2 id={`kind-${g.kind}`} className="text-xs font-bold text-muted-foreground">
                  {KIND_LABEL[g.kind]}　{g.views.length}品
                </h2>
              )}
              <ProductList
                views={g.views}
                ids={ids}
                onPick={pick}
                note={note}
                trailing={(v) => <AddButton view={v} ids={ids} onAdd={add} />}
              />
            </section>
          ))}
        </>
      )}

      <FilterSheet
        panel={panel}
        onClose={() => setPanel(null)}
        count={shown.length}
        products={products}
        filters={filters}
        index={index}
        onKind={setKind}
        onIngredient={toggleIngredient}
        onExclude={toggleExclude}
      />
    </div>
  );
}

// 逆引きで対応づけた承認基準の語と出典。語は承認基準の原文で、Claude が書いた文ではない
function ReversePanel({ result, onClear }: { result: ReverseResult; onClear: () => void }) {
  const standards = [...new Set(result.terms.map((t) => t.standardId))].flatMap(
    (id) => standardOf(id) ?? [],
  );
  return (
    <section
      aria-labelledby="reverse-title"
      className="-mt-2 flex flex-col gap-2 rounded-xl bg-muted p-3 text-sm"
    >
      <div className="flex items-start gap-2">
        <h2 id="reverse-title" className="font-bold">
          {UI_COPY.reverseTitle}
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="ml-auto shrink-0 text-xs text-primary underline underline-offset-2"
        >
          {UI_COPY.reverseClear}
        </button>
      </div>
      {result.terms.length === 0 ? (
        <p>{UI_COPY.reverseNone}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-1.5">
            {standards.map((s) => (
              <li key={s.id} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{s.name}の承認基準</span>
                <span className="flex flex-wrap gap-1.5">
                  {result.terms
                    .filter((t) => t.standardId === s.id)
                    .map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full bg-background px-2.5 py-1 text-xs font-bold"
                      >
                        {t.word}
                      </span>
                    ))}
                </span>
                <a
                  href={s.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] break-all text-primary underline underline-offset-2"
                >
                  {s.notice}（取得 {s.fetchedOn}）
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{UI_COPY.reverseNote}</p>
        </>
      )}
      {result.via === "keyword" && (
        <p className="text-[11px] text-muted-foreground">{UI_COPY.reverseKeyword}</p>
      )}
      <p className="text-xs font-bold">{UI_COPY.chooseNotice}</p>
    </section>
  );
}

// 開かずに「商品」に追加する（比べる対象になる）
function AddButton({
  view,
  ids,
  onAdd,
}: {
  view: ProductView;
  ids: string[];
  onAdd: (id: string) => void;
}) {
  const { id, name } = view.product;
  const added = ids.includes(id);
  return (
    <button
      type="button"
      disabled={added || ids.length >= 4}
      onClick={() => onAdd(id)}
      aria-label={added ? `${name} は商品に追加済み` : `${name} を商品に追加`}
      className="mr-2 flex size-11 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-primary text-[10px] leading-none font-bold text-primary disabled:border-border disabled:text-muted-foreground"
    >
      {added ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Plus className="size-4" aria-hidden="true" />
      )}
      追加
    </button>
  );
}

function FilterSheet({
  panel,
  onClose,
  count,
  products,
  filters,
  index,
  onKind,
  onIngredient,
  onExclude,
}: {
  panel: Panel | null;
  onClose: () => void;
  count: number;
  products: ProductView[];
  filters: Filters;
  index: Map<string, Ingredient>;
  onKind: (kind: MedicineKind | null) => void;
  onIngredient: (key: string) => void;
  onExclude: (kind: BadgeKind) => void;
}) {
  const title = {
    kind: "種類で絞る",
    ingredients: "成分で絞る",
    exclude: "含まない成分で絞る",
  } as const;
  // 開いたときに成分名の欄へ入らないようにする（スマホでキーボードが一覧を隠すため）
  const done = useRef<HTMLButtonElement>(null);
  return (
    <Sheet open={panel !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        initialFocus={done}
        className="flex max-h-[85dvh] flex-col gap-0 rounded-t-2xl"
      >
        {panel && (
          <>
            <SheetHeader className="pb-2">
              <SheetTitle>{title[panel]}</SheetTitle>
              <SheetDescription>
                {panel === "ingredients"
                  ? UI_COPY.ingredientFilterNote
                  : panel === "exclude"
                    ? UI_COPY.excludeFilterNote
                    : UI_COPY.sortedShort}
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
              {panel === "kind" && (
                <KindPanel
                  // 種類以外の条件を当てたときの品数
                  views={apply(products, filters, "kind")}
                  current={filters.kind}
                  onKind={onKind}
                />
              )}
              {panel === "ingredients" && (
                <IngredientPanel
                  views={apply(products, filters, "term")}
                  selected={filters.ingredients}
                  index={index}
                  onIngredient={onIngredient}
                />
              )}
              {panel === "exclude" && (
                <ul className="flex flex-col gap-2">
                  {CONDITIONS.map((c) => {
                    const on = filters.exclude.includes(c.kind);
                    return (
                      <li key={c.kind}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => onExclude(c.kind)}
                          className={cn(
                            "flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 text-left",
                            on ? "border-primary bg-accent" : "border-border",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded border-2",
                              on
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border",
                            )}
                          >
                            {on && <Check className="size-3.5" aria-hidden="true" />}
                          </span>
                          <span className="text-[15px] font-bold">{c.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <SheetFooter className="border-t border-border pt-3">
              <button
                ref={done}
                type="button"
                onClick={onClose}
                className="min-h-12 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground"
              >
                {count}品を表示
              </button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function KindPanel({
  views,
  current,
  onKind,
}: {
  views: ProductView[];
  current: MedicineKind | null;
  onKind: (kind: MedicineKind | null) => void;
}) {
  const counts = new Map<MedicineKind, number>();
  for (const v of views) counts.set(v.product.kind, (counts.get(v.product.kind) ?? 0) + 1);
  const tiles = [
    { key: null, label: UI_COPY.showAll, n: views.length },
    ...KIND_ORDER.filter((k) => counts.has(k) || k === current).map((k) => ({
      key: k,
      label: KIND_LABEL[k],
      n: counts.get(k) ?? 0,
    })),
  ];
  return (
    <ul className="grid grid-cols-3 gap-2">
      {tiles.map((t) => {
        const on = current === t.key;
        return (
          <li key={t.key ?? "all"}>
            <button
              type="button"
              onClick={() => onKind(t.key)}
              aria-pressed={on}
              className={cn(
                "flex h-full w-full flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-center",
                on ? "border-2 border-primary bg-accent" : "border-border",
              )}
            >
              {t.key ? (
                // eslint-disable-next-line @next/next/no-img-element -- 小さな静的 SVG
                <img
                  src={illustrationSrc(t.key, "form")}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9"
                />
              ) : (
                <span className="flex size-9 items-center justify-center text-lg font-bold">
                  全
                </span>
              )}
              <span className="text-sm leading-tight font-bold">{t.label}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">{t.n}品</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// 成分を手引きの分類ごとに並べる。上の欄で成分名を絞れる（入力は保存しない）
function IngredientPanel({
  views,
  selected,
  index,
  onIngredient,
}: {
  views: ProductView[];
  selected: string[];
  index: Map<string, Ingredient>;
  onIngredient: (key: string) => void;
}) {
  const [find, setFind] = useState("");
  const term = normalizeName(find);
  // いまの条件で残る商品に含まれる成分だけを出す（選んだ成分は0品でも出して外せるように）
  const counts = ingredientIndex(views);
  const list = [...index.values()]
    .filter((i) => counts.has(i.key) || selected.includes(i.key))
    .filter((i) => !term || normalizeName(i.name).includes(term))
    .map((i) => ({ ...i, count: counts.get(i.key)?.count ?? 0 }));
  const groupNames = [...new Set(list.map((i) => i.group))].sort((a, b) =>
    a === null ? 1 : b === null ? -1 : a.localeCompare(b, "ja"),
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-4 bg-background px-4 pb-1">
        <label htmlFor="ingredient-q" className="sr-only">
          成分名で探す
        </label>
        <Input
          id="ingredient-q"
          value={find}
          onChange={(e) => setFind(e.target.value)}
          placeholder="成分名で探す（例：イブプロフェン）"
          autoComplete="off"
          className="h-10 rounded-lg text-base"
        />
      </div>
      {list.length === 0 && <p className="text-sm text-muted-foreground">{UI_COPY.noMatch}</p>}
      {groupNames.map((g) => (
        <section key={g ?? "none"} className="flex flex-col gap-1.5">
          <h3 className="text-xs font-bold text-muted-foreground">
            {g ?? UI_COPY.ingredientNoGroup}
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {list
              .filter((i) => i.group === g)
              .sort((a, b) => a.name.localeCompare(b.name, "ja"))
              .map((i) => {
                const on = selected.includes(i.key);
                return (
                  <li key={i.key}>
                    <button
                      type="button"
                      onClick={() => onIngredient(i.key)}
                      aria-pressed={on}
                      className={cn(
                        "flex min-h-9 items-center gap-1 rounded-full border px-3 text-sm",
                        on
                          ? "border-primary bg-primary font-bold text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {on && <Check className="size-3.5" aria-hidden="true" />}
                      {i.name}
                      <span className="text-xs tabular-nums opacity-70">{i.count}</span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
