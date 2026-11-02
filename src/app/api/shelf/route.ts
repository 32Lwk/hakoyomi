import type { NextRequest } from "next/server";
import { findById, locationOf } from "@/lib/catalog";
import { MOCK_STORE } from "@/data/mock_store";

// 棚の位置（Claude 不使用）。店舗・棚は模擬データ
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const items = ids.flatMap((id) => {
    const product = findById(id);
    const location = locationOf(id);
    return product && location ? [{ id, name: product.name, kind: product.kind, location }] : [];
  });
  // 棚の正面図に、同じ棚に並ぶほかの商品も描く
  const shelfIds = new Set(items.map((i) => i.location.shelfId));
  const occupants = MOCK_STORE.locations
    .filter((l) => shelfIds.has(l.shelfId))
    .flatMap((l) => {
      const product = findById(l.productId);
      return product ? [{ ...l, name: product.name, kind: product.kind }] : [];
    });
  return Response.json({ store: MOCK_STORE, items, occupants });
}
