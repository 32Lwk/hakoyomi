import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { ProductView } from "@/lib/catalog";
import { findBanwords } from "@/lib/guard/banwords";

function client(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ timeout: 20_000, maxRetries: 1 });
}

export const DialogueChecklistSchema = z.object({
  items: z
    .array(
      z.object({
        dialogue: z
          .string()
          .describe(
            "登録販売者がお客様に店頭でそのまま尋ねられる問いかけ台詞（例：「過去に胃潰瘍や、鎮痛薬でアレルギーが出たことはありませんか？」）",
          ),
        reason: z
          .string()
          .describe("確認する公的な根拠・理由（例：してはいけないこと（胃潰瘍・アレルギー歴））"),
        badgeText: z.string().describe("関連する短い分類タグ（例：禁忌事項、併用注意、年齢確認）"),
      }),
    )
    .min(1)
    .max(3)
    .describe("店頭でお客様に確認すべき最も重要な問いかけ項目（最大3件）"),
});

export type DialogueChecklist = z.infer<typeof DialogueChecklistSchema>;

const SYSTEM_PROMPT = `あなたはドラッグストアの店頭に立つベテラン登録販売者です。
新人登録販売者が医薬品のバーコードを読み取った直後に、
「お渡しする前にお客様へ必ず確認すべき重要な問いかけ台詞（1〜3問）」を作成してください。

【厳格な遵守事項】
1. 医薬品の添付文書・公的通知の「してはいけないこと（禁忌）」「相談すること」「用法用量（年齢制限）」「他薬との併用注意」など、安全上の重要事項から抽出してください。
2. 問いかけは、店頭でお客様に対して丁寧かつ自然にそのまま口頭で聞ける台詞（「〜はありませんか？」「〜でよろしいですか？」）にしてください。
3. 主観的な効果の保証や、特定の商品を勧める表現、病状の判断・受診要否の決定は絶対に含めないでください。
4. 出力は日本語で簡潔に作成してください。`;

export async function generateDialogueChecklist(
  view: ProductView,
): Promise<DialogueChecklist | null> {
  const c = client();
  if (!c) return null;

  const age = view.badges.find((b) => b.kind === "under15" || b.kind === "under12");
  const driving = view.badges.find((b) => b.kind === "drive");
  const abuse = view.badges.find((b) => b.kind === "abuse");
  const alcohol = view.badges.find((b) => b.kind === "alcohol");
  const breastfeeding = view.badges.find((b) => b.kind === "breastfeeding");

  const productContext = `【商品情報】
- 品名: ${view.product.name}
- 区分: ${view.product.riskClass}
- 薬効群: ${view.group?.name ?? "未指定"}
- 成分: ${view.product.facts.map((f) => f.ingredient).join(", ")}
- 確認ポイント(バッジ): ${view.badges.map((b) => b.label).join(", ")}
- 制限情報:
  * 年齢: ${age ? age.label : "特になし"}
  * 運転: ${driving ? "運転注意成分あり" : "なし"}
  * 濫用防止: ${abuse ? "指定濫用防止医薬品" : "なし"}
  * 飲酒: ${alcohol ? "服用前後の飲酒注意" : "なし"}
  * 授乳: ${breastfeeding ? "授乳中の相談事項あり" : "なし"}`;

  const userPrompt = `${productContext}

上記医薬品を店頭でお客様にお渡しする際、新人登録販売者がお客様に確認すべき「問いかけ台詞（最大3問）」と「公的根拠」を作成してください。`;

  try {
    const model = process.env.CLAUDE_MODEL_FAST || process.env.CLAUDE_MODEL || "claude-haiku-4-5";
    const res = await c.beta.messages.parse({
      model,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      output_config: { format: zodOutputFormat(DialogueChecklistSchema) },
      messages: [{ role: "user", content: userPrompt }],
    });

    if (res.stop_reason === "refusal") return null;
    const result = res.parsed_output ?? null;
    if (!result) return null;

    // 安全ガード（禁止語チェック）
    const allText = result.items
      .flatMap((item) => [item.dialogue, item.reason, item.badgeText])
      .join(" ");

    const hits = findBanwords(allText);
    if (hits.length > 0) {
      console.warn("dialogueChecklist: 禁止語が検出されたため出力を棄却しました", hits);
      return null;
    }

    return result;
  } catch (error) {
    console.error("dialogueChecklist: Claude API 呼び出し失敗", error);
    return null;
  }
}
