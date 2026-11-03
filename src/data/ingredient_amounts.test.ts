import { describe, expect, it } from "vitest";
import { DEMO_PRODUCTS } from "@/data/demo_products";
import { withResearchedAmounts } from "@/data/ingredient_amounts";
import { factAmountText } from "@/lib/compare";
import type { ProductFact } from "@/lib/schema/product";

const base: ProductFact = {
  ingredient: "成分",
  ingredientClasses: [],
  amountPerDay: null,
  unit: null,
  uncertain: false,
};

describe("factAmountText", () => {
  it("1日量・濃度・以下／相当を出す", () => {
    expect(factAmountText({ ...base, amountPerDay: 900, unit: "mg" })).toBe("900mg");
    expect(factAmountText({ ...base, amountPerDay: 0.9, unit: "mL", qualifier: "以下" })).toBe(
      "0.9mL以下",
    );
    expect(
      factAmountText({ ...base, concentration: { amount: 30, unit: "mg", basis: "100mL中" } }),
    ).toBe("100mL中 30mg");
    expect(
      factAmountText({ ...base, concentration: { amount: 0.03, unit: "%", basis: "濃度" } }),
    ).toBe("0.03%");
    expect(factAmountText(base)).toBe("不明");
  });
});

describe("withResearchedAmounts", () => {
  it("調査で補ったあと、分量も濃度もない成分は残らない", () => {
    const left = DEMO_PRODUCTS.map(withResearchedAmounts).flatMap((p) =>
      p.facts
        .filter((f) => (f.amountPerDay === null || f.unit === null) && !f.concentration)
        .map((f) => `${p.name}：${f.ingredient}`),
    );
    expect(left).toEqual([]);
  });

  it("入力済みの分量は上書きしない", () => {
    for (const p of DEMO_PRODUCTS) {
      const filled = withResearchedAmounts(p);
      p.facts.forEach((f, i) => {
        if (f.amountPerDay !== null && f.unit !== null) expect(filled.facts[i]).toEqual(f);
      });
    }
  });
});
