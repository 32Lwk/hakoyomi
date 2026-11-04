// 指定濫用防止医薬品（2026-05-01 適用）。出典の詳細は docs/memory.md Glossary
export const ABUSE_SOURCE = {
  ingredients: "令和8年厚生労働省告示第32号（適用通知 医薬発0213第1号）",
  quantity: "令和8年厚生労働省告示第33号（適用通知 医薬発0213第2号）",
  sales: "令和7年12月26日 医薬発1226第16号",
  url: "https://www.pref.toyama.jp/1208/kusuri/20260501.html",
} as const;

// 厚労省通知「かぜ薬等の添付文書等に記載する使用上の注意について」Ⅲ 指定濫用防止医薬品（PDF 195頁）
export const ABUSE_NOTICE_GROUP = {
  id: "abuse_prevention",
  name: "指定濫用防止医薬品に係る使用上の注意",
  sourceUrl: "https://www.mhlw.go.jp/content/001742612.pdf",
  sourcePage: 195,
  fetchedOn: "2026-11-02",
} as const;

export const ABUSE_NOTICE_ITEM = {
  id: "abuse_prevention-ng-last",
  groupId: "abuse_prevention",
  section: "してはいけないこと" as const,
  itemNo: "続き番号",
  body: "過量服用しないこと",
  conditionText:
    "注意事項の最後に，続き番号として記載すること．長期連用に係る注意事項が定められている場合は，当該記載と合わせて記載することができる．（例）過量服用・長期連用しないこと",
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

export type AbuseCheckCode = "ア" | "イ" | "ウ" | "エ" | "オ" | "カ" | "キ";
export type AbuseCheckCondition = "under18" | "largeOrMultiple";

export type AbuseCheckItem = {
  code: AbuseCheckCode;
  label: string;
  condition?: AbuseCheckCondition;
  note?: string;
};

// 販売時の確認事項（医薬発1226第16号 第4-1(4)）
export const ABUSE_CHECK_ITEMS: readonly AbuseCheckItem[] = [
  { code: "ア", label: "年齢" },
  { code: "イ", label: "他の薬剤・医薬品の使用状況" },
  {
    code: "ウ",
    label: "18歳未満の場合は氏名",
    condition: "under18",
    note: "店頭で確認した事実のみチェック（アプリに氏名は入力しません）",
  },
  { code: "エ", label: "当該製品と他の指定濫用防止医薬品の購入・譲受けの状況" },
  {
    code: "オ",
    label: "大容量製品または複数個の場合はその理由",
    condition: "largeOrMultiple",
    note: "大容量製品または複数個（別製品で同一指定成分が重なる場合を含む）に該当するとき確認",
  },
  { code: "カ", label: "適正使用の確認に必要な事項" },
  { code: "キ", label: "その他情報提供に必要な事項" },
] as const;

export const ABUSE_CHECK_CODES = ["ア", "イ", "ウ", "エ", "オ", "カ", "キ"] as const;
