// 質問エージェントの検索（L-20261103-44）。根拠の本文・出典名・成分名に BM25 をかける。純粋関数のみ。
// 日本語は分かち書きしないので、漢字・カタカナの並びは文字の2-gram、英数字は語のまま。
// ひらがなだけの2-gram（「こと」「して」など）は数が多く意味が薄いので使わない

const K1 = 1.2;
const B = 0.75;

const WORD = /[a-z0-9]+(?:[.][0-9]+)?/g;
const CJK = /[\p{Script=Han}\p{Script=Katakana}\p{Script=Hiragana}ー々]+/gu;
const HIRAGANA_ONLY = /^[\p{Script=Hiragana}ー]+$/u;

export function tokenize(text: string): string[] {
  const s = text.normalize("NFKC").toLowerCase();
  const tokens: string[] = s.match(WORD) ?? [];
  for (const run of s.match(CJK) ?? []) {
    const chars = [...run];
    if (chars.length === 1) {
      if (!HIRAGANA_ONLY.test(run)) tokens.push(run);
      continue;
    }
    for (let i = 0; i < chars.length - 1; i++) {
      const gram = chars[i] + chars[i + 1];
      if (!HIRAGANA_ONLY.test(gram)) tokens.push(gram);
    }
  }
  return tokens;
}

export type Bm25Doc = { id: string; text: string };
export type Bm25Index = {
  docs: { id: string; tf: Map<string, number>; length: number }[];
  df: Map<string, number>;
  avgLength: number;
};

export function buildIndex(docs: Bm25Doc[]): Bm25Index {
  const df = new Map<string, number>();
  const built = docs.map(({ id, text }) => {
    const tokens = tokenize(text);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    return { id, tf, length: tokens.length };
  });
  const total = built.reduce((sum, d) => sum + d.length, 0);
  return { docs: built, df, avgLength: built.length ? total / built.length : 0 };
}

export type Bm25Hit = { id: string; score: number };

// スコアが 0 より大きいものを高い順に。同点は元の並び（安定ソート）
export function search(index: Bm25Index, query: string): Bm25Hit[] {
  const n = index.docs.length;
  const terms = [...new Set(tokenize(query))];
  const hits: Bm25Hit[] = [];
  for (const doc of index.docs) {
    let score = 0;
    for (const term of terms) {
      const f = doc.tf.get(term);
      if (!f) continue;
      const df = index.df.get(term) ?? 0;
      const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
      score += (idf * f * (K1 + 1)) / (f + K1 * (1 - B + (B * doc.length) / index.avgLength));
    }
    if (score > 0) hits.push({ id: doc.id, score });
  }
  return hits.sort((a, b) => b.score - a.score);
}
