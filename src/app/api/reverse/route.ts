import type { NextRequest } from "next/server";
import { guardAll } from "@/lib/guard/guard";
import { selectWithClaude } from "@/lib/reverse/claude";
import { keywordSelection, resolve } from "@/lib/reverse/match";

// 逆引き（T302）：自由入力 → 承認基準の効能・効果の語と含まない条件。絞り込みは画面側のコードで行う。
// 入力は保存しない・ログに残さない（rules §4-7）
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { q?: unknown } | null;
  const q = typeof body?.q === "string" ? body.q.trim().slice(0, 100) : "";
  if (!q) return Response.json({ terms: [], exclude: [], via: "keyword" });

  const selection = await selectWithClaude(q);
  const result = selection ? resolve(selection, "claude") : resolve(keywordSelection(q), "keyword");

  // Claude が選んだ語のラベルも guard を通す（rules §4-2）。語は承認基準の原文だが、素通しの経路を作らない
  const { passed, blocked } = guardAll(result.terms.map((t) => t.word));
  if (blocked.length) console.warn(`reverse: guard で ${blocked.length} 件を差し止め`);
  return Response.json({ ...result, terms: result.terms.filter((t) => passed.includes(t.word)) });
}
