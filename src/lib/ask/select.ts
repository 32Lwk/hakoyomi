import { buildIndex, search } from "@/lib/ask/bm25";
import { normalizeName } from "@/lib/rules/normalize";
import type { ProductBadgeKind } from "@/lib/schema/notice";
import type { Passage } from "@/lib/ask/corpus";

// 質問エージェントの検索（BM25、L-20261103-44）と選択結果の検査、Claude が使えないときの語の一致（L-20261103-43）。純粋関数のみ

export type Citation = { id: string; quote: string };
export type Answer = {
  id: string;
  text: string;
  source: Passage["source"];
  condition: Passage["condition"];
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
    out.push({
      id: c.id,
      text: quote,
      source: passage.source,
      condition: passage.condition,
      productId: passage.productId,
    });
  }
  return out;
}

const KEYWORDS: { pattern: RegExp; kinds: ProductBadgeKind[] }[] = [
  { pattern: /運転|乗物|乗り物|機械|眠/, kinds: ["drive"] },
  { pattern: /授乳|母乳/, kinds: ["breastfeeding"] },
  { pattern: /歳|才|小児|子ども|子供|こども|年齢/, kinds: ["under15", "under12"] },
  { pattern: /カフェイン/, kinds: ["caffeine"] },
  { pattern: /濫用|乱用|何個|複数/, kinds: ["abuse"] },
  { pattern: /ドーピング|競技|スポーツ|アスリート/, kinds: ["doping"] },
  {
    pattern: /ハラール|ハラル|イスラム|ムスリム|豚|ゼラチン|エタノール|アルコール|添加物/,
    kinds: ["halal"],
  },
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
  return hits.map((p) => ({
    id: p.id,
    text: p.text,
    source: p.source,
    condition: p.condition,
    productId: p.productId,
  }));
}

// 質問の言い方と通知の書き方の違いを埋める語（Claude の解釈が使えないときのためにコードで持つ）
const SYNONYMS: { pattern: RegExp; terms: string }[] = [
  { pattern: /眠く|眠い|ねむ/, terms: "眠気" },
  { pattern: /乗り物|車|運転/, terms: "乗物 運転操作" },
  { pattern: /子ども|子供|こども|小児|歳|才/, terms: "小児 未満 歳" },
  // 漢方製剤の「生後３ヵ月未満の乳児」「１歳未満の乳児」（L-20261104-12）
  { pattern: /赤ちゃん|赤ん坊|乳児|新生児|乳幼児/, terms: "乳児 生後 未満" },
  { pattern: /母乳|授乳/, terms: "授乳" },
  { pattern: /酒|アルコール/, terms: "飲酒" },
  { pattern: /妊娠|妊婦/, terms: "妊婦 妊娠" },
  { pattern: /何のため|目的|役割|働き/, terms: "配合 目的" },
  { pattern: /飲み合わせ|併用|一緒/, terms: "併用 他の" },
  { pattern: /副作用/, terms: "副作用 症状" },
  {
    pattern: /ハラール|ハラル|イスラム|ムスリム|豚/,
    terms: "アルコール エタノール ゼラチン 添加物 ハラール認証",
  },
  { pattern: /ドーピング|競技|スポーツ|アスリート/, terms: "禁止表 WADA 監視プログラム" },
  { pattern: /何回|回数|何錠|量/, terms: "1日最大 回" },
  // 承認基準の効能・効果（出典名に「効能・効果」がある）。L-20261104-09
  { pattern: /何に(使|効)|どんな(症状|とき|時)|使い道|適応|何の薬/, terms: "効能・効果" },
];

export function expandQuery(question: string): string {
  return [question, ...SYNONYMS.filter((s) => s.pattern.test(question)).map((s) => s.terms)].join(
    " ",
  );
}

function docText(p: Passage): string {
  return `${p.text} ${p.condition ?? ""} ${p.source.label} ${p.ingredients.join(" ")}`;
}

export type Retrieved = { passage: Passage; score: number };

// 根拠を BM25 で探し、語の一致（種類・成分名）に当たるものも足す。
// 商品ごとの根拠は商品ごとに上位 perProduct 件と基本情報（-1）、全体（productId が null）は上位 limit 件
export function retrieve(
  query: string,
  passages: Passage[],
  { limit = 20, perProduct = 8 }: { limit?: number; perProduct?: number } = {},
): Retrieved[] {
  const hits = search(buildIndex(passages.map((p) => ({ id: p.id, text: docText(p) }))), query);
  const top = hits[0]?.score ?? 0;
  const scores = new Map(hits.map((h) => [h.id, h.score]));
  // 語の一致は BM25 の最上位と同じ重さで足す（言い換えで 2-gram が当たらないときの取りこぼし防止）
  for (const a of keywordSelect(query, passages)) {
    scores.set(a.id, Math.max(scores.get(a.id) ?? 0, top || 1));
  }
  const ranked = passages
    .filter((p) => scores.has(p.id))
    .map((passage) => ({ passage, score: scores.get(passage.id) ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const productIds = [...new Set(passages.map((p) => p.productId))];
  if (productIds.every((id) => id === null)) return ranked.slice(0, limit);
  return productIds.flatMap((id) => {
    const own = ranked
      .filter((r) => r.passage.productId === id)
      .slice(0, id === null ? limit : perProduct);
    if (id === null) return own;
    const base = passages.find((p) => p.productId === id && p.id.endsWith("-1"));
    return base && !own.some((r) => r.passage.id === base.id)
      ? [{ passage: base, score: 0 }, ...own]
      : own;
  });
}

// Claude が使えないときの答え：検索の上位のうち、最上位の3割以上のスコアのもの（商品ごと・全体で最大 max 件）
export function fallbackAnswers(retrieved: Retrieved[], max = 6): Answer[] {
  const groups = new Map<string | null, Retrieved[]>();
  for (const r of retrieved) {
    if (r.score <= 0) continue;
    groups.set(r.passage.productId, [...(groups.get(r.passage.productId) ?? []), r]);
  }
  return [...groups.values()].flatMap((rs) => {
    const top = rs[0].score;
    return rs
      .filter((r) => r.score >= top * 0.3)
      .slice(0, max)
      .map(({ passage: p }) => ({
        id: p.id,
        text: p.text,
        source: p.source,
        condition: p.condition,
        productId: p.productId,
      }));
  });
}
