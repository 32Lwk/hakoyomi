import { describe, expect, it } from "vitest";
import { halalFacts } from "@/data/additives";
import { DEMO_PRODUCTS } from "@/data/demo_products";
import { checkDoping, dopingListCurrent, routeOf } from "@/lib/rules/doping";

const byName = (name: string) => {
  const p = DEMO_PRODUCTS.find((x) => x.name === name);
  if (!p) throw new Error(`no product: ${name}`);
  return p;
};

describe("ハラール関連の成分（L-20261104-18）", () => {
  it("名前に「アルコール」を含む別の物質はエタノールとしない", () => {
    for (const p of DEMO_PRODUCTS) {
      for (const n of halalFacts(p).ethanol)
        expect(n, p.name).not.toMatch(
          /ステアリル|ベンジル|ポリビニル|フェニルエチル|セト|ベヘニル|糖/,
        );
    }
  });

  it("ゼラチン・エタノールを含む品を拾う", () => {
    const all = DEMO_PRODUCTS.map((p) => ({ name: p.name, ...halalFacts(p) }));
    expect(all.filter((p) => p.animal.length).length).toBeGreaterThan(10);
    expect(all.filter((p) => p.ethanol.length).length).toBeGreaterThan(10);
  });
});

describe("ドーピング 2026年版（L-20261104-18）", () => {
  it("年版は 2026-12-31 まで有効で、2027年からは確認中に戻る", () => {
    expect(dopingListCurrent(new Date("2026-11-04"))).toBe(true);
    expect(dopingListCurrent(new Date("2027-01-01"))).toBe(false);
  });

  it("点鼻・点眼のイミダゾリンは対象外、坐剤のステロイド・イミダゾリンは禁止", () => {
    for (const p of DEMO_PRODUCTS.filter((x) => x.kind === "eye" || x.kind === "nasal")) {
      for (const h of checkDoping(p).filter((x) => x.entry.route !== "any"))
        expect(h.status, `${p.name} ${h.ingredient}`).toBe("local");
    }
    const suppository = byName("プリザエース坐剤T");
    expect(routeOf(suppository)).toBe("rectal");
    expect(checkDoping(suppository).every((h) => h.status === "prohibited")).toBe(true);
  });

  it("口内炎のトリアムシノロンは口の中の使用で禁止に当たる", () => {
    const p = byName("口内炎軟膏大正クイックケア");
    expect(routeOf(p)).toBe("oromucosal");
    expect(checkDoping(p).map((h) => h.status)).toEqual(["prohibited"]);
  });
});
