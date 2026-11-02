import type { NextRequest } from "next/server";
import { allProducts, findById, productView, searchByName } from "@/lib/catalog";

// ?ids=a,b → 商品の表示データ（読んだ順のまま） / ?q=… → 品名検索（品名順） / どちらもなし → 全件
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const ids = params.get("ids");
  if (ids) {
    const views = ids
      .split(",")
      .map((id) => findById(id))
      .filter((p) => p !== null)
      .map(productView);
    return Response.json({ views });
  }
  const q = params.get("q") ?? "";
  const products = q ? searchByName(q) : allProducts();
  return Response.json({
    results: products.map(({ id, name, maker, jan, riskClass }) => ({
      id,
      name,
      maker,
      jan,
      riskClass,
    })),
  });
}
