import { describe, expect, it } from "vitest";
import {
  isVerbatim,
  itemId,
  sliceSource,
  toNoticeItems,
  verbatimFragments,
  type DraftItem,
} from "./lib";

const SOURCE = {
  id: "kaze_1",
  name: "かぜ薬",
  pages: [5, 6] as [number, number],
  start: "Ⅰ．かぜ薬（生薬のみからなる製剤を除く）",
  end: "【外部の容器又は外部の被包に記載すべき事項】",
};

const PAGES = [
  { page: 4, text: "目次\nⅠ．かぜ薬（生薬のみからなる製剤を除く）" },
  {
    page: 5,
    text: "5 \n１．かぜ薬\nⅠ．かぜ薬（生薬のみからなる製剤を除く） \n（３）１５歳未満の小児． \n  〔アスピリン，イブプロフェンを含有\nする製剤に記載すること．〕",
  },
  {
    page: 6,
    text: "6\n５．服用前後は飲酒しないこと\n【外部の容器又は外部の被包に記載すべき事項】\n１．次の人は",
  },
];

const draft = (overrides: Partial<DraftItem>): DraftItem => ({
  section: "してはいけないこと",
  itemNo: "1.(3)",
  body: "１５歳未満の小児．",
  conditionText: "アスピリン，イブプロフェンを含有する製剤に記載すること．",
  conditionJson: '{"hasIngredient":["アスピリン","イブプロフェン"]}',
  excludedBy: [],
  badge: "under15",
  needsReview: false,
  reviewNote: null,
  ...overrides,
});

describe("sliceSource", () => {
  it("見出しから外部の容器の手前までを切り出し、ページ番号の行を落とす", () => {
    const text = sliceSource(PAGES, SOURCE);
    expect(text.startsWith("Ⅰ．かぜ薬")).toBe(true);
    expect(text).toContain("服用前後は飲酒しないこと");
    expect(text).not.toContain("【外部の容器");
    expect(text).not.toMatch(/^\s*6\s*$/m);
  });

  it("範囲外のページの見出しは使わない", () => {
    expect(() => sliceSource(PAGES.slice(0, 1), SOURCE)).toThrow("見つかりません");
  });
});

describe("isVerbatim", () => {
  const text = sliceSource(PAGES, SOURCE);

  it("改行・空白・全角半角の違いは無視する", () => {
    expect(isVerbatim("15歳未満の小児.", text)).toBe(true);
    expect(isVerbatim("アスピリン，イブプロフェンを含有する製剤に記載すること．", text)).toBe(true);
  });

  it("言い換えは一致しない", () => {
    expect(isVerbatim("15歳未満の子ども．", text)).toBe(false);
  });
});

describe("itemId", () => {
  it("fixtures の既存 id と同じ形になる", () => {
    expect(itemId("kaze_1", "してはいけないこと", "1.(3)")).toBe("kaze_1-ng-1-3");
    expect(itemId("kaze_1", "相談すること", "3.2)")).toBe("kaze_1-sd-3-2");
    expect(itemId("kaze_1", "その他", "5.")).toBe("kaze_1-etc-5");
  });
});

describe("toNoticeItems", () => {
  const text = sliceSource(PAGES, SOURCE);

  it("原文どおりの下書きは指摘なしで NoticeItem になる", () => {
    const { items, issues } = toNoticeItems("kaze_1", [draft({})], text);
    expect(issues).toEqual([]);
    expect(items[0]).toMatchObject({
      id: "kaze_1-ng-1-3",
      condition: { hasIngredient: ["アスピリン", "イブプロフェン"] },
      badge: "under15",
    });
  });

  it("本文の言い換え・不正な条件式・存在しない除外先・要確認を指摘する", () => {
    const { items, issues } = toNoticeItems(
      "kaze_1",
      [
        draft({
          body: "15歳未満の子ども",
          conditionJson: '{"hasIngredient":[]}',
          excludedBy: [{ section: "してはいけないこと", itemNo: "9." }],
          needsReview: true,
          reviewNote: "剤形の条件",
        }),
      ],
      text,
    );
    expect(items[0].condition).toEqual({ always: true });
    expect(issues.map((i) => i.problem)).toEqual([
      "本文が原文と一致しない",
      '条件式が不正：{"hasIngredient":[]}',
      "要確認：剤形の条件",
      "除外先 kaze_1-ng-9 が存在しない",
    ]);
  });
});

describe("verbatimFragments", () => {
  const text = sliceSource(PAGES, SOURCE);

  it("原文の離れた箇所を順につないだ抜き出しは断片に分ける", () => {
    expect(verbatimFragments("１５歳未満の小児．服用前後は飲酒しないこと", text)).toEqual([
      "15歳未満の小児.",
      "服用前後は飲酒しないこと",
    ]);
  });

  it("言い換えは短い断片の寄せ集めとみなさず null", () => {
    expect(verbatimFragments("15歳未満の子どもは飲酒しないこと", text)).toBeNull();
  });
});

describe("itemId（その他の小見出し）", () => {
  it("小見出しを英字に置き換え、重複しない", () => {
    expect(itemId("kaze_1", "その他", "保管及び取扱い上の注意(1)")).toBe("kaze_1-etc-hokan-1");
    expect(itemId("kaze_1", "その他", "用法及び用量に関連する注意(1)")).toBe("kaze_1-etc-youho-1");
    expect(itemId("kaze_1", "その他", "成分及び分量に関連する注意")).toBe("kaze_1-etc-seibun");
    expect(itemId("abuse_prevention", "してはいけないこと", "続き番号")).toBe(
      "abuse_prevention-ng-last",
    );
  });
});
