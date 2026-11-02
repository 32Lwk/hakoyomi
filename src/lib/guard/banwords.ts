// 禁止語の初期リスト（docs/rules.md §4）。guard() 本体は T106 で実装する。
// 文脈しだいの語（「使えます」を個人への可否として使う等）は regex では判定せず、T303 の自己検査に任せる。
export const BANWORDS: readonly string[] = [
  "効く",
  "効きます",
  "効果が高い",
  "効き目",
  "強い",
  "弱い",
  "おすすめ",
  "オススメ",
  "一番",
  "ベスト",
  "代わりに",
  "飲んでよい",
  "飲んで大丈夫",
  "飲めます",
  "安心",
  "販売可",
  "売ってよい",
  "受診不要",
  "診断",
];

// 「1日○回飲んで」のような用法の指示
const PATTERNS: readonly RegExp[] = [/1日\s*[0-9０-９一二三四五六]+\s*回\s*飲んで/];

export function findBanwords(text: string): string[] {
  const hits = BANWORDS.filter((word) => text.includes(word));
  for (const pattern of PATTERNS) {
    const match = text.match(pattern);
    if (match) hits.push(match[0]);
  }
  return hits;
}
