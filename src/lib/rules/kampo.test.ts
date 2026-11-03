import { describe, expect, it } from "vitest";
import { DEMO_PRODUCTS } from "@/data/demo_products";
import { EFFICACY_MARKS, EFFICACY_STANDARDS } from "@/data/efficacy_standards";
import { NOTICE_GROUPS, NOTICE_ITEMS } from "@/data/notices";
import { applicableItems } from "@/lib/rules/noticeRules";
import { sameName } from "@/lib/rules/normalize";

// 一般用漢方製剤の通知・承認基準（L-20261104-09）。処方ごとの薬効群 kampo_{処方番号}
const byName = (name: string) => {
  const p = DEMO_PRODUCTS.find((x) => x.name === name);
  if (!p) throw new Error(name);
  return p;
};
const ids = (name: string) => applicableItems(byName(name), NOTICE_ITEMS).map((a) => a.item.id);

describe("漢方製剤の通知", () => {
  it("漢方の商品はすべて処方の薬効群に付き、通知の項目と承認基準の効能・効果がある", () => {
    const kampo = DEMO_PRODUCTS.filter((p) => p.kind === "kampo");
    expect(kampo.length).toBe(22);
    for (const p of kampo) {
      expect(p.noticeGroupId).toMatch(/^kampo_\d{3}$/);
      expect(NOTICE_GROUPS.some((g) => g.id === p.noticeGroupId)).toBe(true);
      expect(applicableItems(p, NOTICE_ITEMS).length).toBeGreaterThan(0);
      expect(
        EFFICACY_STANDARDS.filter((s) => s.noticeGroupIds.includes(p.noticeGroupId)),
      ).toHaveLength(1);
    }
  });

  it("通知の生薬名（漢字）と入力値（カタカナ）を同じ生薬として照合する", () => {
    expect(sameName("甘草", "カンゾウ")).toBe(true);
    expect(sameName("大黄", "ダイオウ")).toBe(true);
    expect(sameName("甘草", "ダイオウ")).toBe(false);
  });

  it("マオウ・甘草1g以上の処方は、高齢者・むくみ・排尿困難・長期連用の項目に当たる", () => {
    const hits = ids("「クラシエ」漢方葛根湯加川きゅう辛夷エキス顆粒");
    for (const id of ["sd-1-6", "sd-1-8-1", "sd-1-8-2", "sd-1-9-1", "sd-1-9-2", "sd-4"])
      expect(hits).toContain(`kampo_033-${id}`);
    const elderly = applicableItems(
      byName("「クラシエ」漢方葛根湯加川きゅう辛夷エキス顆粒"),
      NOTICE_ITEMS,
    ).find((a) => a.item.id === "kampo_033-sd-1-6");
    expect(elderly?.matched.sort()).toEqual(["カンゾウ", "マオウ"]);
  });

  it("甘草もマオウも含まない処方には、その記載条件の項目が出ない", () => {
    const conditional = NOTICE_ITEMS.filter(
      (i) => i.groupId === "kampo_080" && /甘草|マオウ/.test(JSON.stringify(i.condition)),
    ).map((i) => i.id);
    const hits = ids("ツムラ漢方桂枝茯苓丸料エキス顆粒A");
    for (const id of conditional) expect(hits).not.toContain(id);
  });

  it("防風通聖散は令和8年8月の改正後の文面になっている", () => {
    const sd3 = NOTICE_ITEMS.find((i) => i.id === "kampo_262-sd-3");
    expect(sd3?.body).toContain("下痢、便秘");
    const sd2 = NOTICE_ITEMS.find((i) => i.id === "kampo_262-sd-2");
    expect(sd2?.body).toContain("精神神経系");
  });

  it("葛根湯加川芎辛夷の効能・効果は承認基準の原文", () => {
    const s = EFFICACY_STANDARDS.find((x) => x.id === "kampo_033");
    expect(s?.text).toBe("比較的体力があるものの次の諸症：鼻づまり、蓄膿症（副鼻腔炎）、慢性鼻炎");
  });
});

// 用法の年齢・剤形と、副作用の表の行ごとの条件（L-20261104-12）
describe("漢方製剤の用法・剤形と表の行の条件", () => {
  it("生後３ヵ月未満の用法がある商品だけに「生後３ヵ月未満の乳児」が出る", () => {
    expect(ids("「クラシエ」漢方葛根湯加川きゅう辛夷エキス顆粒")).toContain("kampo_033-ng-1-1");
    expect(ids("ツムラ漢方葛根湯加川きゅう辛夷エキス顆粒")).not.toContain("kampo_033-ng-1-1");
  });

  it("顆粒剤には錠剤・丸剤の注意が出ず、それ以外の剤形の注意が出る", () => {
    const hits = ids("ツムラ漢方葛根湯加川きゅう辛夷エキス顆粒");
    expect(hits).not.toContain("kampo_033-etc-youho-2-1");
    expect(hits).not.toContain("kampo_033-etc-youho-2-2");
    expect(hits).toContain("kampo_033-etc-youho-2-3");
  });

  it("用法・剤形の値がない商品には、用法・剤形の条件の項目を当てない", () => {
    const p = { ...byName("ツムラ漢方葛根湯加川きゅう辛夷エキス顆粒"), id: "no-usage" };
    const hits = applicableItems(p, NOTICE_ITEMS).map((a) => a.item.id);
    expect(hits).not.toContain("kampo_033-etc-youho-1");
    expect(hits).toContain("kampo_033-sd-1-6");
  });

  it("大黄の行は大黄を含む処方の商品だけに出る", () => {
    expect(ids("ツムラ漢方柴胡加竜骨牡蛎湯エキス顆粒")).not.toContain("kampo_107-sd-2-r1");
    const row = NOTICE_ITEMS.find((i) => i.id === "kampo_107-sd-2-r1");
    expect(row?.body).toContain("はげしい腹痛を伴う下痢");
    expect(NOTICE_ITEMS.find((i) => i.id === "kampo_107-sd-2")?.body).not.toContain("はげしい腹痛");
  });

  it("漢方の商品の項目は人の確認待ち（needsReview）を残さない", () => {
    expect(NOTICE_ITEMS.filter((i) => i.groupId.startsWith("kampo_") && i.needsReview)).toEqual([]);
  });

  it("逆引きの語は効能・効果の原文の一部で、漢方の商品に照合の印がある", () => {
    for (const s of EFFICACY_STANDARDS.filter((x) => x.id.startsWith("kampo_"))) {
      expect(s.terms.length).toBeGreaterThan(0);
      for (const t of s.terms) expect(s.text).toContain(t.word);
      expect(s.text.startsWith(`${s.scope}：`)).toBe(true);
    }
    const kaku = EFFICACY_STANDARDS.find((x) => x.id === "kampo_033")!;
    expect(kaku.terms.map((t) => t.word)).toEqual(["鼻づまり", "蓄膿症（副鼻腔炎）", "慢性鼻炎"]);
    expect(EFFICACY_MARKS["med-05338"]).toEqual(["kampo_033:1", "kampo_033:2", "kampo_033:3"]);
  });
});
