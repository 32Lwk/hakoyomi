import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Passage } from "@/lib/ask/corpus";
import type { Citation } from "@/lib/ask/select";

// 質問エージェント（L-20261103-43）。Claude は根拠の番号を選び、原文をそのまま抜き出すだけで、自分の文は書かない。
// 質問文はログに残さない（rules §4-7）。失敗したら null を返し、呼び出し側が語の一致に切り替える

const Selection = z.object({
  citations: z
    .array(z.object({ id: z.string(), quote: z.string() }))
    .max(10)
    .describe("質問に答える根拠。quote は根拠の本文からそのまま連続してコピーした部分"),
});

const RULES = [
  "あなたはドラッグストアの登録販売者が使う、使用上の注意などの記載を探す補助です。",
  "販売者の質問に関係する根拠を、下の根拠リストから選び、その本文を抜き出してください。",
  "",
  "- quote には、根拠の本文から連続した部分を一字一句そのままコピーします。言い換え・要約・つなぎの言葉・自分の説明は書きません。本文全体でもかまいません。",
  "- 関係する根拠がなければ citations は空にします。推測で広げません。",
  "- 商品の優劣や推奨、その人が服用できるか・受診すべきかの判断はしません。そのような質問でも、関係する記載を選ぶだけです。",
  "- 商品が複数あるときは、それぞれの商品（番号の p1・p2…）から関係する根拠を選びます。",
  "- 多くても10件までにし、同じ内容の重複は避けます。",
].join("\n");

function list(passages: Passage[]): string {
  return passages.map((p) => `[${p.id}] ${p.text}（出典：${p.source.label}）`).join("\n");
}

export async function citeWithClaude(
  question: string,
  passages: Passage[],
  // 商品を選ばない全体の根拠は毎回同じなので、システムに置いてキャッシュする
  cacheable: boolean,
  products: string[],
): Promise<Citation[] | null> {
  const model = process.env.CLAUDE_MODEL;
  if (!process.env.ANTHROPIC_API_KEY || !model) return null;
  const client = new Anthropic({ timeout: 30_000, maxRetries: 1 });
  const corpus = `根拠リスト：\n${list(passages)}`;
  const target = products.length
    ? `対象の商品：${products.map((name, i) => `p${i + 1}=${name}`).join("、")}\n`
    : "対象の商品：なし（通知・手引き全体から）\n";
  try {
    const response = await client.messages.parse({
      model,
      max_tokens: 4000,
      output_config: { effort: "low", format: zodOutputFormat(Selection) },
      system: cacheable
        ? [
            { type: "text", text: RULES },
            { type: "text", text: corpus, cache_control: { type: "ephemeral" } },
          ]
        : [{ type: "text", text: RULES }],
      messages: [
        {
          role: "user",
          content: `${cacheable ? "" : `${corpus}\n\n`}${target}質問：${question}`,
        },
      ],
    });
    if (response.stop_reason === "refusal") return null;
    return response.parsed_output?.citations ?? null;
  } catch (error) {
    // 質問文は出さない。種類だけ残す
    console.error(
      "ask: Claude の選択に失敗",
      error instanceof Anthropic.APIError ? error.status : "parse",
    );
    return null;
  }
}
