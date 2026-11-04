import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ABUSE_SOURCE } from "@/data/abuse_ingredients";
import { orderCheckedItems, verifyRecordDraft, type RecordDraftContext } from "@/lib/record/record";

// 指定濫用防止医薬品の販売記録下書きを Claude で作成し、自己検査＋禁止語ガードを通す（T401、L-20261104-25）。
// 個人情報は一切扱わず、確認した事実だけを簡潔な記録文にまとめる。

const DraftOutput = z.object({
  draft: z
    .string()
    .describe(
      "店舗の販売記録帳簿・引き継ぎメモに貼り付けるための、事実のみを記した簡潔な販売記録下書き（3〜5行）",
    ),
  hasPersonalInfo: z
    .boolean()
    .describe("特定の個人の氏名・連絡先・症状・病歴などの個人情報が含まれている場合は true"),
  hasRecommendationOrJudgment: z
    .boolean()
    .describe(
      "商品の推奨、効果の断定、またはAIによる販売・服用の可否判断の表現が含まれている場合は true",
    ),
});

const SYSTEM_PROMPT = [
  "あなたはドラッグストアの登録販売者向けに、指定濫用防止医薬品（2026年5月施行）の確認記録の下書きを作成する係です。",
  "与えられた事実データ（商品名、個数、日数・大容量の該当有無、複数個の該当有無、対象成分、確認済み項目ア〜キ、担当者名、時刻）だけを使って、店舗の記録簿に転記しやすい簡潔な下書き文（3〜5行）を作成してください。",
  "厳守事項：",
  "- お客様の氏名・年齢の具体値・症状・病歴などの個人情報は一切書かない（「確認済み」という事実のみを書く）。",
  "- 商品の推奨、効果の言い切り、または使用・販売の可否を判定する語を一切使わない。",
  "- 与えられた事実以外の数値や推測を足さない。",
  "- 最後に「※個人情報は記録していません。販売の判断は登録販売者が店頭で行いました。」を添える。",
].join("\n");

export async function generateRecordDraftWithClaude(
  ctx: RecordDraftContext,
): Promise<string | null> {
  const model = process.env.CLAUDE_MODEL_GUARD || process.env.CLAUDE_MODEL;
  if (!process.env.ANTHROPIC_API_KEY || !model) return null;

  const ordered = orderCheckedItems(ctx.checkedItems);
  const roundedDays = Math.round(ctx.days * 10) / 10;
  const factsText = [
    `時刻：${ctx.timeLabel}`,
    `担当：${ctx.staffAlias}`,
    `商品名：${ctx.productName}`,
    `個数：${ctx.quantity}個`,
    `1包装の日数：${roundedDays}日分（基準上限${ctx.limitDays}日分・${ctx.large ? "大容量製品に該当" : "通常容量"}）`,
    `複数個の該当：${ctx.multiple ? "複数個に該当" : "単数"}`,
    ctx.overlaps.length > 0
      ? `重複している指定成分：${ctx.overlaps.map((o) => `${o.listed}（${o.productNames.join("／")}・計${o.count}個）`).join("、")}`
      : null,
    `対象成分：${ctx.hits.map((h) => `${h.listed}［${h.ingredient}］`).join("、")}`,
    `確認済み項目（${ABUSE_SOURCE.sales} 第4-1(4)）：${ordered.map((i) => `${i.code}（${i.label}）`).join("・")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const api = new Anthropic({ timeout: 15_000, maxRetries: 1 });
  try {
    const response = await api.messages.parse({
      model,
      max_tokens: 500,
      output_config: { effort: "low", format: zodOutputFormat(DraftOutput) },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: factsText }],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return null;
    const out = response.parsed_output;
    if (out.hasPersonalInfo || out.hasRecommendationOrJudgment) {
      console.info("record: Claude 自己検査で差し止め");
      return null;
    }
    const verified = verifyRecordDraft(out.draft);
    if (!verified.ok) {
      console.info("record: 禁止語ガードで差し止め", verified.reasons.join(","));
      return null;
    }
    return verified.text;
  } catch (error) {
    console.error(
      "record: Claude 下書き生成に失敗",
      error instanceof Anthropic.APIError ? (error.status ?? error.name) : "parse",
    );
    return null;
  }
}
