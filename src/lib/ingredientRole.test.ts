import { describe, expect, it } from "vitest";
import { DEMO_PRODUCTS } from "@/data/demo_products";
import { INGREDIENT_ROLES } from "@/data/ingredient_roles";
import { findBanwords } from "@/lib/guard/banwords";
import { ingredientRole } from "@/lib/ingredientRole";

// 手引きの該当章に名前がない成分。推測で埋めず「記載が見つかりません」を出す（L-20261103-05）
const NOT_IN_TEBIKI = new Set([
  "cold:アンブロキソール塩酸塩",
  "cold:タイソウ",
  "rhinitis:ダツラエキス",
  "fever:ロキソプロフェンナトリウム水和物",
  "rhinitis:無水カフェイン",
  "cough:無水カフェイン",
  // 追加21品（L-20261103-03）
  "cold:プロメタジンメチレンジサリチル酸塩",
  "rhinitis:セチリジン塩酸塩",
  // L-20261103-08（手引きの該当章に名前がない。ダスモックb の清肺湯の構成生薬など）
  "cold:L-カルボシステイン",
  "fever:カフェイン水和物",
  "cough:ソヨウ流エキス",
  "cough:オウゴン",
  "cough:サンシシ",
  "cough:ショウキョウ",
  "cough:ソウハクヒ",
  "cough:タイソウ",
  "cough:チクジョ",
  "cough:チンピ",
  "cough:テンモンドウ",
  "cough:トウキ",
  "cough:バイモ",
  "cough:ブクリョウ",
  // L-20261103-24（手引きの該当章に名前がない）
  "fever:グリシン",
  "fever:セトチアミン塩酸塩水和物",
  "cough:アセンヤク末",
  "cough:ニンジン末",
]);

describe("ingredientRole", () => {
  it("dl-・d- を外して引く", () => {
    expect(ingredientRole("cold", "dl-メチルエフェドリン塩酸塩")?.group).toBe(
      "アドレナリン作動成分",
    );
    expect(ingredientRole("rhinitis", "d-クロルフェニラミンマレイン酸塩")?.group).toBe(
      "抗ヒスタミン成分",
    );
  });

  it("同じ成分でも薬効群ごとの記載を返す", () => {
    expect(ingredientRole("cold", "無水カフェイン")?.section).toMatch(/かぜ薬/);
    expect(ingredientRole("fever", "無水カフェイン")?.section).toMatch(/解熱鎮痛薬/);
    expect(ingredientRole("rhinitis", "無水カフェイン")).toBeNull();
  });

  it("デモ商品の成分は、手引きの記載があるか、記載なしの一覧にあるか", () => {
    // 手引きの記載をまだ収録していない種類（L-20261103-08 で足した胃腸薬・目薬など）は対象外。画面は「記載が見つかりません」
    const mapped = new Set(INGREDIENT_ROLES.flatMap((r) => r.kinds));
    const unknown = DEMO_PRODUCTS.filter((p) => mapped.has(p.kind))
      .flatMap((p) =>
        p.facts
          .filter((f) => !ingredientRole(p.kind, f.ingredient))
          .map((f) => `${p.kind}:${f.ingredient}`),
      )
      .filter((k) => !NOT_IN_TEBIKI.has(k));
    expect(unknown).toEqual([]);
  });

  it("表示する文に禁止語を含まない", () => {
    for (const role of INGREDIENT_ROLES) {
      expect(findBanwords(`${role.group} ${role.purpose} ${role.quote}`), role.id).toEqual([]);
    }
  });
});
