// 指定濫用防止医薬品（2026-05-01 適用）。出典の詳細は docs/memory.md Glossary
export const ABUSE_SOURCE = {
  ingredients: "令和8年厚生労働省告示第32号（適用通知 医薬発0213第1号）",
  quantity: "令和8年厚生労働省告示第33号（適用通知 医薬発0213第2号）",
  sales: "令和7年12月26日 医薬発1226第16号",
  url: "https://www.pref.toyama.jp/1208/kusuri/20260501.html",
} as const;

// 7日分になる例外の効能（薬効群名）。ここにない成分・効能は5日分
export type AbuseIngredient = {
  name: string;
  sevenDayEfficacies: readonly string[];
};

// その水和物・塩類を含む。外用剤と、生薬を主たる有効成分とする製剤は対象外
export const ABUSE_INGREDIENTS: readonly AbuseIngredient[] = [
  { name: "エフェドリン", sevenDayEfficacies: [] },
  { name: "コデイン", sevenDayEfficacies: [] },
  { name: "ジヒドロコデイン", sevenDayEfficacies: ["かぜ薬"] },
  { name: "ジフェンヒドラミン", sevenDayEfficacies: ["かぜ薬"] },
  { name: "デキストロメトルファン", sevenDayEfficacies: ["かぜ薬"] },
  { name: "プソイドエフェドリン", sevenDayEfficacies: ["かぜ薬", "鼻炎用内服薬"] },
  { name: "ブロモバレリル尿素", sevenDayEfficacies: ["解熱鎮痛薬"] },
  { name: "メチルエフェドリン", sevenDayEfficacies: ["かぜ薬", "鼻炎用内服薬"] },
];

// 販売時の確認事項（医薬発1226第16号 第4-1(4)）
export const ABUSE_CHECK_ITEMS = [
  { code: "ア", label: "年齢" },
  { code: "イ", label: "他の薬剤・医薬品の使用状況" },
  { code: "ウ", label: "18歳未満の場合は氏名" },
  { code: "エ", label: "当該製品と他の指定濫用防止医薬品の購入・譲受けの状況" },
  { code: "オ", label: "大容量製品または複数個の場合はその理由" },
  { code: "カ", label: "適正使用の確認に必要な事項" },
  { code: "キ", label: "その他情報提供に必要な事項" },
] as const;
