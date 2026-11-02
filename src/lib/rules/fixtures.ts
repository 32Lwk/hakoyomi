import { KAZE_GROUP } from "@/data/notice_kaze";
import { Product } from "@/lib/schema/product";

export { KAZE_ITEMS } from "@/data/notice_kaze";

// テスト用の架空品で、実在の商品ではない。
const KAZE = KAZE_GROUP.id;

const base = {
  maker: "テスト製薬",
  riskClass: "指定第2類",
  noticeGroupId: KAZE,
  efficacyGroups: ["かぜ薬"],
  route: "internal",
  crudeDrugMain: false,
  dailyMaxUnits: 9,
  timesPerDay: 3,
  contentUnit: "錠",
  pmdaUrl: null,
  docRevisedOn: null,
  enteredBy: "test",
  verifiedOn: null,
} as const;

// コデイン類・メチルエフェドリン・抗ヒスタミン剤・カフェインを含む
export const productA = Product.parse({
  ...base,
  id: "test-a",
  jan: "4900000000011",
  name: "テストかぜ薬A",
  contentQty: 30,
  facts: [
    { ingredient: "アセトアミノフェン", amountPerDay: 900, unit: "mg" },
    { ingredient: "ジヒドロコデインリン酸塩", amountPerDay: 24, unit: "mg" },
    { ingredient: "dl-メチルエフェドリン塩酸塩", amountPerDay: 60, unit: "mg" },
    {
      ingredient: "クロルフェニラミンマレイン酸塩",
      ingredientClasses: ["抗ヒスタミン剤"],
      amountPerDay: 7.5,
      unit: "mg",
    },
    { ingredient: "無水カフェイン", amountPerDay: 75, unit: "mg" },
  ],
});

// イブプロフェンとカフェイン水和物（1回 109.8mg 無水カフェイン換算）。抗ヒスタミン剤なし
export const productB = Product.parse({
  ...base,
  id: "test-b",
  jan: "4900000000028",
  name: "テストかぜ薬B",
  riskClass: "第2類",
  contentQty: 36,
  facts: [
    { ingredient: "イブプロフェン", amountPerDay: 450, unit: "mg" },
    { ingredient: "カフェイン水和物", amountPerDay: 360, unit: "mg" },
  ],
});
