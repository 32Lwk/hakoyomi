// 架空1店舗の売場と棚割り（模擬）。T104 で正式な seed にする。
// 座標は売場図の viewBox（幅100×奥行120）上の値。上が店の奥、下が入口側。

export type Rect = { x: number; y: number; w: number; h: number };

// ゴンドラ（両面の陳列台）。北面（奥向き）と南面（入口向き）に棚がある
export type Gondola = Rect & { id: string; endcap: string };

// 壁面の棚
export type WallShelf = Rect & { id: string; label: string; vertical?: boolean };

export type Shelf = {
  id: string;
  label: string;
  category: string;
  gondolaId: string;
  side: "N" | "S";
  tiers: number;
  columns: number;
};

export type ShelfLocation = {
  productId: string;
  shelfId: string;
  // 段は上から1、列は左から1（棚の正面に立って見たとき）
  tier: number;
  column: number;
};

const GONDOLA_X = 18;
const GONDOLA_W = 64;
const GONDOLA_H = 10;

export const MOCK_STORE = {
  id: "mock-store-1",
  name: "ハコよみ デモ店（架空）",
  size: { w: 100, h: 120 },
  entrance: { x: 10, y: 116, w: 26, h: 4 } satisfies Rect,
  register: { x: 58, y: 94, w: 34, h: 9 } satisfies Rect,
  // 登販が立つ場所（経路の起点）
  start: { x: 75, y: 88, label: "レジ前" },
  // 入口側から奥へ通る右の主通路
  mainAisleX: 94,
  walls: [
    { id: "W-top", label: "ビタミン・滋養（壁面）", x: 4, y: 3, w: 92, h: 6 },
    { id: "W-left", label: "衛生用品（壁面）", x: 3, y: 14, w: 6, h: 72, vertical: true },
  ] satisfies WallShelf[],
  gondolas: [
    { id: "G1", x: GONDOLA_X, y: 20, w: GONDOLA_W, h: GONDOLA_H, endcap: "季節品" },
    { id: "G2", x: GONDOLA_X, y: 44, w: GONDOLA_W, h: GONDOLA_H, endcap: "特売" },
    { id: "G3", x: GONDOLA_X, y: 68, w: GONDOLA_W, h: GONDOLA_H, endcap: "新商品" },
  ] satisfies Gondola[],
  shelves: [
    { id: "S-1", label: "棚 S-1", category: "胃腸薬", gondolaId: "G1", side: "N", tiers: 5, columns: 6 },
    { id: "C-1", label: "棚 C-1", category: "かぜ薬", gondolaId: "G1", side: "S", tiers: 5, columns: 6 },
    { id: "C-2", label: "棚 C-2", category: "せき止め・かぜ薬", gondolaId: "G2", side: "N", tiers: 5, columns: 6 },
    { id: "N-1", label: "棚 N-1", category: "鼻炎・アレルギー", gondolaId: "G2", side: "S", tiers: 5, columns: 6 },
    { id: "P-1", label: "棚 P-1", category: "解熱鎮痛薬", gondolaId: "G3", side: "N", tiers: 5, columns: 6 },
    { id: "E-1", label: "棚 E-1", category: "目薬・外用薬", gondolaId: "G3", side: "S", tiers: 5, columns: 6 },
  ] satisfies Shelf[],
  locations: [
    { productId: "demo-a", shelfId: "C-1", tier: 2, column: 2 },
    { productId: "demo-b", shelfId: "C-1", tier: 2, column: 5 },
    { productId: "demo-c", shelfId: "C-1", tier: 3, column: 1 },
    { productId: "demo-d", shelfId: "C-1", tier: 4, column: 4 },
    { productId: "demo-e", shelfId: "C-2", tier: 1, column: 3 },
    { productId: "demo-f", shelfId: "C-2", tier: 3, column: 6 },
    { productId: "demo-g", shelfId: "N-1", tier: 2, column: 3 },
    { productId: "demo-h", shelfId: "P-1", tier: 3, column: 2 },
  ] satisfies ShelfLocation[],
};

export type MockStore = typeof MOCK_STORE;
