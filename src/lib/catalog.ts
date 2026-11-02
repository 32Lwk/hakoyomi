import "server-only";
import { createClient } from "@supabase/supabase-js";
import { DEMO_PRODUCTS } from "@/data/demo_products";
import { MOCK_STORE, type Shelf, type ShelfLocation } from "@/data/mock_store";
import { KAZE_GROUP, KAZE_ITEMS } from "@/data/notice_kaze";
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
import { deriveBadges, type Badge } from "@/lib/rules/badges";
import { normalizeName } from "@/lib/rules/normalize";
import type { NoticeGroup, NoticeItem } from "@/lib/schema/notice";
import type { Product } from "@/lib/schema/product";

// データの読み出し口。SUPABASE_URL があれば Supabase（T003）から、なければ src/data の静的データから読む。
// 商品は数十件なので、まとめて読んで少しのあいだ持っておく。

type Catalog = {
  products: Product[];
  groups: NoticeGroup[];
  items: NoticeItem[];
  locations: ShelfLocation[];
};

const STATIC_CATALOG: Catalog = {
  products: DEMO_PRODUCTS,
  groups: [KAZE_GROUP],
  items: KAZE_ITEMS,
  locations: MOCK_STORE.locations,
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

async function loadFromSupabase(url: string, key: string): Promise<Catalog> {
  const db = createClient(url, key, { auth: { persistSession: false } });
  const [products, groups, items, locations] = await Promise.all([
    db.from("products").select("*, product_facts(*)"),
    db.from("notice_groups").select("*"),
    db.from("notice_items").select("*").order("group_id").order("position"),
    db.from("shelf_locations").select("*").eq("store_id", MOCK_STORE.id),
  ]);
  for (const result of [products, groups, items, locations])
    if (result.error) throw new Error(`Supabase の読み出しに失敗：${result.error.message}`);
  return {
    products: (products.data as ProductRow[]).map(productFromRow),
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
  return { ...loc, shelf, areaLabel: shelf.category };
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
  location: LocatedShelf | null;
};

export async function productViews(products: Product[]): Promise<ProductView[]> {
  const catalog = await getCatalog();
  return products.map((product) => ({
    product,
    badges: deriveBadges(product, catalog.items),
    abuse: checkAbuse(product),
    group: catalog.groups.find((g) => g.id === product.noticeGroupId) ?? null,
    location: locate(catalog, product.id),
  }));
}

export async function productView(product: Product): Promise<ProductView> {
  const [view] = await productViews([product]);
  return view;
}
