import type { NextRequest } from "next/server";
import { findById, locationOf } from "@/lib/catalog";
import { MOCK_STORE } from "@/data/mock_store";

// 棚の位置（Claude 不使用）。店舗・棚は模擬データ
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const items = ids.flatMap((id) => {
    const product = findById(id);
    const location = locationOf(id);
    return product && location ? [{ id, name: product.name, location }] : [];
  });
  return Response.json({
    store: { name: MOCK_STORE.name, areas: MOCK_STORE.areas, shelves: MOCK_STORE.shelves },
    items,
  });
}
