import { describe, expect, it } from "vitest";
import { findBanwords } from "@/lib/guard/banwords";
import {
  encodeEvent,
  nextStage,
  splitEvents,
  STAGE_LABEL,
  STAGE_RUNNING,
  stageDetail,
  type AskEvent,
  type AskStage,
} from "@/lib/ask/stages";

describe("encodeEvent / splitEvents", () => {
  it("1行1件で往復でき、途中の行は rest に残す", () => {
    const events: AskEvent<{ ok: boolean }>[] = [
      { type: "stage", stage: "search", candidates: 12 },
      { type: "result", reply: { ok: true } },
    ];
    const text = events.map(encodeEvent).join("");
    const cut = text.length - 5;
    const first = splitEvents<{ ok: boolean }>(text.slice(0, cut));
    expect(first.events).toEqual([events[0]]);
    const second = splitEvents<{ ok: boolean }>(first.rest + text.slice(cut));
    expect(second.events).toEqual([events[1]]);
    expect(second.rest).toBe("");
  });

  it("改行を含む文字列も1行に収まる", () => {
    const line = encodeEvent({ type: "result", reply: { text: "a\nb" } });
    expect(line.indexOf("\n")).toBe(line.length - 1);
  });
});

describe("nextStage", () => {
  const search: AskStage = { stage: "search", candidates: 3 };
  it("最初の質問は検索から、続きの質問は解釈から", () => {
    expect(nextStage([], false)).toBe("search");
    expect(nextStage([], true)).toBe("interpret");
    expect(nextStage([{ stage: "interpret", ok: true, rewritten: false }], true)).toBe("search");
  });
  it("Claude を使えないときは出典検証を飛ばしてガードへ", () => {
    expect(nextStage([search, { stage: "match", via: "claude", selected: 2 }], false)).toBe(
      "verify",
    );
    expect(nextStage([search, { stage: "match", via: "keyword", selected: 2 }], false)).toBe(
      "guard",
    );
  });
  it("ガードの後はない", () => {
    expect(
      nextStage([{ stage: "guard", regex: 0, numbers: 0, reviewed: 0, review: 0 }], false),
    ).toBeNull();
  });
});

describe("stageDetail", () => {
  it("実際の件数をそのまま出す", () => {
    expect(stageDetail({ stage: "search", candidates: 41 })).toBe("候補の記載 41件");
    expect(stageDetail({ stage: "verify", matched: 5, discarded: 1 })).toBe(
      "原文と一致 5件・除外 1件",
    );
    expect(stageDetail({ stage: "guard", regex: 1, numbers: 2, reviewed: 4, review: 1 })).toBe(
      "差し止め：禁止語 1件・番号と数値 2文・自己検査 1文",
    );
    expect(
      stageDetail({ stage: "guard", regex: 0, numbers: 0, reviewed: 3, review: null }),
    ).toContain("自己検査できず説明文 3文を出さない");
  });

  it("画面の文言に禁止語がない", () => {
    const samples: AskStage[] = [
      { stage: "interpret", ok: false, rewritten: false },
      { stage: "interpret", ok: true, rewritten: true },
      { stage: "interpret", ok: true, rewritten: false },
      { stage: "search", candidates: 1 },
      { stage: "match", via: "claude", selected: 1 },
      { stage: "match", via: "keyword", selected: 1 },
      { stage: "verify", matched: 1, discarded: 0 },
      { stage: "guard", regex: 0, numbers: 0, reviewed: 1, review: null },
    ];
    const texts = [
      ...samples.map(stageDetail),
      ...Object.values(STAGE_LABEL),
      ...Object.values(STAGE_RUNNING),
    ];
    expect(texts.flatMap(findBanwords)).toEqual([]);
  });
});
