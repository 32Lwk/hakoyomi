// WADA 禁止表のうち、一般用医薬品に含まれうる成分。成分名の照合だけに使い、禁止表の本文は持たない。
// 2026年版（2026-01-01 発効、JADA 日本語版）で確かめた（L-20261104-18、調査は data/research/doping_2026.json）。
// 出典が二次資料だけで確度の低い生薬など（ハンゲ・ロクジョウチンキ・メトキシフェナミン・マシニン）は、ゆうの選択で入れない
export const DOPING_SOURCE = {
  list: "WADA 禁止表国際基準 2026（JADA 日本語版）",
  year: 2026,
  // この日を過ぎたら「年版確認中」に戻す（2027年版は 2027-01-01 発効）
  validUntil: "2026-12-31",
  verified: true,
  url: "https://www.playtruejapan.org/entry_img/2026_prohibited_List_jpn.pdf",
  checkUrl: "https://www.globaldro.com/",
} as const;

// 使い方（経路）で禁止かどうかが変わる成分
// - systemic：経口（口の中・舌下を含む）・注射・経直腸のときだけ禁止。皮膚・鼻・目・耳・吸入は対象外（S9 糖質コルチコイド）
// - notLocal：皮膚・鼻・目・耳への使用は禁止されない。ほかの経路（内服・経直腸・口の中）は禁止（S6 イミダゾリン誘導体）
export type DopingRouteRule = "any" | "systemic" | "notLocal";

export type DopingEntry = {
  // 照合に使う成分名（塩類・水和物・エステルは部分一致で拾う）
  name: string;
  category: string;
  // 常時か競技会時か
  timing: "常時" | "競技会時";
  route: DopingRouteRule;
  // 尿中の閾値など、禁止表の条件
  condition: string | null;
};

const EPHEDRINES = "尿中濃度がエフェドリン・メチルエフェドリンは10µg/mL、プソイドエフェドリンは150µg/mLを超えると禁止";

export const DOPING_ENTRIES: readonly DopingEntry[] = [
  { name: "エフェドリン", category: "S6 興奮薬", timing: "競技会時", route: "any", condition: "尿中濃度10µg/mLを超えると禁止" },
  { name: "メチルエフェドリン", category: "S6 興奮薬", timing: "競技会時", route: "any", condition: "尿中濃度10µg/mLを超えると禁止" },
  { name: "プソイドエフェドリン", category: "S6 興奮薬", timing: "競技会時", route: "any", condition: "尿中濃度150µg/mLを超えると禁止" },
  { name: "マオウ", category: "S6 興奮薬（エフェドリン類を含む生薬）", timing: "競技会時", route: "any", condition: EPHEDRINES },
  { name: "ストリキニーネ", category: "S6 興奮薬", timing: "競技会時", route: "any", condition: null },
  { name: "ホミカ", category: "S6 興奮薬（ストリキニーネを含む生薬）", timing: "競技会時", route: "any", condition: null },
  { name: "トリメトキノール", category: "S3 ベータ2作用薬", timing: "常時", route: "any", condition: null },
  { name: "クロルプレナリン", category: "S3 ベータ2作用薬", timing: "常時", route: "any", condition: null },
  { name: "ヒゲナミン", category: "S3 ベータ2作用薬", timing: "常時", route: "any", condition: null },
  { name: "ナンテンジツ", category: "S3 ベータ2作用薬（ヒゲナミンを含む生薬）", timing: "常時", route: "any", condition: null },
  { name: "ブシ", category: "S3 ベータ2作用薬（ヒゲナミンを含む生薬）", timing: "常時", route: "any", condition: null },
  { name: "サイシン", category: "S3 ベータ2作用薬（ヒゲナミンを含む生薬）", timing: "常時", route: "any", condition: null },
  { name: "チョウジ", category: "S3 ベータ2作用薬（ヒゲナミンを含む生薬）", timing: "常時", route: "any", condition: null },
  { name: "ゴシュユ", category: "S3 ベータ2作用薬（ヒゲナミンを含む生薬）", timing: "常時", route: "any", condition: null },
  ...["プレドニゾロン", "ベタメタゾン", "デキサメタゾン", "ヒドロコルチゾン", "トリアムシノロン", "ベクロメタゾン"].map(
    (name): DopingEntry => ({
      name,
      category: "S9 糖質コルチコイド",
      timing: "競技会時",
      route: "systemic",
      condition: "経口（口の中・舌下を含む）・注射・経直腸のときだけ禁止。皮膚・鼻・目・耳・吸入は対象外",
    }),
  ),
  ...["テトラヒドロゾリン", "ナファゾリン", "オキシメタゾリン"].map(
    (name): DopingEntry => ({
      name,
      category: "S6 興奮薬（イミダゾリン誘導体）",
      timing: "競技会時",
      route: "notLocal",
      condition: "皮膚・鼻・目・耳への使用は禁止されない。内服・経直腸などは除外に含まれない",
    }),
  ),
];

// 禁止ではない監視プログラムの成分。バッジにはせず、質問の答えでだけ「禁止ではない」と伝える
export const DOPING_MONITORING: readonly string[] = [
  "カフェイン",
  "フェニレフリン",
  "ジヒドロコデイン",
  "キジツ",
  "ゴシュユ",
];
