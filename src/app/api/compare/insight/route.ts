import type { NextRequest } from "next/server";
import { findById, productViews } from "@/lib/catalog";
import { compareBadges, compareRows } from "@/lib/compare";
import { generateCompareInsight, type CompareInsight } from "@/lib/veteran/compareInsight";

// インサイトのインメモリキャッシュ（key: sorted ids）
const insightCache = new Map<string, { insight: CompareInsight | null; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1時間

export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const products = (await Promise.all(ids.slice(0, 4).map(findById))).filter((p) => p !== null);
  if (products.length < 2) {
    return Response.json({ error: "need_two_or_more" }, { status: 400 });
  }

  const cacheKey = [...ids].sort().join(",");
  const cached = insightCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return Response.json({ insight: cached.insight });
  }

  const views = await productViews(products);
  const rows = compareRows(products);
  const badges = compareBadges(views.map((v) => v.badges));

  const insight = await generateCompareInsight(views, rows, badges);

  insightCache.set(cacheKey, { insight, timestamp: Date.now() });

  return Response.json({ insight });
}
