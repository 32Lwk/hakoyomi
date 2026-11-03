import { describe, expect, it } from "vitest";
import { DEMO_MEMOS } from "@/data/demo_memos";
import { DEMO_PRODUCTS } from "@/data/demo_products";
import { localMemoCheck, MEMO_MAX_LENGTH } from "@/lib/memos/memo";

describe("DEMO_MEMOS", () => {
  for (const memo of DEMO_MEMOS) {
    it(memo.id, () => {
      expect(localMemoCheck(memo.body)).toEqual([]);
      expect(memo.body.length).toBeLessThanOrEqual(MEMO_MAX_LENGTH);
      expect((memo.productId ? 1 : 0) + (memo.ingredient ? 1 : 0)).toBe(1);
      // 付ける先がデモSKUにある
      const found = memo.productId
        ? DEMO_PRODUCTS.some((p) => p.id === memo.productId)
        : DEMO_PRODUCTS.some((p) => p.facts.some((f) => f.ingredient === memo.ingredient));
      expect(found).toBe(true);
    });
  }
});
