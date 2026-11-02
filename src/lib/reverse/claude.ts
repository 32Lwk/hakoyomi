import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { EFFICACY_STANDARDS } from "@/data/efficacy_standards";
import { allTerms, REVERSE_EXCLUDE, type ReverseSelection } from "@/lib/reverse/match";

// 逆引きの対応づけ（T302）。Claude は一覧の id を選ぶだけで、文は書かない。
// 入力文はログに残さない（rules §4-7）。失敗したら null を返し、呼び出し側が語の一致に切り替える

const Selection = z.object({
  termIds: z.array(z.string()),
  exclude: z.array(z.enum(REVERSE_EXCLUDE)),
});

// 一覧は承認基準のデータから作るので、リクエストごとに同じ文字列になる（プロンプトのキャッシュを使える）
const SYSTEM = [
  "あなたはドラッグストアの登録販売者が使う検索の補助です。販売者が入力した言葉（お客様の言葉をそのまま入れることもあります）を、",
  "下の「承認基準の効能・効果の語」の id と「含まない条件」に対応づけてください。",
  "",
  "- 言葉と同じ意味、またはその言葉が指す症状を含む語の id をすべて選びます（例：「鼻水」→ 鼻水（鼻汁過多）、「生理痛」→ 月経痛（生理痛））。",
  "- 当てはまる語がなければ termIds は空にします。推測で広げません。",
  "- 含まない条件は、言葉に「眠くならない」「運転する」→ drive、「カフェインなし」→ caffeine、「濫用防止の対象外」→ abuse、「ドーピング」「競技」→ doping のような指定があるときだけ選びます。",
  "- 商品の優劣や、その人に合うかどうかは判断しません。一覧から選ぶだけです。",
  "",
  "承認基準の効能・効果の語（id: 語［薬効群］）：",
  ...allTerms().map(
    (t) => `${t.id}: ${t.word}［${EFFICACY_STANDARDS.find((s) => s.id === t.standardId)!.name}］`,
  ),
].join("\n");

export async function selectWithClaude(query: string): Promise<ReverseSelection | null> {
  const model = process.env.CLAUDE_MODEL;
  if (!process.env.ANTHROPIC_API_KEY || !model) return null;
  const client = new Anthropic({ timeout: 20_000, maxRetries: 1 });
  try {
    const response = await client.messages.parse({
      model,
      max_tokens: 4000,
      output_config: { effort: "low", format: zodOutputFormat(Selection) },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: query }],
    });
    if (response.stop_reason === "refusal") return null;
    return response.parsed_output ?? null;
  } catch (error) {
    // 入力文は出さない。種類だけ残す
    console.error(
      "reverse: Claude の対応づけに失敗",
      error instanceof Anthropic.APIError ? error.status : "parse",
    );
    return null;
  }
}
