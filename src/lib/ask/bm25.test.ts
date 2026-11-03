import { describe, expect, it } from "vitest";
import { buildIndex, search, tokenize } from "@/lib/ask/bm25";

describe("tokenize", () => {
  it("漢字・カタカナは2-gram、英数字は語のまま、ひらがなだけの2-gramは使わない", () => {
    expect(tokenize("授乳中の人")).toEqual(["授乳", "乳中", "中の", "の人"]);
    expect(tokenize("ビタミンB1 100mg")).toEqual(["b1", "100mg", "ビタ", "タミ", "ミン"]);
    expect(tokenize("してください")).toEqual([]);
  });

  it("全角を半角にそろえる", () => {
    expect(tokenize("１５歳")).toEqual(["15", "歳"]);
  });
});

describe("search", () => {
  const index = buildIndex([
    {
      id: "a",
      text: "服用後、乗物又は機械類の運転操作をしないこと（眠気等があらわれることがある。）",
    },
    { id: "b", text: "授乳中の人は本剤を服用しないか、本剤を服用する場合は授乳を避けること" },
    { id: "c", text: "15歳未満の小児" },
  ]);

  it("語の重なる根拠を高い順に返し、当たらないものは返さない", () => {
    expect(search(index, "運転と眠気").map((h) => h.id)).toEqual(["a"]);
    expect(search(index, "授乳中は？")[0].id).toBe("b");
    expect(search(index, "小児は何歳から")[0].id).toBe("c");
    expect(search(index, "こんにちは")).toEqual([]);
  });
});
