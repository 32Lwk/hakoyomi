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

describe("鎮咳去痰薬（L-20261103-29）", () => {
  it("ムコダイン去たん錠Pro500 は授乳中は相談、同じ成分のストナ去たんカプセルには出さない", () => {
    expect(kinds("ムコダイン去たん錠Pro500")).toContain("breastfeeding");
    expect(kinds("ストナ去たんカプセル")).not.toContain("breastfeeding");
  });

  it("コデイン類の製剤は年齢 12歳から", () => {
    const age = deriveBadges(byName("新ブロン液エース"), NOTICE_ITEMS).find(
      (b) => b.kind === "under12",
    );
    expect(age?.label).toBe("年齢 12歳から");
  });
});

describe("睡眠改善薬（L-20261103-36）", () => {
  it("添付文書を確かめた品は運転・授乳・年齢・飲酒を出し、未収録にしない", () => {
    for (const name of ["ドリエル", "ドリエルEX"]) {
      const badges = deriveBadges(byName(name), NOTICE_ITEMS);
      expect(
        badges.map((b) => b.kind),
        name,
      ).toEqual(expect.arrayContaining(["drive", "breastfeeding", "under15", "alcohol"]));
      const age = badges.find((b) => b.kind === "under15");
      expect(age?.label).toBe("年齢 15歳から");
      expect(age?.evidence[0]).toMatchObject({ kind: "label", labelOnly: true });
      expect(unrecordedKinds(byName(name), false), name).toEqual([]);
    }
  });

  it("添付文書を確かめていない品（ドリーミンZ）は未収録のまま", () => {
    const p = byName("ドリーミンZ");
    expect(unrecordedKinds(p, false)).toEqual(
      expect.arrayContaining(["drive", "breastfeeding", "under15", "alcohol"]),
    );
    expect(deriveBadges(p, NOTICE_ITEMS).map((b) => b.kind)).not.toContain("drive");
  });
});

describe("レスタミン・生理痛にも使う解熱鎮痛薬（L-20261103-40）", () => {
  it("レスタミン内服は添付文書から運転・授乳・飲酒を出す。α錠だけ15歳から、糖衣錠・U錠の年齢は未収録", () => {
    for (const name of ["レスタミンコーワ糖衣錠", "レスタミンUコーワ錠", "レスタミンコーワα錠"]) {
      expect(kinds(name), name).toEqual(
        expect.arrayContaining(["abuse", "drive", "breastfeeding", "alcohol"]),
      );
    }
    expect(kinds("レスタミンコーワα錠")).toContain("under15");
    expect(unrecordedKinds(byName("レスタミンコーワα錠"), false)).toEqual([]);
    expect(unrecordedKinds(byName("レスタミンコーワ糖衣錠"), false)).toEqual(["under15"]);
  });

  it("エルペインコーワα は添付文書の運転注意を足す", () => {
    const drive = deriveBadges(byName("エルペインコーワα"), NOTICE_ITEMS).find(
      (b) => b.kind === "drive",
    );
    expect(drive?.evidence[0]).toMatchObject({ kind: "label" });
  });

  it("7才から飲める品（バファリンルナJ・小中学生用ノーシンピュア）の年齢は未収録", () => {
    for (const name of ["バファリンルナJ", "小中学生用ノーシンピュア"]) {
      expect(kinds(name), name).not.toContain("under15");
      expect(unrecordedKinds(byName(name), true), name).toEqual(["under15"]);
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
