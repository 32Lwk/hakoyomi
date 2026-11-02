import type { NextRequest } from "next/server";
import { findByJan, productView } from "@/lib/catalog";
import { cleanJan, isValidJan } from "@/lib/jan";

// JAN → 商品の事実とバッジ。Claude を使わず、コードだけで返す（architecture §1）
export async function GET(request: NextRequest) {
  const code = cleanJan(request.nextUrl.searchParams.get("code") ?? "");
  if (!isValidJan(code)) {
    return Response.json({ error: "invalid_jan" }, { status: 400 });
  }
  const product = findByJan(code);
  if (!product) {
    return Response.json({ error: "unknown_jan", jan: code }, { status: 404 });
  }
  return Response.json(productView(product));
}
