import type { NextRequest } from "next/server";
import { allProducts, findById, productViews, searchByName } from "@/lib/catalog";

// ?ids=a,b → 商品の表示データ（読んだ順のまま） / ?q=… → 品名検索（品名順） / どちらもなし → 全件
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const ids = params.get("ids");
  if (ids) {
    const products = await Promise.all(ids.split(",").map(findById));
    const views = await productViews(products.filter((p) => p !== null));
    return Response.json({ views });
  }
  const q = params.get("q") ?? "";
  const products = await (q ? searchByName(q) : allProducts());
  return Response.json({
    results: products.map(({ id, name, maker, jan, riskClass, kind }) => ({
      id,
      name,
      maker,
      jan,
      riskClass,
      kind,
    })),
  });
}
