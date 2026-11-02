"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { ProductImage } from "@/components/product-image";
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

// 一覧の1行。写真は小さく、品名を主に（1画面に多く見えるように）
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
  const { product } = view;
  return (
    <button
      type="button"
      onClick={() => onPick(product.id)}
      className="flex min-w-0 flex-1 items-center gap-3 px-2.5 py-2 text-left active:bg-accent"
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
        {note && (
          <span className="truncate text-xs font-bold text-accent-foreground tabular-nums">
            {note}
          </span>
        )}
      </span>
      {read && (
        <span className="shrink-0 rounded bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">
          {UI_COPY.readMark}
        </span>
      )}
      {chevron && (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
    </button>
  );
}
