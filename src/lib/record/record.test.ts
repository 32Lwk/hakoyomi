import { describe, expect, it } from "vitest";
import { findBanwords } from "@/lib/guard/banwords";
import {
  formatRecordDraft,
  orderCheckedItems,
  RecordInput,
  verifyRecordDraft,
  type RecordDraftContext,
} from "@/lib/record/record";

const sampleContext: RecordDraftContext = {
  productName: "パブロンSゴールドW錠",
  quantity: 1,
  days: 7,
  limitDays: 7,
  large: false,
  multiple: true,
  overlaps: [
    {
      listed: "メチルエフェドリン",
      count: 2,
      productNames: ["パブロンSゴールドW錠", "新ルル-A錠s"],
    },
  ],
  hits: [
    { ingredient: "ジヒドロコデインリン酸塩", listed: "ジヒドロコデイン", limitDays: 7 },
    { ingredient: "dl-メチルエフェドリン塩酸塩", listed: "メチルエフェドリン", limitDays: 7 },
  ],
  checkedItems: ["キ", "ア", "オ", "イ", "エ", "カ"],
  staffAlias: "新人（模擬）",
  timeLabel: "2026/11/04 20:10",
};

describe("指定濫用防止医薬品の確認記録・販売記録下書き（T401）", () => {
  it("確認項目を通知（医薬発1226第16号 第4-1(4)）のア〜キの順に整列する", () => {
    const ordered = orderCheckedItems(["キ", "ウ", "ア", "オ"]);
    expect(ordered.map((i) => i.code)).toEqual(["ア", "ウ", "オ", "キ"]);
  });

  it("RecordInput はPIIフィールドを持たず、確認項目・個数・役割名を検証する", () => {
    const parsed = RecordInput.safeParse({
      productId: "pabron-s-gold-w-tab",
      quantity: 2,
      checkedItems: ["ア", "イ", "オ", "ア"],
      staffAlias: "ベテラン（模擬）",
      otherProductIds: ["lulu-a-s"],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.checkedItems).toEqual(["ア", "イ", "オ"]);
    }
  });

  it("定型下書き文は通知順の確認項目・日数・重複成分を含み、禁止語・個人情報を含まない", () => {
    const draft = formatRecordDraft(sampleContext);
    expect(draft).toContain("パブロンSゴールドW錠");
    expect(draft).toContain("7日分（基準上限7日分・通常容量）");
    expect(draft).toContain("複数個に該当");
    expect(draft).toContain(
      "重複指定成分：メチルエフェドリン（パブロンSゴールドW錠／新ルル-A錠s・計2個）",
    );
    expect(draft).toContain(
      "ア（年齢）・イ（他の薬剤・医薬品の使用状況）・エ（当該製品と他の指定濫用防止医薬品の購入・譲受けの状況）・オ（大容量製品または複数個の場合はその理由）・カ（適正使用の確認に必要な事項）・キ（その他情報提供に必要な事項）",
    );
    expect(findBanwords(draft)).toEqual([]);
    expect(verifyRecordDraft(draft)).toEqual({ ok: true, text: draft });
  });

  it("verifyRecordDraft は禁止語や個人名・電話番号を含む下書きを差し止める", () => {
    expect(verifyRecordDraft("この薬がおすすめです").ok).toBe(false);
    expect(verifyRecordDraft("田中様に1個販売しました").ok).toBe(false);
    expect(verifyRecordDraft("連絡先 090-1234-5678 を確認").ok).toBe(false);
  });
});
