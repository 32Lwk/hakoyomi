import type { NextRequest } from "next/server";
import { citeWithClaude } from "@/lib/ask/claude";
import { generalPassages, productPassages } from "@/lib/ask/corpus";
import { keywordSelect, verifyCitations } from "@/lib/ask/select";
import { findById, productViews } from "@/lib/catalog";
import { guardAll } from "@/lib/guard/guard";

// 質問エージェント（T301、L-20261103-43）：根拠を集める（コード）→ Claude が番号と抜き出しを選ぶ →
// 原文に含まれるかを確かめる（verifyCitations）→ guard。回答は抜き出し＋出典だけ。質問文は保存・ログしない
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    q?: unknown;
    ids?: unknown;
  } | null;
  const q = typeof body?.q === "string" ? body.q.trim().slice(0, 200) : "";
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((id): id is string => typeof id === "string").slice(0, 4)
    : [];
  if (!q) return Response.json({ answers: [], via: "keyword" });

  const products = (await Promise.all(ids.map(findById))).filter((p) => p !== null);
  const views = await productViews(products);
  const passages = views.length ? await productPassages(views) : await generalPassages();

  const citations = await citeWithClaude(
    q,
    passages,
    views.length === 0,
    views.map((v) => v.product.name),
  );
  const answers = citations ? verifyCitations(citations, passages) : keywordSelect(q, passages);

  // 抜き出しは原文だが、素通しの経路を作らない（rules §4-2）
  const { passed, blocked } = guardAll(answers.map((a) => a.text));
  if (blocked.length) console.warn(`ask: guard で ${blocked.length} 件を差し止め`);
  return Response.json({
    answers: answers.filter((a) => passed.includes(a.text)),
    via: citations ? "claude" : "keyword",
  });
}
