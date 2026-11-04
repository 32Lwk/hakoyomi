import { describe, expect, it } from "vitest";
import { DialogueChecklistSchema } from "./checklist";

describe("DialogueChecklistSchema", () => {
  it("正しいチェックリスト構造をパースできる", () => {
    const valid = {
      items: [
        {
          dialogue: "過去に胃潰瘍や、鎮痛薬でアレルギーが出たことはありませんか？",
          reason: "してはいけないこと（胃潰瘍・アレルギー歴）",
          badgeText: "禁忌事項",
        },
        {
          dialogue: "現在、他のかぜ薬や痛み止めを飲んでいませんか？",
          reason: "他薬との重複注意",
          badgeText: "併用注意",
        },
        {
          dialogue: "15歳以上の方のご使用で間違いありませんか？",
          reason: "用法用量の年齢制限",
          badgeText: "年齢確認",
        },
      ],
    };
    const parsed = DialogueChecklistSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });
});
