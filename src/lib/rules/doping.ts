import { DOPING_ENTRIES, type DopingEntry } from "@/data/doping_list";
import { normalizeName } from "@/lib/rules/normalize";
import type { Product } from "@/lib/schema/product";

export type DopingHit = { ingredient: string; entry: DopingEntry };

// 禁止表に載る成分を含むかの照合だけを行う。使ってよいかは判定しない（rules §4.5-3）
export function checkDoping(product: Product): DopingHit[] {
  const hits: DopingHit[] = [];
  for (const fact of product.facts) {
    const name = normalizeName(fact.ingredient);
    const entries = DOPING_ENTRIES.filter((e) => name.includes(normalizeName(e.name)));
    if (!entries.length) continue;
    const entry = entries.reduce((a, b) => (b.name.length > a.name.length ? b : a));
    hits.push({ ingredient: fact.ingredient, entry });
  }
  return hits;
}
