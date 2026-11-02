import { describe, expect, it } from "vitest";
import { Product } from "@/lib/schema/product";
import { dailyMaxLabel, timesPerDayLabel } from "./dosage";
import { productA } from "./rules/fixtures";

const product = (patch: Partial<Product>): Product => Product.parse({ ...productA, ...patch });

describe("dosage", () => {
  it("数値があれば数値で出す", () => {
    const p = product({});
    expect(dailyMaxLabel(p)).toBe("9錠");
    expect(timesPerDayLabel(p)).toBe("3回");
  });

  it("外用で上限がない品は添付文書の表記を出す", () => {
    const p = product({
      route: "external",
      dailyMaxUnits: null,
      timesPerDay: null,
      dailyMaxText: "適量",
      timesPerDayText: "1日数回",
    });
    expect(dailyMaxLabel(p)).toBe("適量");
    expect(timesPerDayLabel(p)).toBe("1日数回");
  });

  it("null にできるのは外用で表記があるときだけ", () => {
    const base = productA;
    expect(() => Product.parse({ ...base, timesPerDay: null })).toThrow();
    expect(() =>
      Product.parse({ ...base, route: "external", timesPerDay: null, timesPerDayText: null }),
    ).toThrow();
    expect(
      Product.parse({ ...base, route: "external", timesPerDay: null, timesPerDayText: "1日数回" })
        .timesPerDay,
    ).toBeNull();
  });
});
