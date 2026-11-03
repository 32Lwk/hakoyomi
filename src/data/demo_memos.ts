import type { AuthorAlias } from "@/lib/memos/memo";

// デモ用の店内の説明メモ（T403）。scripts/db/seed.ts で memos 表に入れる（id 固定で何度流しても同じ）。
// 説明の仕方（箱のどの欄を見せるか・何を先に確かめるか）だけを書く。商品を勧める文・お客様の情報は書かない
export type DemoMemo = {
  id: string;
  productId?: string;
  ingredient?: string;
  body: string;
  authorAlias: AuthorAlias;
};

export const DEMO_MEMOS: readonly DemoMemo[] = [
  {
    id: "00000000-0000-4000-8000-000000000401",
    productId: "bufferin-a",
    body: "15歳未満の記載は、箱の裏の「してはいけないこと」の欄にある。その欄を指で示しながら一緒に読む",
    authorAlias: "ベテラン（模擬）",
  },
  {
    id: "00000000-0000-4000-8000-000000000402",
    ingredient: "アスピリン",
    body: "アスピリンを含む商品は、「相談すること」の欄の項目を上から順に読み、当てはまるかはお客様に確かめてもらう",
    authorAlias: "店長（模擬）",
  },
  {
    id: "00000000-0000-4000-8000-000000000403",
    ingredient: "クロルフェニラミンマレイン酸塩",
    body: "眠気の記載は「してはいけないこと」の運転の項目にある。この後に運転の予定があるかを先に聞いてから、その項目を見せる",
    authorAlias: "ベテラン（模擬）",
  },
];
