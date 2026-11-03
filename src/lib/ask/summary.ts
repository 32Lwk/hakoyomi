import type { Passage } from "@/lib/ask/corpus";
import type { Answer } from "@/lib/ask/select";

// 回答に添える説明文の検査（L-20261103-44、rules §4-3）。純粋関数のみ。
// 説明文は従で、抜き出しが主。ここを通らない文は捨てる（直さない）

export type SummaryDraft = { text: string; ids: string[] };
// refs は画面の抜き出しの番号（1始まり）
export type SummarySentence = { text: string; refs: number[] };

const MAX_SENTENCES = 5;
const MAX_LENGTH = 160;

function numbers(text: string): string[] {
  return text.normalize("NFKC").match(/\d+(?:\.\d+)?/g) ?? [];
}

// ①番号が1つ以上あり、すべて検証済みの抜き出しを指す ②文中の数値は、指した根拠の原文・記載条件・出典名に出てくるものだけ ③長すぎない
export function checkSummary(
  drafts: SummaryDraft[],
  answers: Answer[],
  passages: Passage[],
): SummarySentence[] {
  const out: SummarySentence[] = [];
  for (const d of drafts) {
    const text = d.text.trim();
    if (!text || text.length > MAX_LENGTH) continue;
    const ids = [...new Set(d.ids)];
    const refs = ids.map((id) => answers.findIndex((a) => a.id === id) + 1);
    if (!refs.length || refs.includes(0)) continue;
    const cited = ids
      .map((id) => {
        const p = passages.find((x) => x.id === id);
        return p ? `${p.text} ${p.condition ?? ""} ${p.source.label}` : "";
      })
      .join("\n")
      .normalize("NFKC");
    const citedNumbers = new Set(numbers(cited));
    if (!numbers(text).every((n) => citedNumbers.has(n))) continue;
    out.push({ text, refs: refs.sort((a, b) => a - b) });
    if (out.length === MAX_SENTENCES) break;
  }
  return out;
}
