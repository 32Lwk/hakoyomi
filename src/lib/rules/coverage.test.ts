import { describe, expect, it } from "vitest";
import { DEMO_PRODUCTS } from "@/data/demo_products";
import { NO_NOTICE_GROUPS, NOTICE_ITEMS } from "@/data/notices";
import { correctionsFor } from "@/lib/rules/labelCorrections";
import { NOTICE_BADGE_KINDS, unrecordedKinds } from "@/lib/rules/badges";

// 全デモSKUに確認ポイントの根拠がある（L-20261104-16/20）
describe("確認ポイントの網羅", () => {
  const loaded = new Set(NOTICE_ITEMS.map((i) => i.groupId));

  it("どの商品も、通知を取り込んだ薬効群か、通知に項がない薬効群で添付文書を確かめた品", () => {
    for (const p of DEMO_PRODUCTS) {
      const checked = correctionsFor(p).some((c) => c.correction.action === "labelChecked");
      expect(
        loaded.has(p.noticeGroupId) || (NO_NOTICE_GROUPS[p.noticeGroupId] && checked),
        p.name,
      ).toBeTruthy();
    }
  });

  it("確認ポイントがすべて「未収録」の商品はない", () => {
    for (const p of DEMO_PRODUCTS)
      expect(unrecordedKinds(p, loaded.has(p.noticeGroupId)).length, p.name).toBeLessThan(
        NOTICE_BADGE_KINDS.length,
      );
  });
});
