import { describe, expect, it } from "vitest";
import type { Passage } from "@/lib/ask/corpus";
import { keywordSelect, verifyCitations } from "@/lib/ask/select";

const passages: Passage[] = [
  {
    id: "p1-1",
    text: "服用後、乗物又は機械類の運転操作をしないこと",
    source: { label: "通知", url: null },
    productId: "a",
    kinds: ["drive"],
    ingredients: [],
  },
  {
    id: "p1-2",
    text: "イブプロフェン：1日最大量あたり 450mg",
    source: { label: "入力値", url: null },
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
