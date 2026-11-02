"use client";

import { Check, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgeChip } from "@/components/badges";
import { ProductImage } from "@/components/product-image";
import { useStack } from "@/components/stack-provider";
import { Input } from "@/components/ui/input";
import type { ProductView } from "@/lib/catalog";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { KIND_LABEL } from "@/lib/illustration";
import type { BadgeKind } from "@/lib/schema/notice";
import type { MedicineKind } from "@/lib/schema/product";
import { cn } from "@/lib/utils";

// 「含まない」の条件。該当するバッジを持たない商品だけを残す
const CONDITIONS: { kind: BadgeKind; label: string }[] = [
  { kind: "drive", label: "運転注意の成分を含まない" },
  { kind: "caffeine", label: "カフェインを含まない" },
  { kind: "abuse", label: "指定濫用防止の対象外" },
  { kind: "doping", label: "禁止表の成分を含まない" },
];

// 種類の並びは KIND_LABEL の定義順で固定（棚の並びに近い順。順位ではない）
const KIND_ORDER = Object.keys(KIND_LABEL) as MedicineKind[];

export function SearchView() {
  const { ids, add } = useStack();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [exclude, setExclude] = useState<BadgeKind[]>([]);
  const [views, setViews] = useState<ProductView[] | null>(null);
  const [kind, setKind] = useState<MedicineKind | "all">("all");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ q, exclude: exclude.join(",") });
    const timer = setTimeout(() => {
      fetch(`/api/search?${params}`)
        .then((res) => res.json() as Promise<{ views: ProductView[] }>)
        .then((d) => {
          if (!cancelled) setViews(d.views);
        })
        .catch(() => undefined);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, exclude]);

  const toggle = (badge: BadgeKind) =>
    setExclude((prev) =>
      prev.includes(badge) ? prev.filter((k) => k !== badge) : [...prev, badge],
    );

  // 種類ごとにまとめる。種類の中は API の並び（品名順）のまま
  const counts = new Map<MedicineKind, number>();
  for (const v of views ?? []) counts.set(v.product.kind, (counts.get(v.product.kind) ?? 0) + 1);
  const kinds = KIND_ORDER.filter((k) => counts.has(k));
  // 条件で選んだ種類の品がなくなったら「すべて」に戻して見せる
  const current = kind !== "all" && kinds.includes(kind) ? kind : "all";
  const shown = current === "all" ? kinds : [current];
  const groups = shown.map((k) => ({
    kind: k,
    views: (views ?? []).filter((v) => v.product.kind === k),
  }));
  const shownCount = groups.reduce((n, g) => n + g.views.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor="search-q" className="sr-only">
        品名で探す
      </label>
      <Input
        id="search-q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="品名・メーカー"
        className="h-12 rounded-xl text-base"
        autoComplete="off"
      />
      {/* fieldset は既定で min-width: min-content なので、横スクロールの行が画面を広げないよう min-w-0 */}
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-1.5 text-xs font-bold text-muted-foreground">種類</legend>
        <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1">
          {[
            { key: "all" as const, label: "すべて", n: views?.length ?? 0 },
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
                    : "border-border",
                )}
              >
                {t.label}
                <span className="ml-1 tabular-nums opacity-80">{t.n}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-xs font-bold text-muted-foreground">成分の条件で絞る</legend>
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((c) => {
            const on = exclude.includes(c.kind);
            return (
              <button
                type="button"
                key={c.kind}
                onClick={() => toggle(c.kind)}
                aria-pressed={on}
                className={cn(
                  "min-h-9 rounded-full border px-3 text-[13px]",
                  on
                    ? "border-primary bg-primary font-bold text-primary-foreground"
                    : "border-border",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs text-muted-foreground">
        <span className="text-sm font-bold text-foreground">
          {views ? `${shownCount}品` : "…"}　{UI_COPY.chooseNotice}
        </span>
        {UI_COPY.sortedByName}
      </p>

      {views &&
        groups.map((g) => (
          <section key={g.kind} aria-labelledby={`kind-${g.kind}`} className="flex flex-col gap-2">
            <h2
              id={`kind-${g.kind}`}
              className="flex items-baseline gap-2 border-b border-border pb-1 text-sm font-bold"
            >
              {KIND_LABEL[g.kind]}
              <span className="text-xs font-normal text-muted-foreground">{g.views.length}品</span>
            </h2>
            <ul className="flex flex-col gap-2">
              {g.views.map((v) => {
                const added = ids.includes(v.product.id);
                return (
                  <li
                    key={v.product.id}
                    className="flex items-start gap-2 rounded-xl border border-border p-2"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        add(v.product.id);
                        router.push("/");
                      }}
                      className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg p-1 text-left active:bg-accent"
                    >
                      <span className="flex items-center gap-3">
                        <ProductImage
                          id={v.product.id}
                          kind={v.product.kind}
                          name={v.product.name}
                          size={56}
                          className="size-14 shrink-0 rounded-md bg-muted p-0.5"
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="font-bold">{v.product.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {v.product.maker}・{v.product.riskClass}
                          </span>
                        </span>
                      </span>
                      {v.badges.length > 0 && (
                        <span className="flex flex-wrap gap-1">
                          {v.badges.map((b) => (
                            <BadgeChip key={b.kind} badge={b} compact />
                          ))}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={added || ids.length >= 4}
                      onClick={() => add(v.product.id)}
                      aria-label={
                        added
                          ? `${v.product.name} は比べるに追加済み`
                          : `${v.product.name} を${UI_COPY.addToCompare}`
                      }
                      className="flex min-h-11 shrink-0 flex-col items-center justify-center gap-0.5 self-center rounded-lg border-2 border-primary px-2 text-[11px] font-bold text-primary disabled:border-border disabled:text-muted-foreground"
                    >
                      {added ? (
                        <Check className="size-4" aria-hidden="true" />
                      ) : (
                        <Plus className="size-4" aria-hidden="true" />
                      )}
                      {added ? "追加済み" : "比べる"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      {views && shownCount === 0 && (
        <p className="rounded-lg bg-muted p-3 text-sm">{UI_COPY.noMatch}</p>
      )}
    </div>
  );
}
