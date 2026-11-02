"use client";

import { useEffect, useState } from "react";
import type { ProductView } from "@/lib/catalog";

// 積み上げた商品の表示データを読む。並びは ids のまま
export function useProductViews(ids: string[]): { views: ProductView[]; loading: boolean } {
  const key = ids.join(",");
  const [state, setState] = useState<{ key: string; views: ProductView[] }>({ key: "", views: [] });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/products?ids=${encodeURIComponent(key)}`)
      .then((res) => res.json() as Promise<{ views: ProductView[] }>)
      .then((data) => {
        if (!cancelled) setState({ key, views: data.views });
      })
      .catch(() => {
        if (!cancelled) setState({ key, views: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (!key) return { views: [], loading: false };
  return { views: state.key === key ? state.views : [], loading: state.key !== key };
}
