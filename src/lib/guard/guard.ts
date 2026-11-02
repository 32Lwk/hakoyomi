import { findBanwords } from "@/lib/guard/banwords";

// Claude が生成・選択した文は必ずここを通す（rules §4-2）。Claude の自己検査は T303 で足す
export type GuardResult = { ok: true; text: string } | { ok: false; hits: string[] };

export function guard(text: string): GuardResult {
  const hits = findBanwords(text);
  return hits.length ? { ok: false, hits } : { ok: true, text };
}

// 複数の文を通し、差し止めた文は除く。差し止めた件数は呼び出し側でログに残す（出力側のみ）
export function guardAll(texts: string[]): { passed: string[]; blocked: { hits: string[] }[] } {
  const passed: string[] = [];
  const blocked: { hits: string[] }[] = [];
  for (const text of texts) {
    const result = guard(text);
    if (result.ok) passed.push(result.text);
    else blocked.push({ hits: result.hits });
  }
  return { passed, blocked };
}
