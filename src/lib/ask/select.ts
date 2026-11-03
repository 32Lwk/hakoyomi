import { normalizeName } from "@/lib/rules/normalize";
import type { BadgeKind } from "@/lib/schema/notice";
import type { Passage } from "@/lib/ask/corpus";

// 質問エージェントの選択結果の検査と、Claude が使えないときの語の一致（L-20261103-43）。純粋関数のみ

export type Citation = { id: string; quote: string };
export type Answer = {
  id: string;
  text: string;
  source: Passage["source"];
  productId: string | null;
};

function squash(text: string): string {
  return text.normalize("NFKC").replace(/\s/g, "");
}

// 抜き出しが根拠の原文にそのまま含まれるものだけ残す（言い換え・要約・追記を捨てる）。同じ抜き出しは1つに
export function verifyCitations(citations: Citation[], passages: Passage[]): Answer[] {
  const out: Answer[] = [];
  for (const c of citations) {
    const passage = passages.find((p) => p.id === c.id);
    if (!passage) continue;
    const quote = c.quote.trim() || passage.text;
    if (squash(quote).length < 2 || !squash(passage.text).includes(squash(quote))) continue;
    if (out.some((a) => a.id === c.id && squash(a.text) === squash(quote))) continue;
    out.push({ id: c.id, text: quote, source: passage.source, productId: passage.productId });
  }
  return out;
}

const KEYWORDS: { pattern: RegExp; kinds: BadgeKind[] }[] = [
  { pattern: /運転|乗物|乗り物|機械|眠/, kinds: ["drive"] },
  { pattern: /授乳|母乳/, kinds: ["breastfeeding"] },
  { pattern: /歳|才|小児|子ども|子供|こども|年齢/, kinds: ["under15", "under12"] },
  { pattern: /カフェイン/, kinds: ["caffeine"] },
  { pattern: /濫用|乱用|何個|複数/, kinds: ["abuse"] },
  { pattern: /ドーピング|競技|スポーツ|アスリート/, kinds: ["doping"] },
  { pattern: /酒|アルコール|飲酒/, kinds: ["alcohol"] },
];

// 語の一致：質問の語に当たる種類の根拠と、質問に名前が出てくる成分の根拠
export function keywordSelect(question: string, passages: Passage[]): Answer[] {
  const kinds = KEYWORDS.filter((k) => k.pattern.test(question)).flatMap((k) => k.kinds);
  const q = normalizeName(question);
  const hits = passages.filter(
    (p) =>
      p.kinds.some((k) => kinds.includes(k)) ||
      p.ingredients.some((name) => {
        const n = normalizeName(name).replace(/^(dl|d|l)-/, "");
        return n.length >= 2 && q.includes(n);
      }),
  );
  return hits.map((p) => ({ id: p.id, text: p.text, source: p.source, productId: p.productId }));
}
