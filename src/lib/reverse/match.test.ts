import { describe, expect, it } from "vitest";
import { DEMO_PRODUCTS } from "@/data/demo_products";
import { EFFICACY_MARKS, EFFICACY_STANDARDS } from "@/data/efficacy_standards";
import { findBanwords } from "@/lib/guard/banwords";
import { allTerms, keywordSelection, matchedTerms, resolve } from "@/lib/reverse/match";

describe("承認基準の効能・効果（L-20261103-41）", () => {
  it("語は原文の一部をそのまま切り出したもの", () => {
    for (const s of EFFICACY_STANDARDS) {
      for (const term of s.terms) expect(s.text, `${s.name}：${term.word}`).toContain(term.word);
      expect(new Set(s.terms.map((t) => t.id)).size, s.name).toBe(s.terms.length);
    }
  });

  it("どの承認基準にも、当たる商品がある", () => {
    const groups = new Set(DEMO_PRODUCTS.map((p) => p.noticeGroupId));
    for (const s of EFFICACY_STANDARDS) {
      expect(
        s.noticeGroupIds.some((g) => groups.has(g)),
        s.name,
      ).toBe(true);
    }
  });

  it("語に禁止語を含まない", () => {
    for (const t of allTerms()) expect(findBanwords(t.word), t.word).toEqual([]);
  });
});

describe("逆引きの対応づけ", () => {
  it("一覧にない id・条件は捨てる", () => {
    const [first] = allTerms();
    const result = resolve(
      // @ts-expect-error 一覧にない条件
      { termIds: [first.id, "nope:0", first.id], exclude: ["drive", "pregnancy"] },
      "claude",
    );
    expect(result.terms.map((t) => t.id)).toEqual([first.id]);
    expect(result.exclude).toEqual(["drive"]);
  });

  it("Claude を使わないときは語の一致で対応づける（生理痛 → 解熱鎮痛薬の月経痛（生理痛））", () => {
    const result = resolve(keywordSelection("生理痛"), "keyword");
    expect(result.terms.some((t) => t.word.includes("生理痛"))).toBe(true);
    const fever = DEMO_PRODUCTS.find((p) => p.name === "エルペインコーワα")!;
    expect(matchedTerms(fever, result.terms).length).toBeGreaterThan(0);
    const eye = DEMO_PRODUCTS.find((p) => p.kind === "eye")!;
    expect(matchedTerms(eye, result.terms)).toEqual([]);
  });

  it("専用品は商品の効能・効果にある語だけに当たる（エルペインコーワα は頭痛に当たらない）", () => {
    const headache = resolve(keywordSelection("頭痛"), "keyword");
    const elpain = DEMO_PRODUCTS.find((p) => p.name === "エルペインコーワα")!;
    const eve = DEMO_PRODUCTS.find((p) => p.name === "イブA錠")!;
    expect(matchedTerms(elpain, headache.terms)).toEqual([]);
    expect(matchedTerms(eve, headache.terms).length).toBeGreaterThan(0);
  });

  it("承認基準の対象の薬効群の商品には、すべて照合の印がある", () => {
    // 逆引きの語をまだ持たない承認基準（漢方製剤、L-20261104-09）は対象外
    for (const p of DEMO_PRODUCTS) {
      const covered = EFFICACY_STANDARDS.some(
        (s) => s.terms.length && s.noticeGroupIds.includes(p.noticeGroupId),
      );
      if (covered) expect(EFFICACY_MARKS[p.id], p.name).toBeDefined();
    }
  });

  it("空の入力は何にも当てない", () => {
    expect(keywordSelection("  ").termIds).toEqual([]);
  });
});
