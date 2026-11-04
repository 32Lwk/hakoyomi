import { describe, expect, it } from "vitest";
import { matchOfficialNoticesForMemo } from "./linker";

describe("matchOfficialNoticesForMemo", () => {
  it("小児や年齢の言及を小児制限通知と照合できる", () => {
    const memo = "15歳未満の記載は、箱の裏のしてはいけないことの欄にある。";
    const matches = matchOfficialNoticesForMemo(memo);
    expect(matches.some((m) => m.label.includes("15歳未満"))).toBe(true);
  });

  it("運転や眠気の言及を運転操作注意通知と照合できる", () => {
    const memo = "眠気の記載があるため運転の予定があるか先に聞く。";
    const matches = matchOfficialNoticesForMemo(memo);
    expect(matches.some((m) => m.label.includes("運転"))).toBe(true);
  });
});
