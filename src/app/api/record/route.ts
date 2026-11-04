import type { NextRequest } from "next/server";
import { RecordInput } from "@/lib/record/record";
import { saveAbuseRecord } from "@/lib/record/store";

// 指定濫用防止医薬品の確認・記録＋販売記録下書き作成（T401、L-20261104-25）。
// POST { productId, quantity, checkedItems, staffAlias, otherProductIds? }
// お客様の氏名・症状などの個人情報は受け取らず、保存もしない。
export async function POST(request: NextRequest) {
  const parsed = RecordInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_input", message: "確認項目を1つ以上選択してください" },
      { status: 400 },
    );
  }
  const result = await saveAbuseRecord(parsed.data);
  if (result.ok) {
    return Response.json(result, { status: 201 });
  }
  const status = result.error === "unknown_product" ? 404 : 422;
  return Response.json({ error: result.error, message: result.message }, { status });
}
