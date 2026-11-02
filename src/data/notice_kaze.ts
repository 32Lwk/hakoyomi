import { NoticeGroup, NoticeItem } from "@/lib/schema/notice";

// 厚労省「かぜ薬等の添付文書等に記載する使用上の注意について」かぜ薬Ⅰ（5〜6頁）からの抜粋。
// T101／T102 で通知全体を構造化・検証した seed に置き換えるまでの暫定データ。
export const KAZE_GROUP = NoticeGroup.parse({
  id: "kaze_1",
  name: "かぜ薬（生薬のみからなる製剤を除く）",
  sourceUrl: "https://www.mhlw.go.jp/content/001742612.pdf",
  sourcePage: 5,
  fetchedOn: "2026-11-02",
});

const KAZE = KAZE_GROUP.id;

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
