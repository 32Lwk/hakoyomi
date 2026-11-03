import type { NextRequest } from "next/server";
import { MemoInput } from "@/lib/memos/memo";
import { createMemo, memosConfigured, memosForProducts } from "@/lib/memos/store";

// 店内の説明メモ（T403）。公的な出典ではないので、質問の回答・根拠には使わない。
// GET ?productIds=a,b → 商品ごとのメモ（商品に付いたもの＋成分に付いたもの、新しい順）
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("productIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 10);
  if (!ids.length) return Response.json({ error: "no_product_ids" }, { status: 400 });
  try {
    return Response.json({ configured: memosConfigured(), products: await memosForProducts(ids) });
  } catch (error) {
    console.error("memo: 読み出しに失敗", error instanceof Error ? error.message : "unknown");
    return Response.json({
      configured: true,
      products: ids.map((productId) => ({ productId, memos: [] })),
      error: "read_failed",
    });
  }
}

// POST { body, authorAlias, productId, ingredient? } → 保存の前に guard（禁止語＋Claude 自己検査）
export async function POST(request: NextRequest) {
  const parsed = MemoInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_input" }, { status: 400 });
  const result = await createMemo(parsed.data);
  if (result.ok) return Response.json({ memo: result.memo }, { status: 201 });
  switch (result.error) {
    case "blocked":
      return Response.json(
        { error: "blocked", reasons: result.reasons, messages: result.messages },
        { status: 422 },
      );
    case "not_configured":
      return Response.json(
        {
          error: "not_configured",
          messages: ["メモの保存先（データベース）が設定されていないため保存できません"],
        },
        { status: 503 },
      );
    case "unknown_target":
      return Response.json({ error: "unknown_target" }, { status: 404 });
  }
}
