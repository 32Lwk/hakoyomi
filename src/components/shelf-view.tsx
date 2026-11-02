"use client";

import { useEffect, useState } from "react";
import { useStack } from "@/components/stack-provider";
import { Button } from "@/components/ui/button";
import type { LocatedShelf } from "@/lib/catalog";
import type { Shelf, StoreArea } from "@/data/mock_store";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { cn } from "@/lib/utils";

type ShelfData = {
  store: { name: string; areas: StoreArea[]; shelves: Shelf[] };
  items: { id: string; name: string; location: LocatedShelf }[];
};

export function ShelfView() {
  const { ids, setScannerOpen } = useStack();
  const key = ids.join(",");
  const [data, setData] = useState<{ key: string; data: ShelfData } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/shelf?ids=${encodeURIComponent(key)}`)
      .then((res) => res.json() as Promise<ShelfData>)
      .then((d) => {
        if (!cancelled) setData({ key, data: d });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (!data || data.key !== key) return <p className="pt-6 text-muted-foreground">…</p>;
  const { store, items } = data.data;

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-4 pt-10 text-center">
        <p>{UI_COPY.emptyRead}</p>
        <Button onClick={() => setScannerOpen(true)} className="h-12 px-6">
          JANを読む
        </Button>
      </div>
    );
  }

  // 番号は読んだ順。マップと棚の図で同じ番号を使う
  const numbered = items.map((item, i) => ({ ...item, no: i + 1 }));
  const activeAreas = new Set(numbered.map((i) => i.location.shelf.areaId));
  const shelves = store.shelves.filter((s) => numbered.some((i) => i.location.shelfId === s.id));

  return (
    <div className="flex flex-col gap-5">
      <ol className="flex flex-col gap-2">
        {numbered.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <Marker no={item.no} />
            <span className="flex-1">
              <span className="font-bold">{item.name}</span>
              <span className="block text-sm text-muted-foreground">
                {item.location.areaLabel}・{item.location.shelf.label}・上から{item.location.tier}
                段目・左から
                {item.location.column}列目
              </span>
            </span>
          </li>
        ))}
      </ol>

      <section aria-label="店内マップ" className="flex flex-col gap-2">
        <h2 className="text-base font-bold">店内マップ</h2>
        <div className="relative aspect-[4/3] w-full rounded-lg border border-border bg-muted">
          {store.areas.map((a) => {
            const active = activeAreas.has(a.id);
            return (
              <div
                key={a.id}
                className={cn(
                  "absolute flex items-center justify-center rounded-md border p-1 text-center text-xs leading-tight",
                  a.fixture &&
                    "border-dashed border-muted-foreground bg-background text-muted-foreground",
                  !a.fixture && !active && "border-border bg-background",
                  active && "border-primary bg-primary font-bold text-primary-foreground",
                )}
                style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%`, height: `${a.h}%` }}
              >
                {a.label}
              </div>
            );
          })}
        </div>
      </section>

      {shelves.map((shelf) => (
        <section
          key={shelf.id}
          aria-label={`${shelf.label} の正面`}
          className="flex flex-col gap-2"
        >
          <h2 className="text-base font-bold">{shelf.label}（正面）</h2>
          <div
            className="grid gap-1 rounded-lg border border-border bg-muted p-2"
            style={{ gridTemplateColumns: `repeat(${shelf.columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: shelf.tiers * shelf.columns }, (_, i) => {
              const tier = Math.floor(i / shelf.columns) + 1;
              const column = (i % shelf.columns) + 1;
              const here = numbered.find(
                (n) =>
                  n.location.shelfId === shelf.id &&
                  n.location.tier === tier &&
                  n.location.column === column,
              );
              return (
                <div
                  key={i}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-sm",
                    here ? "bg-diff" : "bg-background",
                  )}
                  aria-label={
                    here ? `${here.name}：上から${tier}段目・左から${column}列目` : undefined
                  }
                >
                  {here && <Marker no={here.no} />}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">上が最上段。{UI_COPY.mockNotice}</p>
        </section>
      ))}
    </div>
  );
}

function Marker({ no }: { no: number }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
      {no}
    </span>
  );
}
