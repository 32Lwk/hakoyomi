import type { NextRequest } from "next/server";
import { findById, productView } from "@/lib/catalog";
import { compareBadges, compareRows } from "@/lib/compare";

// 2〜4品の比較。並びは読んだ順のまま（量の順に並べ替えない）
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const products = ids
    .slice(0, 4)
    .map((id) => findById(id))
    .filter((p) => p !== null);
  if (products.length < 2) {
    return Response.json({ error: "need_two_or_more" }, { status: 400 });
  }
  const views = products.map(productView);
  return Response.json({
    views,
    rows: compareRows(products),
    badges: compareBadges(views.map((v) => v.badges)),
  });
}
