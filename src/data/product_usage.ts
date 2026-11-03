import usage from "@/data/product_usage.json";

// 商品の剤形と、用法がある最年少の月齢（L-20261104-12）。通知の記載条件「生後３ヵ月未満の用法がある製剤」
// 「小児の用法がある場合」「錠剤・丸剤の場合」の判定に使う。scripts/demo/product_usage.py で既存データの
// 用法用量の年齢区分と品名から数値・剤形だけを作る（文面は持たない）。いまは漢方製剤だけ
export type ProductUsage = {
  dosageForm: string | null;
  // 「服用しない」でない年齢区分の下限の最小（例：2歳以上 → 24、2歳未満にも量がある → 0）
  usageFromMonths: number | null;
  source: string;
  checkedOn: string;
};

export const PRODUCT_USAGE: Record<string, ProductUsage> = usage;
