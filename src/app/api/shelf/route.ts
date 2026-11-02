import type { NextRequest } from "next/server";
import { findById, locationOf, shelfOccupants } from "@/lib/catalog";
import { MOCK_STORE } from "@/data/mock_store";

// 棚の位置（Claude 不使用）。店舗・棚は模擬データ
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const found = await Promise.all(
    ids.map(async (id) => ({ id, product: await findById(id), location: await locationOf(id) })),
  );
  const items = found.flatMap(({ id, product, location }) =>
    product && location ? [{ id, name: product.name, kind: product.kind, location }] : [],
  );
  // 棚の正面図に並ぶデモ商品。どの棚も売場図から開けるので、全部の棚ぶん返す（数十件）
  const shelfIds = new Set(MOCK_STORE.shelves.map((s) => s.id));
  const occupants = (await shelfOccupants(shelfIds)).map(({ product, ...l }) => ({
    ...l,
    name: product.name,
    kind: product.kind,
  }));
  return Response.json({ store: MOCK_STORE, items, occupants });
}
