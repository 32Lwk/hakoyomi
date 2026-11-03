import { describe, expect, it } from "vitest";
import type { Passage } from "@/lib/ask/corpus";
import {
  expandQuery,
  fallbackAnswers,
  keywordSelect,
  retrieve,
  verifyCitations,
} from "@/lib/ask/select";

const passages: Passage[] = [
  {
    id: "p1-1",
    text: "服用後、乗物又は機械類の運転操作をしないこと",
    source: { label: "通知", url: null },
    condition: null,
    productId: "a",
    kinds: ["drive"],
    ingredients: [],
  },
  {
    id: "p1-2",
    text: "イブプロフェン：1日最大量あたり 450mg",
    source: { label: "入力値", url: null },
    condition: null,
    productId: "a",
    kinds: [],
    ingredients: ["イブプロフェン"],
  },
];

describe("verifyCitations", () => {
  it("原文にそのまま含まれる抜き出しだけ残す", () => {
    const answers = verifyCitations(
      [
        { id: "p1-1", quote: "乗物又は機械類の運転操作をしないこと" },
        { id: "p1-1", quote: "運転はしないでください" },
        { id: "p9-9", quote: "存在しない" },
      ],
      passages,
    );
    expect(answers.map((a) => a.text)).toEqual(["乗物又は機械類の運転操作をしないこと"]);
  });

  it("空の抜き出しは本文全体にし、重複は1つにする", () => {
    const answers = verifyCitations(
      [
        { id: "p1-2", quote: "" },
        { id: "p1-2", quote: "イブプロフェン：1日最大量あたり 450mg" },
      ],
      passages,
    );
    expect(answers).toHaveLength(1);
    expect(answers[0].text).toBe(passages[1].text);
  });
});

describe("keywordSelect", () => {
  it("質問の語と成分名で根拠を拾う", () => {
    expect(keywordSelect("運転してもいい？", passages).map((a) => a.id)).toEqual(["p1-1"]);
    expect(keywordSelect("イブプロフェンは何mg？", passages).map((a) => a.id)).toEqual(["p1-2"]);
    expect(keywordSelect("こんにちは", passages)).toEqual([]);
  });
});

describe("retrieve", () => {
  const general: Passage[] = [
    {
      id: "g1",
      text: "服用後、乗物又は機械類の運転操作をしないこと（眠気等があらわれることがある。）",
      source: { label: "通知 かぜ薬 してはいけないこと 3", url: null },
      condition: null,
      productId: null,
      kinds: ["drive"],
      ingredients: [],
    },
    {
      id: "g2",
      text: "授乳中の人は本剤を服用しないか、本剤を服用する場合は授乳を避けること",
      source: { label: "通知 かぜ薬 してはいけないこと 4", url: null },
      condition: null,
      productId: null,
      kinds: ["breastfeeding"],
      ingredients: [],
    },
  ];

  it("言い方が違っても同義語で根拠を見つける", () => {
    expect(retrieve(expandQuery("眠くなる？"), general)[0].passage.id).toBe("g1");
    expect(retrieve(expandQuery("母乳をあげている"), general)[0].passage.id).toBe("g2");
  });

  it("商品ごとに上位と基本情報（-1）を返す", () => {
    const product: Passage[] = [
      { ...passages[0], id: "p1-1", text: "品名A（メーカー）：第2類医薬品", kinds: [] },
      { ...passages[0], id: "p1-2" },
      { ...passages[1], id: "p1-3" },
    ];
    const got = retrieve("運転", product, { perProduct: 1 }).map((r) => r.passage.id);
    expect(got).toEqual(["p1-1", "p1-2"]);
  });

  it("Claude なしの答えは当たったものだけ", () => {
    const answers = fallbackAnswers(retrieve(expandQuery("運転"), general));
    expect(answers.map((a) => a.id)).toEqual(["g1"]);
  });
});
