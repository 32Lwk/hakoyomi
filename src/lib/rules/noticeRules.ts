import type { Condition, NoticeItem } from "@/lib/schema/notice";
import type { Product, ProductFact } from "@/lib/schema/product";
import { normalizeName, sameName, toMg } from "@/lib/rules/normalize";
import { INGREDIENT_CLASSES } from "@/data/ingredient_classes";
import { PRODUCT_USAGE } from "@/data/product_usage";

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
  // 未検証の分量はバッジの導出に使わない（rules §4-8）。uncertain は分量が見つからない・出典の確かさが低い印で、
  // 成分が入っていること（既存データの成分欄）は確かめてある。成分の有無の条件にはすべての成分を使う（L-20261104-16）
  return product.facts.filter((fact) => !fact.uncertain);
}

// 成分の成分群：入力値の分類と、成分群の表（src/data/ingredient_classes）
function classesOf(fact: ProductFact): string[] {
  const listed = Object.entries(INGREDIENT_CLASSES)
    .filter(([, members]) => members.some((m) => sameName(m, fact.ingredient)))
    .map(([name]) => name);
  return [...fact.ingredientClasses, ...listed];
}

// 剤形の上位の呼び方。通知は「貼付剤」「塗布剤」とまとめて書くことがある
const FORM_FAMILY: Record<string, string[]> = {
  テープ剤: ["貼付剤"],
  パップ剤: ["貼付剤"],
  クリーム剤: ["塗布剤"],
  ゲル剤: ["塗布剤"],
  外用液剤: ["塗布剤"],
  // 外用痔疾用薬の通知の「注入の用法をもつ軟膏剤」
  注入軟膏剤: ["軟膏剤"],
};

// 通知の成分名の書き方「dl－（d－）クロルフェニラミンマレイン酸塩」「メチルエフェドリン塩類」
// 「フルスルチアミン及びその塩類」を、入力値の成分名と照合できるようにする（L-20261104-20）
function namesMatch(noticeName: string, ingredient: string): boolean {
  const n = normalizeName(noticeName);
  const isomers = n.match(/^((?:dl|d|l)-)\((?:dl|d|l)-\)(.+)$/);
  if (isomers) return ["dl-", "d-", ""].some((p) => sameName(`${p}${isomers[2]}`, ingredient));
  const stem = n.match(/^(.+?)(?:及びその)?塩類$/);
  if (stem) return normalizeName(ingredient).includes(stem[1]);
  return sameName(noticeName, ingredient);
}

// 剤形・用法の年齢を見る条件で、商品にその値がないか（not の中で「当たらない」を事実として使わない）
function usageUnknown(condition: Condition, product: Product): boolean {
  const usage = PRODUCT_USAGE[product.id];
  if ("dosageForm" in condition) return !usage?.dosageForm;
  if ("usageUnderMonths" in condition) return usage?.usageFromMonths == null;
  if ("all" in condition) return condition.all.some((c) => usageUnknown(c, product));
  if ("any" in condition) return condition.any.some((c) => usageUnknown(c, product));
  if ("not" in condition) return usageUnknown(condition.not, product);
  return false;
}

// 条件を評価し、当たったときは根拠の成分を返す。当たらなければ null
export function evaluate(condition: Condition, product: Product): Match | null {
  const facts = product.facts;

  if ("always" in condition) return { ingredients: [] };

  if ("hasIngredient" in condition) {
    const hit = facts.filter((f) =>
      condition.hasIngredient.some((n) => namesMatch(n, f.ingredient)),
    );
    return hit.length ? { ingredients: hit.map((f) => f.ingredient) } : null;
  }

  if ("hasClass" in condition) {
    const hit = facts.filter((f) =>
      classesOf(f).some((c) => condition.hasClass.some((n) => sameName(n, c))),
    );
    return hit.length ? { ingredients: hit.map((f) => f.ingredient) } : null;
  }

  if ("amountAtLeast" in condition) {
    const { ingredients, as, value, unit, per } = condition.amountAtLeast;
    const hit = usableFacts(product).filter((f) =>
      ingredients.some((n) => namesMatch(n, f.ingredient)),
    );
    const amount = convertedMg(product, hit, as, per);
    if (amount === null) return null;
    const threshold = toMg(value, unit) ?? value;
    return amount >= threshold ? { ingredients: hit.map((f) => f.ingredient) } : null;
  }

  // 剤形・用法の年齢は商品の値がないときは当てない（推測しない）
  if ("dosageForm" in condition) {
    const form = PRODUCT_USAGE[product.id]?.dosageForm;
    const forms = form ? [form, ...(FORM_FAMILY[form] ?? [])] : [];
    return forms.some((f) => condition.dosageForm.includes(f)) ? { ingredients: [] } : null;
  }

  if ("usageUnderMonths" in condition) {
    const from = PRODUCT_USAGE[product.id]?.usageFromMonths;
    return from != null && from < condition.usageUnderMonths ? { ingredients: [] } : null;
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

  // not：当たらないときに成立。根拠の成分はない。剤形・年齢の値がない商品では「当たらない」と言えないので成立させない
  if (usageUnknown(condition.not, product)) return null;
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
  if (per === "1日") return totalMg;
  // 「1日数回」の外用は1回分量を出せない
  return product.timesPerDay === null ? null : totalMg / product.timesPerDay;
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
