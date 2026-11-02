"use client";

import { ScanBarcode, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { useStack } from "@/components/stack-provider";
import { Button } from "@/components/ui/button";
import { useProductViews } from "@/components/use-product-views";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { cn } from "@/lib/utils";

type Summary = { id: string; name: string; maker: string };

export function ReadView() {
  const { ids, currentId, select, remove, add, setScannerOpen } = useStack();
  const { views } = useProductViews(ids);
  const current = views.find((v) => v.product.id === currentId) ?? null;

  if (!currentId) return <EmptyRead onScan={() => setScannerOpen(true)} onPick={add} />;

  return (
    <div className="flex flex-col gap-5">
      {views.length > 1 && (
        <div className="flex flex-col gap-2">
          <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="読んだ商品">
            {views.map((v) => (
              <li key={v.product.id} className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => select(v.product.id)}
                  aria-pressed={v.product.id === currentId}
                  className={cn(
                    "min-h-10 rounded-l-md border px-3 text-sm",
                    v.product.id === currentId
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {v.product.name}
                </button>
                <button
                  type="button"
                  onClick={() => remove(v.product.id)}
                  aria-label={`${v.product.name} を外す`}
                  className="flex min-h-10 items-center rounded-r-md border border-l-0 border-border px-2"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <Link
            href="/compare"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-primary text-sm font-bold text-primary"
          >
            {views.length}品を比べる
          </Link>
        </div>
      )}
      {current ? <ProductCard view={current} /> : <p className="text-muted-foreground">…</p>}
    </div>
  );
}

function EmptyRead({ onScan, onPick }: { onScan: () => void; onPick: (id: string) => void }) {
  const [demo, setDemo] = useState<Summary[]>([]);
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json() as Promise<{ results: Summary[] }>)
      .then((data) => setDemo(data.results))
      .catch(() => setDemo([]));
  }, []);

  return (
    <div className="flex flex-col gap-6 pt-6">
      <p className="text-center text-base">{UI_COPY.emptyRead}</p>
      <Button onClick={onScan} className="mx-auto h-14 gap-2 px-8 text-base">
        <ScanBarcode className="size-5" aria-hidden="true" />
        JANを読む
      </Button>
      {demo.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold text-muted-foreground">デモ用の商品（架空）</h2>
          <ul className="grid grid-cols-2 gap-2">
            {demo.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onPick(d.id)}
                  className="min-h-12 w-full rounded-lg border border-border px-3 py-2 text-left text-sm"
                >
                  {d.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
