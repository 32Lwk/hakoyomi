import { describe, expect, it } from "vitest";
import { CompareInsightSchema } from "./compareInsight";

describe("CompareInsightSchema", () => {
  it("正しい構造のインサイトをパースできる", () => {
    const valid = {
      summary: "最大の分岐点は運転注意成分の有無と、1日の服用回数です。",
      points: [
        {
          title: "運転の有無",
          description: "アレグラFXは運転制限がありませんが、ストナリニZは運転注意成分を含みます。",
        },
        {
          title: "服用回数",
          description: "アレグラFXは1日2回、ストナリニZは1日1回就寝前の服用です。",
        },
      ],
      hearingPrompt: "日中に車を運転されるか、何回なら飲みやすいかをお聞きください。",
    };
    const parsed = CompareInsightSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });
});
