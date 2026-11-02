import {
  LABEL_CORRECTIONS,
  type CorrectionTarget,
  type LabelCorrection,
} from "@/data/label_corrections";
import { evaluate } from "@/lib/rules/noticeRules";
import { sameName } from "@/lib/rules/normalize";
import type { Product } from "@/lib/schema/product";

// 添付文書による補正（src/data/label_corrections.ts）を商品に当てる（L-20261103-28）

// 当たれば根拠の成分（商品で当てたときは空）、当たらなければ null
function matchTarget(target: CorrectionTarget, product: Product): string[] | null {
  if ("productIds" in target) return target.productIds.includes(product.id) ? [] : null;
  if ("onlyIngredients" in target) {
    const ok =
      product.facts.length > 0 &&
      product.facts.every((f) => target.onlyIngredients.some((n) => sameName(n, f.ingredient)));
    return ok ? product.facts.map((f) => f.ingredient) : null;
  }
  return evaluate(target.condition, product)?.ingredients ?? null;
}

export type AppliedCorrection = { correction: LabelCorrection; matched: string[] };

// 商品の薬効群の補正のうち、当たるもの
export function correctionsFor(
  product: Product,
  corrections: LabelCorrection[] = LABEL_CORRECTIONS,
): AppliedCorrection[] {
  return corrections
    .filter((c) => c.groupId === product.noticeGroupId)
    .flatMap((correction) => {
      const matched = matchTarget(correction.target, product);
      return matched ? [{ correction, matched }] : [];
    });
}
