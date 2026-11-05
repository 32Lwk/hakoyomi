"use client";

import { ChevronRight, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ProductImage } from "@/components/product-image";
import { useStack } from "@/components/stack-provider";
import type { ProductView } from "@/lib/catalog";
import { UI_COPY } from "@/lib/guard/uiCopy";

// ホームとさがすで使う商品一覧（L-20261103-23・30）
export function ProductList({
  views,
  ids,
  onPick,
  note,
  trailing,
}: {
  views: ProductView[];
  ids: string[];
  onPick: (id: string) => void;
  // 行の下に添える1行（さがすで、絞った成分の分量を出す）
  note?: (view: ProductView) => string | null;
  // 行の右の操作（さがすの「比べるに追加」）
  trailing?: (view: ProductView) => ReactNode;
}) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {views.map((v) => (
        <li key={v.product.id} className="flex items-center">
          <ProductRow
            view={v}
            read={ids.includes(v.product.id)}
            onPick={onPick}
            note={note?.(v) ?? null}
            chevron={!trailing}
          />
          {trailing?.(v)}
        </li>
      ))}
    </ul>
  );
}

// 一覧の1行。写真を大きく見やすく、品名と棚番号を直感的に識別できるように改善
function ProductRow({
  view,
  read,
  onPick,
  note,
  chevron,
}: {
  view: ProductView;
  read: boolean;
  onPick: (id: string) => void;
  note: string | null;
  chevron: boolean;
}) {
  const { product, location, abuse } = view;
  const router = useRouter();
  const { add } = useStack();

  const handleShelfClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    add(product.id);
    router.push("/shelf");
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3 active:bg-accent/40">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onPick(product.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPick(product.id);
          }
        }}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3.5 text-left"
      >
        <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-white p-1 ring-1 ring-border shadow-xs">
          <ProductImage
            id={product.id}
            kind={product.kind}
            name={product.name}
            size={60}
            decorative
            className="size-14 object-contain"
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[17px] font-bold text-foreground leading-snug">{product.name}</span>
          <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <span>
              {product.maker.replace(/株式会社/g, "").trim()}・{product.riskClass}
            </span>
            {abuse.target && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">
                指定濫用
              </span>
            )}
          </span>
          {note && (
            <span className="truncate text-xs font-bold text-accent-foreground tabular-nums">
              {note}
            </span>
          )}
        </span>
      </div>
      {location && (
        <button
          type="button"
          onClick={handleShelfClick}
          title={`棚 ${location.shelf.id} を開く`}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-accent active:bg-accent/80 shadow-xs"
        >
          <MapPin className="size-3.5 text-primary" aria-hidden="true" />
          <span>棚 {location.shelf.id}</span>
        </button>
      )}
      {read && (
        <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-xs font-bold text-accent-foreground">
          {UI_COPY.readMark}
        </span>
      )}
      {chevron && (
        <ChevronRight
          onClick={() => onPick(product.id)}
          className="size-5 shrink-0 cursor-pointer text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
