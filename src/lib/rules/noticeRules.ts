import type { Condition, NoticeItem } from "@/lib/schema/notice";
import type { Product, ProductFact } from "@/lib/schema/product";
import { normalizeName, sameName, toMg } from "@/lib/rules/normalize";

// 「○○として」の換算係数（換算先 → 成分 → 係数）。
// カフェイン水和物は分子量比（194.19/212.21）。安息香酸ナトリウムカフェインは日本薬局方のカフェイン含量 48.0〜50.0% の上限で置く【要確認：ゆう】
const CONVERSIONS: Record<string, Record<string, number>> = {
  [normalizeName("無水カフェイン")]: {
    [normalizeName("無水カフェイン")]: 1,
    [normalizeName("カフェイン水和物")]: 0.915,
    [normalizeName("安息香酸ナトリウムカフェイン")]: 0.5,
  },
};

export type Match = {
  // 条件に当たった成分
  ingredients: string[];
};

function usableFacts(product: Product): ProductFact[] {
  // 未検証の値はバッジの導出に使わない（rules §4-8）
  return product.facts.filter((fact) => !fact.uncertain);
}

// 条件を評価し、当たったときは根拠の成分を返す。当たらなければ null
export function evaluate(condition: Condition, product: Product): Match | null {
  const facts = usableFacts(product);

  if ("always" in condition) return { ingredients: [] };

  if ("hasIngredient" in condition) {
    const hit = facts.filter((f) => condition.hasIngredient.some((n) => sameName(n, f.ingredient)));
    return hit.length ? { ingredients: hit.map((f) => f.ingredient) } : null;
  }

  if ("hasClass" in condition) {
    const hit = facts.filter((f) =>
      f.ingredientClasses.some((c) => condition.hasClass.some((n) => sameName(n, c))),
    );
    return hit.length ? { ingredients: hit.map((f) => f.ingredient) } : null;
  }

  if ("amountAtLeast" in condition) {
    const { ingredients, as, value, unit, per } = condition.amountAtLeast;
    const hit = facts.filter((f) => ingredients.some((n) => sameName(n, f.ingredient)));
    const amount = convertedMg(product, hit, as, per);
    if (amount === null) return null;
    const threshold = toMg(value, unit) ?? value;
    return amount >= threshold ? { ingredients: hit.map((f) => f.ingredient) } : null;
  }

  if ("all" in condition) {
    const matches = condition.all.map((c) => evaluate(c, product));
    if (matches.some((m) => m === null)) return null;
    return { ingredients: unique(matches.flatMap((m) => m?.ingredients ?? [])) };
  }

  if ("any" in condition) {
    const matches = condition.any.map((c) => evaluate(c, product)).filter((m) => m !== null);
    return matches.length ? { ingredients: unique(matches.flatMap((m) => m.ingredients)) } : null;
  }

  // not：当たらないときに成立。根拠の成分はない
  return evaluate(condition.not, product) ? null : { ingredients: [] };
}

// 成分の分量を mg にそろえて合計する。as があれば換算する。分量が欠けていれば null
export function convertedMg(
  product: Product,
  facts: ProductFact[],
  as: string | undefined,
  per: "1回" | "1日",
): number | null {
  if (!facts.length) return null;
  const factors = as ? CONVERSIONS[normalizeName(as)] : undefined;
  let totalMg = 0;
  for (const fact of facts) {
    if (fact.amountPerDay === null || fact.unit === null) return null;
    const mg = toMg(fact.amountPerDay, fact.unit);
    if (mg === null) return null;
    const factor = factors ? factors[normalizeName(fact.ingredient)] : 1;
    if (factor === undefined) return null;
    totalMg += mg * factor;
  }
  return per === "1回" ? totalMg / product.timesPerDay : totalMg;
}

export type AppliedItem = {
  item: NoticeItem;
  matched: string[];
};

// 商品の薬効群の項目のうち、記載条件に当たるものを返す。「ただし…記載しない」の除外も反映する
export function applicableItems(product: Product, items: NoticeItem[]): AppliedItem[] {
  const own = items.filter((item) => item.groupId === product.noticeGroupId);
  const hits = new Map<string, AppliedItem>();
  for (const item of own) {
    const match = evaluate(item.condition, product);
    if (match) hits.set(item.id, { item, matched: match.ingredients });
  }
  return [...hits.values()].filter(({ item }) => !item.excludedBy.some((id) => hits.has(id)));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
