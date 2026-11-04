import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_PRODUCTS, demoSku } from "@/data/demo_products";
import { withResearchedAmounts } from "@/data/ingredient_amounts";
import { PRODUCT_DOSAGE, type ProductDosage } from "@/data/product_dosage";
import { MOCK_STORE, sectionAt, type Shelf, type ShelfLocation } from "@/data/mock_store";
import { SHELF_LOCATIONS } from "@/data/shelf_stock";
import { NOTICE_GROUPS, NOTICE_ITEMS } from "@/data/notices";
import {
  noticeGroupFromRow,
  noticeItemFromRow,
  productFromRow,
  type NoticeGroupRow,
  type NoticeItemRow,
  type ProductRow,
  type ShelfLocationRow,
} from "@/lib/db/rows";
import { checkAbuse, type AbuseResult } from "@/lib/rules/abuse";
import { deriveBadges, unrecordedKinds, type Badge } from "@/lib/rules/badges";
import { normalizeName } from "@/lib/rules/normalize";
import type { DemoSku } from "@/lib/schema/demoSku";
import type { NoticeGroup, NoticeItem, ProductBadgeKind } from "@/lib/schema/notice";
import type { Product } from "@/lib/schema/product";

// データの読み出し口。SUPABASE_URL があれば Supabase（T003）から、なければ src/data の静的データから読む。
// 商品は数十件なので、まとめて読んで少しのあいだ持っておく。

type Catalog = {
  products: Product[];
  groups: NoticeGroup[];
  items: NoticeItem[];
  locations: ShelfLocation[];
};

// 分量の調査結果は、静的データ・Supabase のどちらから読んでも同じように補う（L-20261104-13）
const STATIC_CATALOG: Catalog = {
  products: DEMO_PRODUCTS.map(withResearchedAmounts),
  groups: NOTICE_GROUPS,
  items: NOTICE_ITEMS,
  locations: SHELF_LOCATIONS,
};

const CACHE_MS = 60_000;
let cached: { at: number; catalog: Promise<Catalog> } | null = null;

function getCatalog(): Promise<Catalog> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Promise.resolve(STATIC_CATALOG);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.catalog;
  const catalog = loadFromSupabase(url, key);
  cached = { at: Date.now(), catalog };
  // 失敗した読み出しは持たず、次の呼び出しで読み直す
  catalog.catch(() => (cached = null));
  return catalog;
}

// Supabase は1回の読み出しを1000行で切る。通知の項目は1000行を超えるので（L-20261104-16）、1000行ずつ続けて読む
const PAGE = 1000;

async function noticeItemRows(db: SupabaseClient) {
  const rows: NoticeItemRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const page = await db
      .from("notice_items")
      .select("*")
      .order("group_id")
      .order("position")
      .range(from, from + PAGE - 1);
    if (page.error) return page;
    rows.push(...(page.data as NoticeItemRow[]));
    if (page.data.length < PAGE) return { data: rows, error: null };
  }
}

async function loadFromSupabase(url: string, key: string): Promise<Catalog> {
  const db = createClient(url, key, { auth: { persistSession: false } });
  const [products, groups, items, locations] = await Promise.all([
    db.from("products").select("*, product_facts(*)"),
    db.from("notice_groups").select("*"),
    noticeItemRows(db),
    db.from("shelf_locations").select("*").eq("store_id", MOCK_STORE.id),
  ]);
  for (const result of [products, groups, items, locations])
    if (result.error) throw new Error(`Supabase の読み出しに失敗：${result.error.message}`);
  return {
    products: (products.data as ProductRow[]).map(productFromRow).map(withResearchedAmounts),
    groups: (groups.data as NoticeGroupRow[]).map(noticeGroupFromRow),
    items: (items.data as NoticeItemRow[]).map(noticeItemFromRow),
    locations: (locations.data as ShelfLocationRow[]).map((row) => ({
      productId: row.product_id,
      shelfId: row.shelf_id,
      tier: row.tier,
      column: row.column,
    })),
  };
}

export async function findByJan(jan: string): Promise<Product | null> {
  const { products } = await getCatalog();
  return products.find((p) => p.jan === jan) ?? null;
}

export async function findById(id: string): Promise<Product | null> {
  const { products } = await getCatalog();
  return products.find((p) => p.id === id) ?? null;
}

// 品名・メーカーの部分一致。結果は品名順（順位ではない）
export async function searchByName(query: string): Promise<Product[]> {
  const q = normalizeName(query);
  if (!q) return [];
  const { products } = await getCatalog();
  return byName(products.filter((p) => normalizeName(`${p.name}${p.maker}`).includes(q)));
}

export async function allProducts(): Promise<Product[]> {
  const { products } = await getCatalog();
  return byName([...products]);
}

export function byName(products: Product[]): Product[] {
  return products.sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

export type LocatedShelf = ShelfLocation & { shelf: Shelf; areaLabel: string };

function locate(catalog: Catalog, productId: string): LocatedShelf | null {
  const loc = catalog.locations.find((l) => l.productId === productId);
  const shelf = loc && MOCK_STORE.shelves.find((s) => s.id === loc.shelfId);
  if (!loc || !shelf) return null;
  // 1本を段で分け合う棚では、その段の売場名
  return { ...loc, shelf, areaLabel: sectionAt(shelf, loc.tier).name };
}

export async function locationOf(productId: string): Promise<LocatedShelf | null> {
  return locate(await getCatalog(), productId);
}

// 指定した棚に置かれている商品（棚の正面図に描く）
export async function shelfOccupants(
  shelfIds: Set<string>,
): Promise<(ShelfLocation & { product: Product })[]> {
  const catalog = await getCatalog();
  return catalog.locations
    .filter((l) => shelfIds.has(l.shelfId))
    .flatMap((l) => {
      const product = catalog.products.find((p) => p.id === l.productId);
      return product ? [{ ...l, product }] : [];
    });
}

export type ProductView = {
  product: Product;
  badges: Badge[];
  abuse: AbuseResult;
  group: NoticeGroup | null;
  // この商品の薬効群の通知（使用上の注意）を取り込み済みか。false なら通知由来のバッジは「未収録」
  noticeLoaded: boolean;
  // 「該当なし」ではなく「未収録」と出す通知由来の種類（未取り込みの薬効群・添付文書による補正で表せない記載）
  unrecorded: ProductBadgeKind[];
  location: LocatedShelf | null;
  sku: DemoSku | null;
  // 用法・用量の表（年齢区分・1回量・回数の値）。取り出せない品は null（L-20261104-22）
  dosage: ProductDosage | null;
};

export async function productViews(products: Product[]): Promise<ProductView[]> {
  const catalog = await getCatalog();
  return products.map((product) => {
    const sku = demoSku(product.id);
    const noticeLoaded = catalog.items.some((i) => i.groupId === product.noticeGroupId);
    // 禁止表バッジは 2026年版との照合で出す（L-20261104-18）。既存データの区分（年版不明、コデイン類を S7 とする等）は使わない
    const badges = deriveBadges(product, catalog.items);
    return {
      product,
      badges,
      abuse: checkAbuse(product),
      group: catalog.groups.find((g) => g.id === product.noticeGroupId) ?? null,
      noticeLoaded,
      unrecorded: unrecordedKinds(product, noticeLoaded),
      location: locate(catalog, product.id),
      sku,
      dosage: PRODUCT_DOSAGE[product.id] ?? null,
    };
  });
}

// 質問エージェント（L-20261103-43）が根拠を集めるときに使う、通知の薬効群と項目
export async function noticeCatalog(): Promise<{ groups: NoticeGroup[]; items: NoticeItem[] }> {
  const { groups, items } = await getCatalog();
  return { groups, items };
}

export async function productView(product: Product): Promise<ProductView> {
  const [view] = await productViews([product]);
  return view;
}
