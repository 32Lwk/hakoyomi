import type { NextRequest } from "next/server";
import { findById, productViews } from "@/lib/catalog";
import { generateDialogueChecklist, type DialogueChecklist } from "@/lib/veteran/checklist";

// 商品IDごとのチェックリストキャッシュ
const checklistCache = new Map<
  string,
  { checklist: DialogueChecklist | null; timestamp: number }
>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1時間

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: "missing_product_id" }, { status: 400 });
  }

  const cached = checklistCache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return Response.json({ checklist: cached.checklist });
  }

  const product = await findById(id);
  if (!product) {
    return Response.json({ error: "product_not_found" }, { status: 404 });
  }

  const [view] = await productViews([product]);
  if (!view) {
    return Response.json({ error: "view_not_found" }, { status: 404 });
  }

  const checklist = await generateDialogueChecklist(view);
  checklistCache.set(id, { checklist, timestamp: Date.now() });

  return Response.json({ checklist });
}
