import { DEMO_PRODUCTS } from "@/data/demo_products";
import { MOCK_STORE, type Shelf, type ShelfLocation } from "@/data/mock_store";
import { KAZE_GROUP, KAZE_ITEMS } from "@/data/notice_kaze";
import { checkAbuse, type AbuseResult } from "@/lib/rules/abuse";
import { deriveBadges, type Badge } from "@/lib/rules/badges";
import { normalizeName } from "@/lib/rules/normalize";
import type { NoticeGroup, NoticeItem } from "@/lib/schema/notice";
import type { Product } from "@/lib/schema/product";

// データの読み出し口。T003 で Supabase に置き換えても、呼び出し側は変えない。
// いまは架空の商品・架空の店舗と、通知かぜ薬Ⅰの抜粋だけを持つ。

const NOTICE_GROUPS: NoticeGroup[] = [KAZE_GROUP];
const NOTICE_ITEMS: NoticeItem[] = KAZE_ITEMS;

export function findByJan(jan: string): Product | null {
  return DEMO_PRODUCTS.find((p) => p.jan === jan) ?? null;
}

export function findById(id: string): Product | null {
  return DEMO_PRODUCTS.find((p) => p.id === id) ?? null;
}

// 品名・メーカーの部分一致。結果は品名順（順位ではない）
export function searchByName(query: string): Product[] {
  const q = normalizeName(query);
  if (!q) return [];
  return byName(DEMO_PRODUCTS.filter((p) => normalizeName(`${p.name}${p.maker}`).includes(q)));
}

export function allProducts(): Product[] {
  return byName([...DEMO_PRODUCTS]);
}

export function byName(products: Product[]): Product[] {
  return products.sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

export function noticeGroup(id: string): NoticeGroup | null {
  return NOTICE_GROUPS.find((g) => g.id === id) ?? null;
}

export type LocatedShelf = ShelfLocation & { shelf: Shelf; areaLabel: string };

export function locationOf(productId: string): LocatedShelf | null {
  const loc = MOCK_STORE.locations.find((l) => l.productId === productId);
  const shelf = loc && MOCK_STORE.shelves.find((s) => s.id === loc.shelfId);
  if (!loc || !shelf) return null;
  return { ...loc, shelf, areaLabel: shelf.category };
}

export type ProductView = {
  product: Product;
  badges: Badge[];
  abuse: AbuseResult;
  group: NoticeGroup | null;
  location: LocatedShelf | null;
};

export function productView(product: Product): ProductView {
  return {
    product,
    badges: deriveBadges(product, NOTICE_ITEMS),
    abuse: checkAbuse(product),
    group: noticeGroup(product.noticeGroupId),
    location: locationOf(product.id),
  };
}
