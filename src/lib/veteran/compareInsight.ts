import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { ProductView } from "@/lib/catalog";
import type { BadgeRowCompare, CompareRow } from "@/lib/compare";
import { findBanwords } from "@/lib/guard/banwords";

function client(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ timeout: 20_000, maxRetries: 1 });
}

export const CompareInsightSchema = z.object({
  summary: z
    .string()
    .describe(
      "商品の主な違いを客観的・中立に要約した1〜2文（例：最大の分岐点は運転注意成分の有無と、1日の服用回数です。）",
    ),
  points: z
    .array(
      z.object({
        title: z.string().describe("着眼点の項目名（例：運転の有無、服用回数、対象年齢）"),
        description: z
          .string()
          .describe(
            "各商品の客観的な事実の違い（例：アレグラFXは運転制限がありませんが、ストナリニZは運転注意成分を含みます。）",
          ),
      }),
    )
    .max(3)
    .describe("店頭接客時にベテランが確認する主な分岐点（最大3点）"),
  hearingPrompt: z
    .string()
    .describe(
      "登録販売者がお客様に最初に尋ねるべき客観的確認事項（例：日中に車を運転されるか、また1日に何回飲むことを希望されるかをお聞きください。）",
    ),
});

export type CompareInsight = z.infer<typeof CompareInsightSchema>;

const SYSTEM_PROMPT = `あなたはドラッグストアの店頭に立つベテラン登録販売者です。
新人登録販売者が店頭でお客様から「これとこれ、何が違うの？」と聞かれた際に、
客観的な違いと接客時のヒアリング確認事項（分岐点）を的確にアドバイスしてください。

【厳格な遵守事項】
1. どちらかを推奨したり、特定の商品へ誘導したり、強さや優劣を比べることは絶対にしないでください。
2. 主観的な評価表現や推薦表現は禁止です。
3. あくまで「用法（服用回数・間隔）」「運転制限」「年齢制限」「配合成分の違い」など、客観的な事実の違いと、お客様の生活状況（運転するか、何回なら飲みやすいか等）を確認するヒアリング事項のみを伝えてください。
4. 出力は日本語で、簡潔かつ丁寧にまとめてください。`;

export function generateFallbackCompareInsight(
  views: ProductView[],
  rows: CompareRow[],
  badges: BadgeRowCompare[],
): CompareInsight {
  const diffRows = rows.filter((r) => r.diff);
  const diffBadges = badges.filter((b) => b.diff);

  const points: CompareInsight["points"] = [];

  const driveDiff = diffBadges.find((b) => b.kind === "drive");
  if (driveDiff) {
    points.push({
      title: "運転操作の有無",
      description: "商品によって服用後の運転操作に関する注意事項が異なります。",
    });
  }

  const ageDiff = diffBadges.find((b) => b.kind === "under15" || b.kind === "under12");
  if (ageDiff) {
    points.push({
      title: "対象年齢の確認",
      description: "服用可能な対象年齢の条件が異なります。",
    });
  }

  if (diffRows.length > 0 && points.length < 3) {
    points.push({
      title: "配合成分・規格の違い",
      description: `${diffRows
        .slice(0, 2)
        .map((r) => r.label)
        .join("や")}などの成分や分量に違いがあります。`,
    });
  }

  if (points.length === 0) {
    points.push({
      title: "規格・用法の確認",
      description: "それぞれの添付文書に記載された用法・用量をご確認ください。",
    });
  }

  return {
    summary: "配合成分や生活上の注意事項（運転や服用回数など）の違いをご確認ください。",
    points: points.slice(0, 3),
    hearingPrompt: "お客様の日中の運転予定や、服用回数のご希望をお聞きください。",
  };
}

export async function generateCompareInsight(
  views: ProductView[],
  rows: CompareRow[],
  badges: BadgeRowCompare[],
): Promise<CompareInsight> {
  const c = client();
  if (!c || views.length < 2) return generateFallbackCompareInsight(views, rows, badges);

  // 比較データの要約を作成
  const diffRows = rows.filter((r) => r.diff);
  const diffBadges = badges.filter((b) => b.diff);

  const productNames = views.map((v) => v.product.name).join("、");
  const factsList = views
    .map((v) => {
      const age = v.badges.find((b) => b.kind === "under15" || b.kind === "under12");
      const driving = v.badges.find((b) => b.kind === "drive");
      const abuse = v.badges.find((b) => b.kind === "abuse");
      return `【${v.product.name}】
- 区分: ${v.product.riskClass}
- 成分: ${v.product.facts.map((f) => f.ingredient).join(", ")}
- バッジ: ${v.badges.map((b) => b.label).join(", ")}
- 年齢条件: ${age ? age.label : "特になし"}
- 運転注意: ${driving ? "運転注意成分あり" : "運転制限なし"}
- 濫用防止: ${abuse ? "指定濫用防止医薬品" : "対象外"}`;
    })
    .join("\n\n");

  const diffSummary = `【主な違い】
- 異なる成分/規格: ${diffRows.map((r) => r.label).join(", ") || "なし"}
- 異なる確認ポイント(バッジ): ${diffBadges.map((b) => b.kind).join(", ") || "なし"}`;

  const userPrompt = `比較対象商品: ${productNames}

${factsList}

${diffSummary}

上記商品の違いをもとに、新人登録販売者がお客様に接客・説明する際の「着眼点（客観的分岐点）」と「お客様へのヒアリング事項」を作成してください。`;

  try {
    const model = process.env.CLAUDE_MODEL_FAST || process.env.CLAUDE_MODEL || "claude-haiku-4-5";
    const res = await c.beta.messages.parse({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      output_config: { format: zodOutputFormat(CompareInsightSchema) },
      messages: [{ role: "user", content: userPrompt }],
    });

    if (res.stop_reason === "refusal") return generateFallbackCompareInsight(views, rows, badges);
    const insight = res.parsed_output ?? null;
    if (!insight) return generateFallbackCompareInsight(views, rows, badges);

    // 安全ガード（禁止語チェック）
    const allText = [
      insight.summary,
      insight.hearingPrompt,
      ...insight.points.flatMap((p) => [p.title, p.description]),
    ].join(" ");

    const hits = findBanwords(allText);
    if (hits.length > 0) {
      console.warn("compareInsight: 禁止語が検出されたため出力を棄却しました", hits);
      return generateFallbackCompareInsight(views, rows, badges);
    }

    return insight;
  } catch (error) {
    console.error("compareInsight: Claude API 呼び出し失敗、フォールバックを使用します", error);
    return generateFallbackCompareInsight(views, rows, badges);
  }
}
