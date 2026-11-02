// WADA 禁止表のうち、一般用医薬品に含まれうる成分。成分名の照合だけに使い、禁止表の本文は持たない。
// 【T-R3】2026年版を JADA 公開資料で未確認。確認するまで verified=false とし、画面に「年版確認中」を出す
export const DOPING_SOURCE = {
  list: "WADA 禁止表国際基準（JADA 日本語版）",
  year: null as number | null,
  verified: false,
  url: "https://www.playtruejapan.org/",
  checkUrl: "https://www.globaldro.com/",
} as const;

export type DopingEntry = {
  // 照合に使う成分名（塩類・水和物は部分一致で拾う）
  name: string;
  category: string;
  // 常時か競技会時か
  timing: "常時" | "競技会時";
};

export const DOPING_ENTRIES: readonly DopingEntry[] = [
  { name: "エフェドリン", category: "S6 興奮薬", timing: "競技会時" },
  { name: "メチルエフェドリン", category: "S6 興奮薬", timing: "競技会時" },
  { name: "プソイドエフェドリン", category: "S6 興奮薬", timing: "競技会時" },
  { name: "マオウ", category: "S6 興奮薬（エフェドリン類を含む生薬）", timing: "競技会時" },
  { name: "ストリキニーネ", category: "S6 興奮薬", timing: "競技会時" },
  { name: "ホミカ", category: "S6 興奮薬（ストリキニーネを含む生薬）", timing: "競技会時" },
  { name: "ヒゲナミン", category: "S3 ベータ2作用薬", timing: "常時" },
  { name: "ナンテンジツ", category: "S3 ベータ2作用薬（ヒゲナミンを含む生薬）", timing: "常時" },
];
