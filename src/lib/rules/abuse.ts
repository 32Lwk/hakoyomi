import { ABUSE_INGREDIENTS, type AbuseIngredient } from "@/data/abuse_ingredients";
import { normalizeName } from "@/lib/rules/normalize";
import type { Product } from "@/lib/schema/product";

export type AbuseHit = {
  // 商品の成分名（塩類・水和物を含む表記のまま）
  ingredient: string;
  // 告示の成分名
  listed: string;
  // 1包装あたりの上限日数（5 または 7）
  limitDays: number;
};

export type AbuseResult =
  | { target: false; reason: "no_ingredient" | "external" | "crude_drug_main" }
  | {
      target: true;
      hits: AbuseHit[];
      days: number;
      limitDays: number;
      large: boolean;
    };

// 成分名に含まれる告示成分のうち、いちばん長い名前を採る（「メチルエフェドリン」を「エフェドリン」と数えない）
function listedIngredient(ingredient: string): AbuseIngredient | null {
  const name = normalizeName(ingredient);
  const hits = ABUSE_INGREDIENTS.filter((a) => name.includes(normalizeName(a.name)));
  if (!hits.length) return null;
  return hits.reduce((a, b) => (b.name.length > a.name.length ? b : a));
}

export function checkAbuse(product: Product): AbuseResult {
  const hits: AbuseHit[] = [];
  for (const fact of product.facts) {
    const listed = listedIngredient(fact.ingredient);
    if (!listed) continue;
    const seven = listed.sevenDayEfficacies.some((e) => product.efficacyGroups.includes(e));
    hits.push({ ingredient: fact.ingredient, listed: listed.name, limitDays: seven ? 7 : 5 });
  }

  if (!hits.length) return { target: false, reason: "no_ingredient" };
  // 1日の最大量が null なのは外用だけ（スキーマで保証）
  if (product.route === "external" || product.dailyMaxUnits === null)
    return { target: false, reason: "external" };
  if (product.crudeDrugMain) return { target: false, reason: "crude_drug_main" };

  // 対象成分が複数あるときは短いほうの日数（5日優先）で判定する（L-20261104-25 確定）
  const limitDays = Math.min(...hits.map((h) => h.limitDays));
  const days = product.contentQty / product.dailyMaxUnits;
  return { target: true, hits, days, limitDays, large: days > limitDays };
}

export type CartLine = { product: Product; quantity: number };

export type AbuseOverlap = {
  // 告示の指定成分名
  listed: string;
  // 合算した個数
  count: number;
  // 含まれる商品名（入力順・重複なし）
  productNames: string[];
};

// 複数個に該当する指定成分の内訳（同じ商品を2個以上、または同じ指定成分を含む別の商品を合わせて2個以上。医薬発1226第16号 第4-1(5)）
export function multipleOverlaps(lines: CartLine[]): AbuseOverlap[] {
  const byListed = new Map<string, { count: number; names: Set<string> }>();
  for (const { product, quantity } of lines) {
    if (quantity <= 0) continue;
    const result = checkAbuse(product);
    if (!result.target) continue;
    for (const listed of new Set(result.hits.map((h) => h.listed))) {
      const entry = byListed.get(listed) ?? { count: 0, names: new Set<string>() };
      entry.count += quantity;
      entry.names.add(product.name);
      byListed.set(listed, entry);
    }
  }
  return [...byListed.entries()]
    .filter(([, v]) => v.count >= 2)
    .map(([listed, v]) => ({ listed, count: v.count, productNames: [...v.names] }));
}

// 複数個の判定：同じ商品を2個以上、または同じ指定成分を含む別の商品を合わせて2個以上（医薬発1226第16号 第4-1(5)）
export function isMultiple(lines: CartLine[]): boolean {
  return multipleOverlaps(lines).length > 0;
}
