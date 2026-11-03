import amounts from "@/data/ingredient_amounts.json";
import { normalizeName } from "@/lib/rules/normalize";
import { ProductFact, type Product } from "@/lib/schema/product";

// 分量の調査結果（L-20261104-13）。demoSkus.json で分量のない成分を、出典つきで補う上書き表。
// 作り方：scripts/research/build_ingredient_amounts.py（調査は data/research/、公開リポの外）。
// 出典は KEGG MEDICUS とメーカー公式。箱で確かめるまでは画面に「未確認」（verifiedOn が null）のまま
const ENTRIES = amounts.map((e) => ({
  productId: e.productId,
  key: normalizeName(e.ingredient),
  fact: ProductFact.partial().parse({
    amountPerDay: e.amountPerDay,
    unit: e.unit,
    qualifier: e.qualifier,
    concentration: e.concentration,
    uncertain: e.uncertain,
    source: e.source,
  }),
}));

// 分量のない成分だけを補う（入力済みの値は上書きしない）
export function withResearchedAmounts(product: Product): Product {
  const own = ENTRIES.filter((e) => e.productId === product.id);
  if (!own.length) return product;
  return {
    ...product,
    facts: product.facts.map((f) => {
      if (f.amountPerDay !== null && f.unit !== null) return f;
      const hit = own.find((e) => e.key === normalizeName(f.ingredient));
      return hit ? { ...f, ...hit.fact, ingredient: f.ingredient } : f;
    }),
  };
}
