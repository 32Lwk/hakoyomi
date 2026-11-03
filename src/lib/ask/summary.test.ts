import { describe, expect, it } from "vitest";
import type { Passage } from "@/lib/ask/corpus";
import type { Answer } from "@/lib/ask/select";
import { checkSummary } from "@/lib/ask/summary";

const passages: Passage[] = [
  {
    id: "g1",
    text: "15歳未満の小児",
    source: { label: "通知", url: null },
    condition: null,
    productId: null,
    kinds: ["under15"],
    ingredients: [],
  },
  {
    id: "g2",
    text: "服用後、乗物又は機械類の運転操作をしないこと",
    source: { label: "通知", url: null },
    condition: null,
    productId: null,
    kinds: ["drive"],
    ingredients: [],
  },
];
const answers: Answer[] = passages.map((p) => ({
  id: p.id,
  text: p.text,
  source: p.source,
  condition: p.condition,
  productId: p.productId,
}));

describe("checkSummary", () => {
  it("番号を抜き出しの通し番号にする", () => {
    expect(
      checkSummary(
        [{ text: "運転操作をしないことと記載されています。", ids: ["g2"] }],
        answers,
        passages,
      ),
    ).toEqual([{ text: "運転操作をしないことと記載されています。", refs: [2] }]);
  });

  it("番号がない・抜き出しにない番号の文は捨てる", () => {
    expect(checkSummary([{ text: "記載があります。", ids: [] }], answers, passages)).toEqual([]);
    expect(checkSummary([{ text: "記載があります。", ids: ["g9"] }], answers, passages)).toEqual(
      [],
    );
  });

  it("根拠の原文にない数値を含む文は捨てる", () => {
    expect(
      checkSummary([{ text: "15歳未満の小児の項目があります。", ids: ["g1"] }], answers, passages),
    ).toHaveLength(1);
    expect(
      checkSummary([{ text: "12歳未満の小児の項目があります。", ids: ["g1"] }], answers, passages),
    ).toEqual([]);
    // 数値は全角でも半角にそろえて照合する
    expect(
      checkSummary([{ text: "１５歳未満と記載されています。", ids: ["g1"] }], answers, passages),
    ).toHaveLength(1);
  });

  it("記載条件・出典名に出てくる数値は通す", () => {
    const withLabel: Passage[] = [
      { ...passages[0], source: { label: "通知 解熱鎮痛薬 してはいけないこと 1.(3)", url: null } },
    ];
    expect(
      checkSummary(
        [{ text: "15歳未満の小児（1.(3)）と記載されています。", ids: ["g1"] }],
        answers,
        withLabel,
      ),
    ).toHaveLength(1);
  });

  it("5文までにする", () => {
    const drafts = Array.from({ length: 7 }, () => ({ text: "記載があります。", ids: ["g2"] }));
    expect(checkSummary(drafts, answers, passages)).toHaveLength(5);
  });
});
