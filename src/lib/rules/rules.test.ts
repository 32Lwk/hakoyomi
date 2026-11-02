import { describe, expect, it } from "vitest";
import { checkAbuse, isMultiple } from "@/lib/rules/abuse";
import { deriveBadges } from "@/lib/rules/badges";
import { checkDoping } from "@/lib/rules/doping";
import { KAZE_ITEMS, productA, productB } from "@/lib/rules/fixtures";
import { applicableItems } from "@/lib/rules/noticeRules";
import { Product } from "@/lib/schema/product";

const ids = (product: Product) => applicableItems(product, KAZE_ITEMS).map((a) => a.item.id);

describe("通知ルールの評価", () => {
  it("商品Aは運転・授乳（してはいけない）・12歳未満・飲酒に当たり、授乳の相談は除外される", () => {
    expect(ids(productA).sort()).toEqual(
      ["kaze_1-ng-1-4", "kaze_1-ng-3", "kaze_1-ng-4", "kaze_1-ng-5"].sort(),
    );
  });

  it("商品Bは15歳未満と授乳の相談に当たる", () => {
    expect(ids(productB).sort()).toEqual(["kaze_1-ng-1-3", "kaze_1-ng-5", "kaze_1-sd-1-3"].sort());
  });

  it("根拠の成分を返す", () => {
    const drive = applicableItems(productA, KAZE_ITEMS).find((a) => a.item.id === "kaze_1-ng-3");
    expect(drive?.matched).toEqual(
      expect.arrayContaining(["ジヒドロコデインリン酸塩", "クロルフェニラミンマレイン酸塩"]),
    );
  });

  it("全角の「dl－」を半角と同じ成分として扱う", () => {
    const p = Product.parse({
      ...productB,
      facts: [{ ingredient: "dl-メチルエフェドリン塩酸塩", amountPerDay: 60, unit: "mg" }],
    });
    expect(ids(p)).toContain("kaze_1-sd-1-3");
  });

  it("未検証の値はバッジの導出に使わない", () => {
    const p = Product.parse({
      ...productA,
      facts: productA.facts.map((f) => ({ ...f, uncertain: true })),
    });
    expect(ids(p)).toEqual(["kaze_1-ng-5"]);
  });

  it("カフェインは無水カフェインに換算して1回100mg以上で授乳の相談に当たる", () => {
    const caffeineOnly = (amountPerDay: number) =>
      Product.parse({
        ...productB,
        facts: [{ ingredient: "カフェイン水和物", amountPerDay, unit: "mg" }],
      });
    // 330mg × 0.915 ÷ 3回 ≒ 100.6mg、300mg なら 91.5mg
    expect(ids(caffeineOnly(330))).toContain("kaze_1-sd-1-3");
    expect(ids(caffeineOnly(300))).not.toContain("kaze_1-sd-1-3");
  });

  it("但し書き：15歳未満を記載する製剤には12歳未満を記載しない", () => {
    const p = Product.parse({
      ...productA,
      facts: [...productA.facts, { ingredient: "イブプロフェン", amountPerDay: 450, unit: "mg" }],
    });
    expect(ids(p)).toContain("kaze_1-ng-1-3");
    expect(ids(p)).not.toContain("kaze_1-ng-1-4");
  });
});

describe("指定濫用防止", () => {
  it("商品Aは対象。コデインをメチルエフェドリンと取り違えず、かぜ薬の効能で7日分基準", () => {
    const result = checkAbuse(productA);
    expect(result.target).toBe(true);
    if (!result.target) return;
    expect(result.hits.map((h) => h.listed).sort()).toEqual(
      ["ジヒドロコデイン", "メチルエフェドリン"].sort(),
    );
    expect(result.limitDays).toBe(7);
    expect(result.large).toBe(false);
  });

  it("かぜ薬の効能がなければ5日分基準で、超えれば大容量", () => {
    const p = Product.parse({ ...productA, efficacyGroups: ["鎮咳去痰薬"], contentQty: 54 });
    const result = checkAbuse(p);
    expect(result.target && result.limitDays).toBe(5);
    expect(result.target && result.large).toBe(true);
  });

  it("外用剤と生薬主体の製剤は対象外", () => {
    expect(checkAbuse(Product.parse({ ...productA, route: "external" }))).toEqual({
      target: false,
      reason: "external",
    });
    expect(checkAbuse(Product.parse({ ...productA, crudeDrugMain: true }))).toEqual({
      target: false,
      reason: "crude_drug_main",
    });
  });

  it("対象成分がなければ対象外", () => {
    expect(checkAbuse(productB)).toEqual({ target: false, reason: "no_ingredient" });
  });

  it("同じ指定成分を含む別の商品を1個ずつでも複数個に当たる", () => {
    const other = Product.parse({
      ...productB,
      id: "test-c",
      facts: [{ ingredient: "dl-メチルエフェドリン塩酸塩", amountPerDay: 60, unit: "mg" }],
    });
    expect(isMultiple([{ product: productA, quantity: 1 }])).toBe(false);
    expect(isMultiple([{ product: productA, quantity: 2 }])).toBe(true);
    expect(
      isMultiple([
        { product: productA, quantity: 1 },
        { product: other, quantity: 1 },
      ]),
    ).toBe(true);
    expect(
      isMultiple([
        { product: productA, quantity: 1 },
        { product: productB, quantity: 1 },
      ]),
    ).toBe(false);
  });
});

describe("禁止表の照合", () => {
  it("メチルエフェドリンを拾い、エフェドリンと二重に数えない", () => {
    const hits = checkDoping(productA);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.entry.name).toBe("メチルエフェドリン");
  });

  it("該当しなければ空", () => {
    expect(checkDoping(productB)).toEqual([]);
  });
});

describe("バッジ", () => {
  it("商品Aのバッジは制度→通知→成分の順", () => {
    expect(deriveBadges(productA, KAZE_ITEMS).map((b) => b.label)).toEqual([
      "濫用防止 対象",
      "運転注意",
      "授乳中は服用しない",
      "12歳未満 服用しない",
      "飲酒しない",
      "カフェイン 1回25mg",
      "禁止表成分（年版確認中）",
    ]);
  });

  it("商品Bは授乳を「相談」で出し、カフェインは無水換算", () => {
    const labels = deriveBadges(productB, KAZE_ITEMS).map((b) => b.label);
    expect(labels).toEqual([
      "授乳中は相談",
      "15歳未満 服用しない",
      "飲酒しない",
      "カフェイン 1回109.8mg",
    ]);
  });

  it("通知由来のバッジは根拠に通知の項目と記載条件を持つ", () => {
    const drive = deriveBadges(productA, KAZE_ITEMS).find((b) => b.kind === "drive");
    expect(drive?.evidence[0]).toMatchObject({
      kind: "notice",
      section: "してはいけないこと",
      itemNo: "3.",
    });
  });
});
