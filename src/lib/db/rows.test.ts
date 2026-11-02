import { describe, expect, it } from "vitest";
import { DEMO_PRODUCTS } from "@/data/demo_products";
import { KAZE_GROUP, KAZE_ITEMS } from "@/data/notice_kaze";
import {
  noticeGroupFromRow,
  noticeGroupToRow,
  noticeItemFromRow,
  noticeItemToRow,
  productFromRow,
  productToRows,
} from "./rows";

describe("rows", () => {
  it("商品は行にして戻すと同じ（成分は記載順のまま）", () => {
    for (const product of DEMO_PRODUCTS) {
      const { product: row, facts } = productToRows(product);
      // DB は記載順を保証しないので、逆順で返ってきても position で戻す
      expect(productFromRow({ ...row, product_facts: [...facts].reverse() })).toEqual(product);
    }
  });

  it("通知の薬効群・項目は行にして戻すと同じ", () => {
    expect(noticeGroupFromRow(noticeGroupToRow(KAZE_GROUP))).toEqual(KAZE_GROUP);
    KAZE_ITEMS.forEach((item, i) => {
      expect(noticeItemFromRow(noticeItemToRow(item, i))).toEqual(item);
    });
  });

  it("読むときに zod で検証し、知らない区分は通さない", () => {
    const row = noticeItemToRow(KAZE_ITEMS[0], 0);
    expect(() => noticeItemFromRow({ ...row, section: "おすすめ" })).toThrow();
  });
});
