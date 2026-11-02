import { z } from "zod";
import { Product } from "@/lib/schema/product";

// デモSKU（L-40）。商品の事実（Product）に、画面に出す写真・出典・禁止表の区分を足したもの。
// 効能・効果と用法・用量は商品固有の文面なので持たず、PMDA へリンクアウトする（rules §4-4）
export const DemoSku = Product.extend({
  imageUrl: z.string().url().nullable(),
  source: z.object({ label: z.string().min(1), url: z.string().url() }),
  quotes: z.object({
    efficacy: z.null(),
    ingredients: z.array(z.string().min(1)).min(1),
    dosage: z.null(),
  }),
  flags: z.object({
    // 眠気の注意につながる成分を含むか（成分名の照合。generate 時にコードで判定）
    drowsyMention: z.boolean(),
    // 既存データ（Medicine Recommend System）の「禁止物質あり」「競技会区分」の値。年版不明
    dopingRelated: z.boolean(),
    dopingClass: z.string().nullable(),
  }),
  // 分量・内容量を補った公開情報（ゆうの実物確認までは未確認として扱う）
  research: z.array(z.object({ label: z.string().min(1), url: z.string().url() })).default([]),
});
export type DemoSku = z.infer<typeof DemoSku>;
