import { describe, expect, it } from "vitest";
import { DEMO_PRODUCTS } from "@/data/demo_products";
import { LABEL_CORRECTIONS } from "@/data/label_corrections";
import { NOTICE_ITEMS } from "@/data/notices";
import { deriveBadges, unrecordedKinds } from "@/lib/rules/badges";
import { sameName } from "@/lib/rules/normalize";

const byName = (name: string) => {
  const p = DEMO_PRODUCTS.find((x) => x.name === name);
  if (!p) throw new Error(name);
  return p;
};
const kinds = (name: string) => deriveBadges(byName(name), NOTICE_ITEMS).map((b) => b.kind);

describe("添付文書による補正（L-20261103-28）", () => {
  it("フェキソフェナジン単味の製剤には運転注意を出さない", () => {
    expect(kinds("アレグラFX")).not.toContain("drive");
    expect(kinds("アレグラFXジュニア")).not.toContain("drive");
    // 通知どおりの品には出る
    expect(kinds("アレジオン20")).toContain("drive");
    expect(kinds("ストナリニS")).toContain("drive");
  });

  it("ロキソプロフェンの製剤に年齢 15歳から を出し、根拠は添付文書による補正", () => {
    for (const name of ["ロキソニンS", "ロキソニンSクイック", "ロキソニンSプレミアム"]) {
      const age = deriveBadges(byName(name), NOTICE_ITEMS).find((b) => b.kind === "under15");
      expect(age?.label, name).toBe("年齢 15歳から");
      expect(
        age?.evidence.map((e) => e.kind),
        name,
      ).toEqual(["label"]);
    }
  });

  it("ジュニアの年齢は「該当なし」ではなく「未収録」", () => {
    expect(unrecordedKinds(byName("アレグラFXジュニア"), true)).toEqual(["under15"]);
    expect(kinds("アレグラFXジュニア")).not.toContain("under15");
    expect(unrecordedKinds(byName("アレグラFX"), true)).toEqual([]);
  });

  it("文面は通知の項目から取り、消す項目は通知にある", () => {
    const ids = new Set(NOTICE_ITEMS.map((i) => i.id));
    for (const c of LABEL_CORRECTIONS) {
      if (c.action === "remove") for (const id of c.itemIds) expect(ids, c.id).toContain(id);
      if (c.action === "add") {
        const from = NOTICE_ITEMS.find((i) => i.id === c.bodyFrom);
        expect(from?.body.startsWith(c.body), c.id).toBe(true);
      }
    }
  });
});

describe("成分名の旧表記", () => {
  it("塩酸○○ と ○○塩酸塩 を同じとみる", () => {
    expect(sameName("塩酸プソイドエフェドリン", "プソイドエフェドリン塩酸塩")).toBe(true);
    expect(sameName("マレイン酸カルビノキサミン", "カルビノキサミンマレイン酸塩")).toBe(true);
    expect(sameName("dl-塩酸メチルエフェドリン", "dl－メチルエフェドリン塩酸塩")).toBe(true);
    expect(sameName("塩酸プソイドエフェドリン", "プソイドエフェドリン硫酸塩")).toBe(false);
  });

  it("旧表記の成分でも通知の記載条件に当たる", () => {
    expect(kinds("ジキニン鼻炎AG顆粒")).toContain("breastfeeding");
  });
});
