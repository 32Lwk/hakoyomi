import skus from "@/data/demoSkus.json";
import { DemoSku } from "@/lib/schema/demoSku";
import { Product } from "@/lib/schema/product";

// デモSKU（L-40）。実在の商品で、事実はゆうの既存データ資産から絞り込み、分量・内容量は公開情報で補った値。
// ゆうが実物で確認するまで verifiedOn は null（画面に「未確認」と出る）。作り方は README の「データ方針」
export const DEMO_SKUS: DemoSku[] = skus.map((s) => DemoSku.parse(s));

export const DEMO_PRODUCTS: Product[] = DEMO_SKUS.map((s) => Product.parse(s));

export function demoSku(id: string): DemoSku | null {
  return DEMO_SKUS.find((s) => s.id === id) ?? null;
}
