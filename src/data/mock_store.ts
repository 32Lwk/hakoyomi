import type { MedicineKind } from "@/lib/schema/product";

// 架空1店舗の売場と棚割り（模擬、L-20261103-06・-07・-08）。T104 で正式な seed にする。
// 座標はメートル（売場図の viewBox もメートル）。上が店の奥、下が入口側。
//
// 寸法は一般的な郊外型ドラッグストアの目安（出典つきの値ではない）：
// - 売場 24m×28m（約670㎡・約200坪）
// - ゴンドラ1本＝幅90cm・6段、両面の奥行1.2m、両端のエンドは奥行0.55m。1列＝5本（L-08）
// - 主通路2.4m、副通路1.6m、壁面棚の奥行0.6m
// 売場：
// - 右側に医薬品の相談カウンター（情報提供の場所）とレジを隣り合わせに置き、その横のゴンドラを医薬品売場にする
// - 医薬品はゴンドラ2台半（25本）＋カウンター内の5本（第1類・要指導）＝30本。小さい売場は1本を段で分け合う
// - ほかは食品・日用品・化粧品。入口のそばに化粧品

export type Rect = { x: number; y: number; w: number; h: number };

// 面の向き＝その面の前に立つ側。N は陳列台の北（奥）側に立って入口側を向く
export type Side = "N" | "S" | "E" | "W";

export type Zone = "medicine" | "health" | "food" | "daily" | "cosmetics";

export const ZONE_LABEL: Record<Zone, string> = {
  medicine: "医薬品",
  health: "健康食品",
  food: "食品・飲料",
  daily: "日用品",
  cosmetics: "化粧品",
};

export const BAYS_PER_ROW = 5;
export const BAY_W = 0.9;
const FACE_DEPTH = 0.6;
const ENDCAP = 0.55;

// 1本の中の売場。上から tiers 段ぶん。kind は正面図のイメージ図（L-33）の種類
export type Section = { name: string; kind: MedicineKind; tiers: number };

export type Face = {
  side: Side;
  // 棚番の頭（"6A" なら 6A-1〜6A-5）
  code: string;
  // 面の前の通路など（案内の文言）
  where: string;
  zone: Zone;
  // 面の売場名（医薬品の面は売場の看板、ほかは売場名だけ）
  title: string;
  // 医薬品の面だけ：正面に立って左から5本ぶん
  bays?: Section[][];
  columns?: number;
};

// 陳列台：両面のゴンドラ、または壁面の棚
export type Fixture = Rect & {
  id: string;
  name: string;
  kind: "gondola" | "wall";
  // 壁面の棚が縦（左右の壁）か
  vertical?: boolean;
  faces: Face[];
  // ゴンドラの両端（エンド）の売場
  endcaps?: { west?: string; east?: string };
  // 現在地から棚の前までの経由点（カウンターの内側は通用口を通る）
  via?: [number, number][];
};

// 医薬品の棚1本
export type Shelf = {
  id: string;
  label: string;
  category: string;
  sections: Section[];
  fixtureId: string;
  side: Side;
  where: string;
  // 面の中で左から何本目か
  bay: number;
  tiers: number;
  columns: number;
};

// 医薬品以外の面（売場名だけ出す）
export type Area = { id: string; name: string; zone: Zone; fixtureId: string; side: Side; where: string };

export type ShelfLocation = {
  productId: string;
  shelfId: string;
  // 段は上から1、列は左から1（棚の正面に立って見たとき）
  tier: number;
  column: number;
};

export function sectionAt(shelf: Pick<Shelf, "sections">, tier: number): Section {
  let top = 0;
  for (const s of shelf.sections) {
    top += s.tiers;
    if (tier <= top) return s;
  }
  return shelf.sections[shelf.sections.length - 1];
}

const s = (name: string, kind: MedicineKind, tiers = 6): Section => ({ name, kind, tiers });

// ゴンドラは2列×7行。列1は x=2.95、列2は x=10.35（エンドを除いた本体）。行は奥から 2.8m おき
const COL_X = [2.95, 10.35];
const ROW_Y = (row: number) => 2.6 + (row - 1) * 2.8;
const ROWS = 7;

type FaceSpec = Pick<Face, "zone" | "title" | "bays">;

function gondola(
  row: number,
  col: number,
  north: FaceSpec,
  south: FaceSpec,
  endcaps?: Fixture["endcaps"],
): Fixture {
  const no = (row - 1) * 2 + col;
  return {
    id: `G${no}`,
    name: `ゴンドラ${no}`,
    kind: "gondola",
    x: COL_X[col - 1],
    y: ROW_Y(row),
    w: BAYS_PER_ROW * BAY_W,
    h: FACE_DEPTH * 2,
    endcaps,
    faces: [
      {
        side: "N",
        code: `${no}A`,
        where: row === 1 ? "奥の通路" : `通路${row - 1}`,
        columns: 8,
        ...north,
      },
      {
        side: "S",
        code: `${no}B`,
        where: row === ROWS ? "入口前の通路" : `通路${row}`,
        columns: 8,
        ...south,
      },
    ],
  };
}

const plain = (zone: Zone, title: string): FaceSpec => ({ zone, title });

function wall(
  id: string,
  rect: Rect,
  side: Side,
  zone: Zone,
  title: string,
  where: string,
): Fixture {
  return {
    id,
    name: where,
    kind: "wall",
    vertical: side === "E" || side === "W",
    ...rect,
    faces: [{ side, code: id, where, zone, title }],
  };
}

const FIXTURES: Fixture[] = [
  // 壁面
  wall("W-b1", { x: 0.6, y: 0, w: 7.4, h: 0.6 }, "S", "food", "冷凍食品", "奥の壁面"),
  wall("W-b2", { x: 8, y: 0, w: 8, h: 0.6 }, "S", "food", "食品", "奥の壁面"),
  wall("W-b3", { x: 16, y: 0, w: 7.4, h: 0.6 }, "S", "food", "飲料（冷蔵ケース）", "奥の壁面"),
  wall("W-r1", { x: 23.4, y: 0.6, w: 0.6, h: 9.9 }, "W", "food", "酒・飲料（冷蔵）", "右の壁面"),
  wall("W-l1", { x: 0, y: 0.6, w: 0.6, h: 6.4 }, "E", "daily", "ペット用品", "左の壁面"),
  wall("W-l2", { x: 0, y: 7, w: 0.6, h: 7 }, "E", "daily", "洗剤・柔軟剤", "左の壁面"),
  wall("W-l3", { x: 0, y: 14, w: 0.6, h: 6.6 }, "E", "daily", "ティッシュ・紙製品", "左の壁面"),
  // カウンターの内側の棚（第1類・要指導。お客様の手の届かない場所）
  {
    id: "W-counter",
    name: "カウンター内の棚",
    kind: "wall",
    vertical: true,
    x: 23.4,
    y: 11.75,
    w: 0.6,
    h: BAYS_PER_ROW * BAY_W,
    via: [[22.6, 16.5]],
    faces: [
      {
        side: "W",
        code: "C",
        where: "相談カウンターの内側",
        zone: "medicine",
        title: "第1類・要指導",
        columns: 8,
        bays: [
          [s("第1類（解熱鎮痛）", "fever", 5)],
          [s("第1類（胃腸・鼻炎）", "stomach", 5)],
          [s("第1類（外用・発毛）", "topical", 5)],
          [s("要指導医薬品", "rhinitis", 5)],
          [s("要指導医薬品", "eye", 5)],
        ],
      },
    ],
  },
  // ゴンドラ（奥の行から）
  gondola(1, 1, plain("food", "菓子"), plain("food", "菓子")),
  gondola(1, 2, plain("food", "食品"), plain("food", "食品")),
  gondola(2, 1, plain("food", "食品"), plain("daily", "キッチン用品")),
  gondola(2, 2, plain("food", "飲料"), plain("daily", "日用雑貨")),
  gondola(3, 1, plain("daily", "洗剤"), plain("daily", "掃除用品")),
  gondola(
    3,
    2,
    {
      zone: "medicine",
      title: "かぜ薬・せき止め",
      bays: [
        [s("かぜ薬", "cold")],
        [s("かぜ薬", "cold")],
        [s("小児用かぜ薬", "cold", 3), s("かぜの漢方薬", "kampo", 3)],
        [s("せき止め", "cough")],
        [s("のど・トローチ", "cough", 3), s("うがい薬", "cough", 3)],
      ],
    },
    {
      zone: "medicine",
      title: "解熱鎮痛薬・鼻炎薬",
      bays: [
        [s("解熱鎮痛薬", "fever")],
        [s("解熱鎮痛薬", "fever")],
        [s("睡眠改善薬", "sleep", 3), s("乗り物酔い", "motion", 3)],
        [s("鼻炎薬", "rhinitis")],
        [s("鼻炎薬", "rhinitis")],
      ],
    },
    { west: "マスク", east: "かぜ特設" },
  ),
  gondola(4, 1, plain("daily", "オーラルケア"), plain("daily", "ベビー用品")),
  gondola(
    4,
    2,
    {
      zone: "medicine",
      title: "目薬・胃腸薬",
      bays: [
        [s("点鼻薬", "nasal", 3), s("目薬", "eye", 3)],
        [s("目薬", "eye")],
        [s("胃腸薬", "stomach")],
        [s("胃腸薬", "stomach")],
        [s("便秘薬", "stomach", 3), s("整腸・下痢止め", "stomach", 3)],
      ],
    },
    {
      zone: "medicine",
      title: "漢方・皮膚薬・外用薬",
      bays: [
        [s("漢方薬", "kampo")],
        [s("皮膚薬", "topical", 3), s("水虫", "topical", 3)],
        [s("口内炎", "topical", 2), s("痔の薬", "topical", 2), s("殺菌消毒", "topical", 2)],
        [s("湿布・外用鎮痛", "topical")],
        [s("湿布・外用鎮痛", "topical", 3), s("虫さされ・かゆみ", "topical", 3)],
      ],
    },
    { west: "胃腸特売", east: "花粉特設" },
  ),
  gondola(5, 1, plain("daily", "衛生用品"), plain("daily", "生理用品")),
  gondola(
    5,
    2,
    {
      zone: "medicine",
      title: "ビタミン剤・ドリンク剤",
      bays: [
        [s("ビタミン剤", "vitamin")],
        [s("ビタミン剤", "vitamin")],
        [s("滋養強壮", "vitamin")],
        [s("ドリンク剤", "vitamin")],
        [s("ドリンク剤", "vitamin")],
      ],
    },
    plain("health", "サプリ・健康食品"),
    { west: "サプリ", east: "ドリンク特売" },
  ),
  gondola(6, 1, plain("cosmetics", "ヘアケア"), plain("cosmetics", "ボディケア")),
  gondola(6, 2, plain("daily", "介護用品"), plain("cosmetics", "男性化粧品")),
  gondola(7, 1, plain("cosmetics", "スキンケア"), plain("cosmetics", "メイク")),
  gondola(7, 2, plain("cosmetics", "スキンケア"), plain("cosmetics", "日焼け止め")),
];

function shelfLabel(fixture: Fixture, id: string): string {
  if (fixture.id === "W-counter") return `カウンター内 ${id}`;
  return `棚 ${id}`;
}

const SHELVES: Shelf[] = FIXTURES.flatMap((fixture) =>
  fixture.faces.flatMap((face) =>
    (face.bays ?? []).map((sections, i) => {
      const id = `${face.code}-${i + 1}`;
      return {
        id,
        label: shelfLabel(fixture, id),
        category: [...new Set(sections.map((x) => x.name))].join("・"),
        sections,
        fixtureId: fixture.id,
        side: face.side,
        where: face.where,
        bay: i + 1,
        tiers: sections.reduce((n, x) => n + x.tiers, 0),
        columns: face.columns ?? 8,
      };
    }),
  ),
);

const AREAS: Area[] = FIXTURES.flatMap((fixture) =>
  fixture.faces
    .filter((face) => !face.bays)
    .map((face) => ({
      id: `${fixture.id}:${face.side}`,
      name: face.title,
      zone: face.zone,
      fixtureId: fixture.id,
      side: face.side,
      where: face.where,
    })),
);

export const MOCK_STORE = {
  id: "mock-store-1",
  name: "ハコよみ デモ店（架空）",
  size: { w: 24, h: 28 },
  endcapDepth: ENDCAP,
  entrance: { x: 15.6, y: 27.7, w: 3.4, h: 0.3 } satisfies Rect,
  carts: { x: 20.6, y: 24.4, w: 2.6, h: 2.2 } satisfies Rect,
  // 平台（季節品・特売）
  tables: [
    { x: 2.95, y: 23.8, w: 4.5, h: 1.2, label: "季節品（平台）" },
    { x: 10.35, y: 23.8, w: 4.5, h: 1.2, label: "特売（平台）" },
  ],
  // 右側：相談カウンター（情報提供の場所）とレジが隣り合う。その内側はスタッフだけ
  staffArea: { x: 20.4, y: 11, w: 3, h: 10.5 } satisfies Rect,
  counter: { x: 19.6, y: 12, w: 0.8, h: 4 } satisfies Rect,
  register: { x: 19.6, y: 17, w: 0.8, h: 4 } satisfies Rect,
  // 登販が立つ場所（経路の起点）。カウンターとレジのあいだ
  start: { x: 19, y: 16.5, label: "現在地" },
  // 主通路（右、縦）の中心
  mainAisleX: 16.8,
  // 医薬品売場のまとまり（全体図で囲む）と、拡大図の範囲
  medicineZone: { x: 9.5, y: 7.4, w: 14.3, h: 9.2 } satisfies Rect,
  zoom: { x: 8.4, y: 6.6, w: 15.6, h: 15.2 } satisfies Rect,
  // 通路番号の札（行のあいだの副通路。全体図は左の通路、拡大図は列のあいだに描く）
  aisles: Array.from({ length: ROWS - 1 }, (_, i) => ({ no: i + 1, y: ROW_Y(i + 1) + 2 })),
  // 売場のまとまりの名前（全体図に大きく出す）
  zoneLabels: [
    { zone: "food", x: 8.9, y: 4.6 },
    { zone: "daily", x: 5.2, y: 11.6 },
    { zone: "cosmetics", x: 8.9, y: 18.6 },
  ] satisfies { zone: Zone; x: number; y: number }[],
  fixtures: FIXTURES,
  shelves: SHELVES,
  areas: AREAS,
  // 段は上から1、列は左から1。品名順や売れ筋の順ではなく、売場の棚割りを模したもの（ブランドごとにまとめる）
  locations: [
    { productId: "shin-lulu-a-s", shelfId: "6A-1", tier: 3, column: 2 },
    { productId: "lulu-attack-ex", shelfId: "6A-1", tier: 2, column: 6 },
    { productId: "benza-block-l", shelfId: "6A-2", tier: 3, column: 2 },
    { productId: "shin-contac-kaze", shelfId: "6A-2", tier: 4, column: 6 },
    { productId: "shin-estac-granule", shelfId: "6A-1", tier: 4, column: 4 },
    { productId: "estac-ibu-fine-ex", shelfId: "6A-2", tier: 2, column: 5 },
    { productId: "benza-block-cough", shelfId: "6A-4", tier: 3, column: 3 },
    { productId: "shin-bron-ace", shelfId: "6A-4", tier: 4, column: 6 },
    { productId: "eve-a", shelfId: "6B-1", tier: 3, column: 2 },
    { productId: "bufferin-a", shelfId: "6B-1", tier: 4, column: 6 },
    { productId: "tylenol-a", shelfId: "6B-2", tier: 3, column: 3 },
    { productId: "naron-ace", shelfId: "6B-2", tier: 4, column: 1 },
    { productId: "shin-sedes", shelfId: "6B-2", tier: 2, column: 6 },
    { productId: "drewell", shelfId: "6B-3", tier: 2, column: 4 },
    { productId: "allegra-fx", shelfId: "6B-4", tier: 3, column: 2 },
    { productId: "alesion-20", shelfId: "6B-4", tier: 3, column: 6 },
    { productId: "pabron-bien-ex", shelfId: "6B-5", tier: 3, column: 3 },
    { productId: "stona-rhini-s", shelfId: "6B-5", tier: 4, column: 5 },
    // 第1類はカウンターの内側
    { productId: "loxonin-s", shelfId: "C-1", tier: 2, column: 3 },
    { productId: "loxonin-s-premium", shelfId: "C-1", tier: 2, column: 4 },
    // 追加21品（L-20261103-03）。同じブランド・同じ成分の品の近くに置く
    { productId: "shin-lulu-a-gold-s", shelfId: "6A-1", tier: 3, column: 3 },
    { productId: "lulu-attack-nx", shelfId: "6A-1", tier: 2, column: 7 },
    { productId: "benza-block-s", shelfId: "6A-2", tier: 3, column: 3 },
    { productId: "pylon-pl-granule", shelfId: "6A-2", tier: 5, column: 3 },
    { productId: "pabron-s-cough", shelfId: "6A-4", tier: 2, column: 2 },
    { productId: "mucodyne-pro500", shelfId: "6A-4", tier: 2, column: 6 },
    { productId: "stona-kyotan", shelfId: "6A-4", tier: 3, column: 6 },
    { productId: "ss-bron-ace-tab", shelfId: "6A-4", tier: 4, column: 7 },
    { productId: "medicon-pro", shelfId: "6A-4", tier: 5, column: 2 },
    { productId: "askuron", shelfId: "6A-4", tier: 5, column: 6 },
    { productId: "eve-quick-dx", shelfId: "6B-1", tier: 3, column: 3 },
    { productId: "bufferin-premium", shelfId: "6B-1", tier: 4, column: 7 },
    { productId: "excedrin-a", shelfId: "6B-1", tier: 5, column: 5 },
    { productId: "calonal-a", shelfId: "6B-2", tier: 3, column: 4 },
    { productId: "drewell-ex", shelfId: "6B-3", tier: 2, column: 5 },
    { productId: "dreamin-z", shelfId: "6B-3", tier: 3, column: 2 },
    { productId: "algard-gold-z", shelfId: "6B-4", tier: 4, column: 2 },
    { productId: "colgen-film-alpha", shelfId: "6B-4", tier: 4, column: 6 },
    { productId: "stona-rhini-z-gel", shelfId: "6B-5", tier: 4, column: 6 },
    { productId: "jikinin-bien-ag", shelfId: "6B-5", tier: 5, column: 2 },
  ] satisfies ShelfLocation[],
};

export type MockStore = typeof MOCK_STORE;
