"use client";

import { Check, Plus, ScanBarcode } from "lucide-react";
import { useEffect, useState } from "react";
import { useStack } from "@/components/stack-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductView } from "@/lib/catalog";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { illustrationAlt, illustrationSrc, KIND_LABEL } from "@/lib/illustration";

const MAX = 4;

// 比べる商品を足す。候補は品名順で、順位は付けない（rules §4-7）
export function ProductPicker({ onPicked }: { onPicked?: () => void }) {
  const { ids, add, setScannerOpen } = useStack();
  const [q, setQ] = useState("");
  const [views, setViews] = useState<ProductView[] | null>(null);
  const full = ids.length >= MAX;

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch(`/api/search?${new URLSearchParams({ q })}`)
        .then((res) => res.json() as Promise<{ views: ProductView[] }>)
        .then((d) => {
          if (!cancelled) setViews(d.views);
        })
        .catch(() => undefined);
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <label htmlFor="picker-q" className="sr-only">
          品名で探す
        </label>
        <Input
          id="picker-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="品名・メーカーで探す"
          className="h-12 text-base"
          autoComplete="off"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setScannerOpen(true)}
          className="h-12 gap-1 border-2 border-primary px-3 text-primary"
        >
          <ScanBarcode className="size-5" aria-hidden="true" />
          JAN
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {full ? UI_COPY.compareFull : `${UI_COPY.sortedByName}　${ids.length}/${MAX}品`}
      </p>
      <ul className="flex flex-col gap-2">
        {views?.map((v) => {
          const added = ids.includes(v.product.id);
          return (
            <li key={v.product.id}>
              <button
                type="button"
                disabled={added || full}
                onClick={() => {
                  add(v.product.id);
                  onPicked?.();
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-border p-2 text-left disabled:opacity-60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- 小さな静的 SVG */}
                <img
                  src={illustrationSrc(v.product.kind, "box")}
                  alt={illustrationAlt(v.product.kind)}
                  width={56}
                  height={56}
                  className="size-14 shrink-0 rounded-md bg-muted p-0.5"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-bold">{v.product.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {KIND_LABEL[v.product.kind]}・{v.product.riskClass}・{v.product.contentQty}
                    {v.product.contentUnit}
                  </span>
                </span>
                <span
                  className={
                    added
                      ? "flex items-center gap-1 text-xs text-muted-foreground"
                      : "flex min-h-10 items-center gap-1 rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground"
                  }
                >
                  {added ? (
                    <>
                      <Check className="size-4" aria-hidden="true" />
                      追加済み
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" aria-hidden="true" />
                      追加
                    </>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
