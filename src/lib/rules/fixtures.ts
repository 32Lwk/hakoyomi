import { NoticeItem } from "@/lib/schema/notice";
import { Product } from "@/lib/schema/product";

// テスト用。通知の項目は「かぜ薬等の添付文書等に記載する使用上の注意について」かぜ薬Ⅰ（5〜6頁）から抜粋。
// 商品はテスト用の架空品で、実在の商品ではない。
const KAZE = "kaze_1";

export const KAZE_ITEMS = [
  {
    id: "kaze_1-ng-1-3",
    groupId: KAZE,
    section: "してはいけないこと",
    itemNo: "1.(3)",
    body: "15歳未満の小児.",
    condition: {
      hasIngredient: [
        "アスピリン",
        "アスピリンアルミニウム",
        "イブプロフェン",
        "サザピリン",
        "プロメタジンメチレン二サリチル酸塩",
      ],
    },
    conditionText:
      "アスピリン，アスピリンアルミニウム，イブプロフェン，サザピリン又はプロメタジンメチレン二サリチル酸塩を含有する製剤に記載すること．",
    badge: "under15",
  },
  {
    id: "kaze_1-ng-1-4",
    groupId: KAZE,
    section: "してはいけないこと",
    itemNo: "1.(4)",
    body: "12歳未満の小児.",
    condition: { hasIngredient: ["コデインリン酸塩水和物", "ジヒドロコデインリン酸塩"] },
    conditionText:
      "コデインリン酸塩水和物又はジヒドロコデインリン酸塩を含有する製剤に記載すること．ただし，「してはいけないこと」の１．（３）を記載した製剤にあっては記載しない．",
    excludedBy: ["kaze_1-ng-1-3"],
    badge: "under12",
    needsReview: true,
  },
  {
    id: "kaze_1-ng-3",
    groupId: KAZE,
    section: "してはいけないこと",
    itemNo: "3.",
    body: "服用後，乗物又は機械類の運転操作をしないこと",
    condition: {
      any: [
        { hasClass: ["抗ヒスタミン剤"] },
        {
          hasIngredient: [
            "コデインリン酸塩水和物",
            "ジヒドロコデインリン酸塩",
            "デキストロメトルファン臭化水素酸塩水和物",
          ],
        },
      ],
    },
    conditionText:
      "抗ヒスタミン剤，コデインリン酸塩水和物，ジヒドロコデインリン酸塩又はデキストロメトルファン臭化水素酸塩水和物を含有し…",
    badge: "drive",
  },
  {
    id: "kaze_1-ng-4",
    groupId: KAZE,
    section: "してはいけないこと",
    itemNo: "4.",
    body: "授乳中の人は本剤を服用しないか，本剤を服用する場合は授乳を避けること",
    condition: {
      hasIngredient: [
        "ジフェンヒドラミン塩酸塩",
        "ジフェンヒドラミンサリチル酸塩",
        "タンニン酸ジフェンヒドラミン",
        "コデインリン酸塩水和物",
        "ジヒドロコデインリン酸塩",
      ],
    },
    conditionText:
      "ジフェンヒドラミン塩酸塩，ジフェンヒドラミンサリチル酸塩，タンニン酸ジフェンヒドラミン，コデインリン酸塩水和物又はジヒドロコデインリン酸塩を含有する製剤に記載すること．",
    badge: "breastfeeding",
  },
  {
    id: "kaze_1-ng-5",
    groupId: KAZE,
    section: "してはいけないこと",
    itemNo: "5.",
    body: "服用前後は飲酒しないこと",
    condition: { always: true },
    conditionText: null,
    badge: "alcohol",
  },
  {
    id: "kaze_1-sd-1-3",
    groupId: KAZE,
    section: "相談すること",
    itemNo: "1.(3)",
    body: "授乳中の人．",
    condition: {
      any: [
        { hasIngredient: ["dl－メチルエフェドリン塩酸塩", "イブプロフェン"] },
        {
          amountAtLeast: {
            ingredients: ["安息香酸ナトリウムカフェイン", "カフェイン水和物", "無水カフェイン"],
            as: "無水カフェイン",
            value: 100,
            unit: "mg",
            per: "1回",
          },
        },
      ],
    },
    conditionText:
      "（抜粋）dl－メチルエフェドリン塩酸塩…イブプロフェンを含有する製剤に記載すること．また，…無水カフェインとして１回分量１００ｍｇ以上を含有する製剤に記載すること．ただし，「してはいけないこと」の４．を記載した製剤にあっては記載しない．",
    excludedBy: ["kaze_1-ng-4"],
    badge: "breastfeeding",
  },
].map((item) => NoticeItem.parse(item));

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
