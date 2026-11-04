import dosage from "@/data/product_dosage.json";

// 商品の用法・用量の表（L-20261104-22）。scripts/demo/product_dosage.py で既存データの用法用量から
// 年齢区分・1回量・1日の回数・服用間隔の値だけを取り出す（文面は持たない）。取り出せない品はキーがない
export type DosageRow = {
  // 「15歳以上」「7歳以上15歳未満」「8〜14歳」など
  age: string;
  // 「2錠」「2/3包」。null は「服用しない」区分
  dose: string | null;
  // 行ごとの1日の回数（「3回」）。なければ timesPerDay
  times: string | null;
};

export type ProductDosage = {
  rows: DosageRow[];
  timesPerDay: string | null;
  intervalHours: number | null;
  source: string;
  checkedOn: string;
};

export const PRODUCT_DOSAGE: Record<string, ProductDosage> = dosage;
