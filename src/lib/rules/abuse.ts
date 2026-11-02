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
  if (product.route === "external") return { target: false, reason: "external" };
  if (product.crudeDrugMain) return { target: false, reason: "crude_drug_main" };

  // 対象成分が複数あるときは短いほうの日数で判定する【要確認：告示第33号の複数成分の扱い】
  const limitDays = Math.min(...hits.map((h) => h.limitDays));
  const days = product.contentQty / product.dailyMaxUnits;
  return { target: true, hits, days, limitDays, large: days > limitDays };
}

export type CartLine = { product: Product; quantity: number };

// 複数個の判定：同じ商品を2個以上、または同じ指定成分を含む別の商品を合わせて2個以上（医薬発1226第16号 第4-1(5)）
export function isMultiple(lines: CartLine[]): boolean {
  const countByListed = new Map<string, number>();
  for (const { product, quantity } of lines) {
    const result = checkAbuse(product);
    if (!result.target) continue;
    for (const listed of new Set(result.hits.map((h) => h.listed))) {
      countByListed.set(listed, (countByListed.get(listed) ?? 0) + quantity);
    }
  }
  return [...countByListed.values()].some((count) => count >= 2);
}
