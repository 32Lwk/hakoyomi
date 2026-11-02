import { describe, expect, it } from "vitest";
import { guard, guardAll } from "@/lib/guard/guard";
import { UI_COPY } from "@/lib/guard/uiCopy";

describe("guard", () => {
  it("禁止語を含む文を差し止める", () => {
    expect(guard("こちらがおすすめです")).toEqual({ ok: false, hits: ["おすすめ"] });
  });

  it("通知の抜き出しは通す", () => {
    const text = "服用後，乗物又は機械類の運転操作をしないこと";
    expect(guard(text)).toEqual({ ok: true, text });
  });

  it("複数の文から差し止めた分を除く", () => {
    const result = guardAll(["授乳中の人．", "これが一番です"]);
    expect(result.passed).toEqual(["授乳中の人．"]);
    expect(result.blocked).toHaveLength(1);
  });

  it("画面の固定文言はすべて guard を通る", () => {
    for (const text of Object.values(UI_COPY)) {
      expect(guard(text).ok).toBe(true);
    }
  });
});
