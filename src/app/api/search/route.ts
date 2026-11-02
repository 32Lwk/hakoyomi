import type { NextRequest } from "next/server";
import { allProducts, productViews, searchByName } from "@/lib/catalog";
import { BadgeKind } from "@/lib/schema/notice";

// 成分条件の絞り込み（コードのみ）。結果は品名順で、順位は付けない（rules §4-7）。
// 自由入力の逆引き（Claude による効能・効果の語への対応づけ）は T302 で足す。入力は保存しない
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") ?? "";
  const exclude = (params.get("exclude") ?? "")
    .split(",")
    .map((k) => BadgeKind.safeParse(k))
    .flatMap((r) => (r.success ? [r.data] : []));

  const base = await (q ? searchByName(q) : allProducts());
  const views = (await productViews(base)).filter((v) =>
    exclude.every((kind) => !v.badges.some((b) => b.kind === kind)),
  );
  return Response.json({ views });
}
