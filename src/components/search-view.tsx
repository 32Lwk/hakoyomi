"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgeChip } from "@/components/badges";
import { useStack } from "@/components/stack-provider";
import { Input } from "@/components/ui/input";
import type { ProductView } from "@/lib/catalog";
import { UI_COPY } from "@/lib/guard/uiCopy";
import type { BadgeKind } from "@/lib/schema/notice";
import { cn } from "@/lib/utils";

// 「含まない」の条件。該当するバッジを持たない商品だけを残す
const CONDITIONS: { kind: BadgeKind; label: string }[] = [
  { kind: "drive", label: "運転注意の成分を含まない" },
  { kind: "caffeine", label: "カフェインを含まない" },
  { kind: "abuse", label: "指定濫用防止の対象外" },
  { kind: "doping", label: "禁止表の成分を含まない" },
];

export function SearchView() {
  const { add } = useStack();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [exclude, setExclude] = useState<BadgeKind[]>([]);
  const [views, setViews] = useState<ProductView[] | null>(null);

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

  const toggle = (kind: BadgeKind) =>
    setExclude((prev) => (prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]));

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor="search-q" className="text-sm font-bold">
        品名で探す
      </label>
      <Input
        id="search-q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="品名・メーカー"
        className="h-12 text-base"
        autoComplete="off"
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">成分の条件</legend>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => {
            const on = exclude.includes(c.kind);
            return (
              <button
                type="button"
                key={c.kind}
                onClick={() => toggle(c.kind)}
                aria-pressed={on}
                className={cn(
                  "min-h-10 rounded-full border-2 px-3 text-sm",
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

      <p className="rounded-md bg-muted p-2 text-sm font-bold">{UI_COPY.chooseNotice}</p>
      <p className="text-xs text-muted-foreground">{UI_COPY.sortedByName}</p>

      {views && (
        <ul className="flex flex-col gap-2">
          {views.map((v) => (
            <li key={v.product.id}>
              <button
                type="button"
                onClick={() => {
                  add(v.product.id);
                  router.push("/");
                }}
                className="flex w-full flex-col gap-2 rounded-lg border border-border p-3 text-left"
              >
                <span className="font-bold">{v.product.name}</span>
                <span className="text-xs text-muted-foreground">
                  {v.product.maker}・{v.product.riskClass}
                </span>
                {v.badges.length > 0 && (
                  <span className="flex flex-wrap gap-1">
                    {v.badges.map((b) => (
                      <BadgeChip key={b.kind} badge={b} />
                    ))}
                  </span>
                )}
              </button>
            </li>
          ))}
          {views.length === 0 && <li className="text-sm text-muted-foreground">該当なし</li>}
        </ul>
      )}
    </div>
  );
}
