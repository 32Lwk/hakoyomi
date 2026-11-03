import { describe, expect, it } from "vitest";
import {
  localMemoCheck,
  memoFromRow,
  MemoInput,
  memosForProduct,
  type Memo,
} from "@/lib/memos/memo";

describe("localMemoCheck", () => {
  it("説明の仕方のメモは通す", () => {
    expect(
      localMemoCheck("眠気の記載は箱の裏「してはいけないこと」の欄。指で示して説明する"),
    ).toEqual([]);
    expect(localMemoCheck("お客様には先に15歳未満かどうかを確かめる。1日最大 3000mg 相当")).toEqual(
      [],
    );
    expect(localMemoCheck("店長さんに確認してから棚に戻す")).toEqual([]);
  });

  it("推奨・可否の語を止める", () => {
    expect(localMemoCheck("頭痛ならこれがおすすめ")).toEqual(["banword"]);
    expect(localMemoCheck("妊娠中でも飲めます")).toEqual(["banword"]);
  });

  it("連絡先・敬称つきの名前を止める", () => {
    expect(localMemoCheck("田中さんがいつも買う")).toEqual(["customer"]);
    expect(localMemoCheck("090-1234-5678 に連絡")).toEqual(["customer"]);
    expect(localMemoCheck("連絡は foo@example.com")).toEqual(["customer"]);
  });
});

describe("MemoInput", () => {
  it("役割名は決まった一覧だけ", () => {
    const base = { body: "箱の裏を見せる", productId: "med-1" };
    expect(MemoInput.safeParse({ ...base, authorAlias: "ベテラン（模擬）" }).success).toBe(true);
    expect(MemoInput.safeParse({ ...base, authorAlias: "山田" }).success).toBe(false);
    expect(MemoInput.safeParse({ ...base, authorAlias: "新人（模擬）", body: "  " }).success).toBe(
      false,
    );
  });
});

describe("memosForProduct", () => {
  const memo = (id: string, target: Memo["target"]): Memo => ({
    id,
    target,
    body: "b",
    authorAlias: "ベテラン（模擬）",
    createdAt: "2026-11-04T00:00:00Z",
  });
  it("商品のメモと、含む成分のメモを出す", () => {
    const memos = [
      memo("1", { kind: "product", productId: "a" }),
      memo("2", { kind: "product", productId: "b" }),
      memo("3", { kind: "ingredient", ingredient: "アセトアミノフェン" }),
      memo("4", { kind: "ingredient", ingredient: "カフェイン水和物" }),
    ];
    expect(
      memosForProduct(memos, { id: "a", ingredients: ["アセトアミノフェン"] }).map((m) => m.id),
    ).toEqual(["1", "3"]);
  });

  it("薬効群だけのメモは読まない", () => {
    expect(
      memoFromRow({
        id: "x",
        product_id: null,
        ingredient: null,
        group_id: "kaze",
        body: "b",
        author_alias: "a",
        created_at: "",
      }),
    ).toBeNull();
  });
});
