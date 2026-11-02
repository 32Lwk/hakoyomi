"use client";

import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
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
  const { ids, add } = useStack();
  const router = useRouter();
  const [all, setAll] = useState<ProductView[] | null>(null);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<MedicineKind | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [exclude, setExclude] = useState<BadgeKind[]>([]);
  const [panel, setPanel] = useState<Panel | null>(null);

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
  const filters: Filters = { term: normalizeName(q), kind, ingredients, exclude };
  const shown = apply(products, filters);
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

  // 結果の行に、絞った成分（または入力に当たった成分）の分量を添える
  const note = (v: ProductView) => {
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

  const pick = (id: string) => {
    add(id);
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-12 z-20 -mx-4 -mt-4 flex flex-col gap-2 bg-background/95 px-4 pt-3 pb-2 backdrop-blur">
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
            onChange={(e) => setQ(e.target.value)}
            placeholder={UI_COPY.searchPlaceholder}
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

      {suggested.length > 0 && (
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

// 開かずに比べるに追加する
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
      aria-label={added ? `${name} は比べるに追加済み` : `${name} を${UI_COPY.addToCompare}`}
      className="mr-2 flex size-11 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-primary text-[10px] leading-none font-bold text-primary disabled:border-border disabled:text-muted-foreground"
    >
      {added ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Plus className="size-4" aria-hidden="true" />
      )}
      比べる
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
