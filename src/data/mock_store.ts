// 架空1店舗の売場と棚割り（模擬）。T104 で正式な seed にする。
// 座標はマップ上の相対値（0〜100）。
export type StoreArea = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // 売場ではない区画（レジ・入口など）
  fixture?: boolean;
};

export type Shelf = {
  id: string;
  areaId: string;
  label: string;
  tiers: number;
  columns: number;
};

export type ShelfLocation = {
  productId: string;
  shelfId: string;
  // 段は上から1、列は左から1
  tier: number;
  column: number;
};

export const MOCK_STORE = {
  id: "mock-store-1",
  name: "ハコよみ デモ店（架空）",
  areas: [
    { id: "entrance", label: "入口", x: 40, y: 90, w: 20, h: 10, fixture: true },
    { id: "register", label: "レジ", x: 70, y: 76, w: 26, h: 14, fixture: true },
    { id: "cold", label: "かぜ薬・せき止め", x: 6, y: 8, w: 40, h: 16 },
    { id: "pain", label: "解熱鎮痛薬", x: 54, y: 8, w: 40, h: 16 },
    { id: "nose", label: "鼻炎・アレルギー", x: 6, y: 34, w: 40, h: 16 },
    { id: "stomach", label: "胃腸薬", x: 54, y: 34, w: 40, h: 16 },
    { id: "vitamin", label: "ビタミン・滋養", x: 6, y: 60, w: 40, h: 16 },
  ] satisfies StoreArea[],
  shelves: [
    { id: "C-1", areaId: "cold", label: "棚 C-1", tiers: 5, columns: 6 },
    { id: "C-2", areaId: "cold", label: "棚 C-2", tiers: 5, columns: 6 },
  ] satisfies Shelf[],
  locations: [
    { productId: "demo-a", shelfId: "C-1", tier: 2, column: 2 },
    { productId: "demo-b", shelfId: "C-1", tier: 2, column: 5 },
    { productId: "demo-c", shelfId: "C-1", tier: 3, column: 1 },
    { productId: "demo-d", shelfId: "C-1", tier: 4, column: 4 },
    { productId: "demo-e", shelfId: "C-2", tier: 1, column: 3 },
    { productId: "demo-f", shelfId: "C-2", tier: 3, column: 6 },
  ] satisfies ShelfLocation[],
};
