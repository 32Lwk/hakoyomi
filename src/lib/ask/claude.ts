import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Passage } from "@/lib/ask/corpus";

// 質問エージェント（L-20261103-43/44）の Claude の段。
// ①解釈（会話を踏まえた検索用の質問）②照合（根拠の番号・原文の抜き出し・番号つきの短い説明文）③自己検査。
// 質問文はログに残さない（rules §4-7）。失敗したら null を返し、呼び出し側が検索だけの答えに切り替える

function client(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ timeout: 20_000, maxRetries: 1 });
}

function logFailure(step: string, error: unknown) {
  // 質問文は出さない。種類だけ残す
  console.error(
    `ask: Claude の${step}に失敗`,
    error instanceof Anthropic.APIError ? error.status : "parse",
  );
}

function targetLine(products: string[]): string {
  return products.length
    ? `対象の商品：${products.map((name, i) => `p${i + 1}=${name}`).join("、")}`
    : "対象の商品：なし（通知・手引き全体から）";
}

// ① 解釈 ------------------------------------------------------------------

const Interpretation = z.object({
  question: z
    .string()
    .describe("会話の続きを踏まえて、それだけで意味が通るように直した今の質問（1文）"),
  terms: z
    .array(z.string())
    .max(8)
    .describe(
      "通知「使用上の注意」・添付文書で使われる書き方の検索語（例：眠気、乗物又は機械類の運転操作、授乳、15歳未満の小児）",
    ),
});
export type Interpretation = z.infer<typeof Interpretation>;

const INTERPRET_RULES = [
  "あなたはドラッグストアの登録販売者が使う、医薬品の記載を探す検索の補助です。",
  "販売者の今の質問を、前の質問を踏まえて、それだけで意味が通る1文に直してください（「それ」「この薬」などを具体的にする）。",
  "あわせて、厚労省通知「使用上の注意」や添付文書で使われる書き方の検索語を挙げます。成分名は正式名で。",
  "質問に答えたり判断したりはしません。",
].join("\n");

export async function interpretWithClaude(
  question: string,
  history: string[],
  products: string[],
): Promise<Interpretation | null> {
  const api = client();
  const model = process.env.CLAUDE_MODEL_GUARD || process.env.CLAUDE_MODEL;
  if (!api || !model) return null;
  const before = history.length
    ? `前の質問（古い順）：\n${history.map((h) => `- ${h}`).join("\n")}\n`
    : "前の質問：なし\n";
  try {
    const response = await api.messages.parse({
      model,
      max_tokens: 2000,
      output_config: { effort: "low", format: zodOutputFormat(Interpretation) },
      system: INTERPRET_RULES,
      messages: [
        { role: "user", content: `${targetLine(products)}\n${before}今の質問：${question}` },
      ],
    });
    if (response.stop_reason === "refusal") return null;
    return response.parsed_output ?? null;
  } catch (error) {
    logFailure("解釈", error);
    return null;
  }
}

// ② 照合（抜き出し＋説明文） -------------------------------------------------

const Sentence = z.object({
  text: z.string(),
  ids: z.array(z.string()).describe("この文の根拠の番号（citations に入れた番号）"),
});

const Selection = z.object({
  citations: z
    .array(z.object({ id: z.string(), quote: z.string() }))
    .max(10)
    .describe("質問に答える根拠。quote は根拠の本文からそのまま連続してコピーした部分"),
  conclusion: Sentence.nullable().describe(
    "質問への結論の1文（35字程度まで）。根拠がなければ null",
  ),
  points: z
    .array(Sentence)
    .max(3)
    .describe("「詳しく見る」に出す、結論に足りない記載の中身（各40字程度まで）"),
  byProduct: z
    .array(Sentence.extend({ product: z.string().describe("商品の番号 p1・p2…") }))
    .max(4)
    .describe(
      "商品があるとき（1品でも）、商品ごとの詳しい説明（1〜2文、80字程度まで）。商品がなければ空",
    ),
  followups: z
    .array(z.string())
    .max(3)
    .describe("販売者が続けて確かめると役に立つ、記載についての短い質問（20字程度）"),
});
export type Selection = z.infer<typeof Selection>;

const ANSWER_RULES = [
  "あなたはドラッグストアの登録販売者が使う、使用上の注意などの記載を探す補助です。",
  "販売者の質問に関係する根拠を、下の根拠リスト（検索で見つかった候補）から選び、本文を抜き出し、結論を先に、短く答えてください。",
  "",
  "抜き出し（citations）：",
  "- quote には、根拠の本文から連続した部分を一字一句そのままコピーします。本文全体でもかまいません。記載条件は本文ではないので quote に入れません。",
  "- 関係する根拠がなければ citations は空、conclusion は null にします。推測で広げません。",
  "- 商品が複数あるときは、それぞれの商品（番号の p1・p2…）から関係する根拠を選びます。",
  "- 多くても10件までにし、同じ内容の重複は避けます。",
  "",
  "結論（conclusion）：",
  "- 店頭で先輩が横から短く教えるメモのように、要点だけを1文で（30字程度まで）。",
  "- 質問の形に合わせて、最初に答えそのものを書きます。「何歳から？」なら年齢（例：「15歳から。15歳未満は服用しない。」）、「何錠？」「何回？」なら数、「入っている？」なら入っているか・いないか。確認ポイント（「年齢 15歳から」など）の根拠があれば使います。",
  "- 商品が1つのときは品名を書きません（画面の上に写真と品名が出ます）。商品が複数なら、違いがわかるように品名を入れます。",
  "- 「〜ことになっています」「〜とされています」「〜と記載されています」「〜が挙がっています」のような回りくどい言い方、前置き（「はい、」など）は使いません。",
  "- 項目名（してはいけないこと／相談すること）は画面がタグで出すので、1品のときは結論に書きません。",
  "  良い例：「15歳から。15歳未満は服用しない。」",
  "  良い例：「授乳中は、服用前に相談する人に入っています。」",
  "  良い例：「指定濫用防止医薬品の対象成分は入っていません。」",
  "  良い例：「ロキソニンSだけ、高齢者が相談する人に入っています。」",
  "- 比べる質問（違い・比較など）では、何が違うか（含む成分・分量・項目の有無）を結論の1文で言います（50字程度まで）。違いが複数あるときは、1日最大量・内容量より先に、片方にだけ入っている成分を言います。同じ点・違う点の一覧は画面が表で出します。",
  "  良い例：「ロキソニンSプレミアムだけ、アリルイソプロピルアセチル尿素と無水カフェインが入っています。」",
  "- 「含まれていません」「まだ取り込んでいません」という根拠も事実です。それに当たるときは、その根拠を使って答えます（「記載が見つかりません」にしません）。",
  "",
  "商品ごと（byProduct、商品があるときは1品でも書く）：",
  "- 各商品について、記載の中身を詳しく1〜2文で書きます（80字程度まで）。何が・どういう人が・理由として何が書かれているかを、根拠の言葉を使って具体的に。項目名（してはいけないこと等）は画面がタグで出すので文頭に書きません。",
  "  良い例：「服用後は乗物又は機械類の運転操作をしないこと。眠気や目のかすみ、異常なまぶしさ等があらわれることがある、と書かれています。」",
  "- ids はその商品の根拠（p1 なら p1-…）だけにします。根拠のない商品は入れません（画面が「記載が見つかりません」と出します）。",
  "- 記載条件（どの成分を含む製剤に書く項目か）の仕組みの説明は書きません。商品の根拠は、その商品が条件に当たると判定済みです。",
  "",
  "要点（points）：",
  "- 画面の「詳しく見る」に出す、結論に足りない記載の中身を0〜3件。どういう人が対象か・理由として書かれていること・同じ商品のほかの関係する項目（例：15歳未満のほかに「相談すること」に挙がっている人）を、根拠の言葉で具体的に。結論の言い直しは書きません。",
  "- 全体から答えるとき（商品なし）は、どの成分を含む製剤の記載かも短く添えます。",
  "",
  "すべての文について：",
  "- 書いてよいのは、抜き出した根拠に書かれていること（記載条件・出典名を含む）だけです。根拠にない知識・数値・理由・一般論は足しません。数値は根拠の書き方のまま写します。計算しません。",
  "- 各文の ids には、その文の根拠として citations に入れた番号を必ず入れます。出典名・項目番号は画面に出るので文には書きません。",
  "- その人が服用・使用できるか、受診すべきか、販売してよいかの判断、商品の優劣・推奨・順位は書きません。そのような質問でも、関係する記載を伝えるだけです。",
  "",
  "続けて聞ける質問（followups、0〜3件）：",
  "- 今の話題の商品・成分について、販売者が次に記載を確かめると役に立つ質問を短く挙げます（例：「授乳中についての記載は？」「眠くなる成分は入っている？」）。",
  "- 可否・推奨・優劣を尋ねる質問にはしません。",
].join("\n");

// 商品の根拠の通知項目は、商品の成分が記載条件に当たるとコードで判定済み（applicableItems）。それを Claude に伝える
export function conditionNote(p: Pick<Passage, "condition" | "productId">): string {
  if (!p.condition) return "";
  return p.productId
    ? `（記載条件：${p.condition}。この商品の成分はこの条件に当たると判定済み）`
    : `（記載条件：${p.condition}）`;
}

function list(passages: Passage[]): string {
  return passages
    .map((p) => `[${p.id}] ${p.text}${conditionNote(p)}（出典：${p.source.label}）`)
    .join("\n");
}

export async function answerWithClaude(
  question: string,
  passages: Passage[],
  products: string[],
): Promise<Selection | null> {
  const api = client();
  const model = process.env.CLAUDE_MODEL;
  if (!api || !model) return null;
  try {
    const response = await api.messages.parse({
      model,
      max_tokens: 6000,
      output_config: { effort: "low", format: zodOutputFormat(Selection) },
      system: ANSWER_RULES,
      messages: [
        {
          role: "user",
          content: `根拠リスト：\n${list(passages)}\n\n${targetLine(products)}\n質問：${question}`,
        },
      ],
    });
    if (response.stop_reason === "refusal") return null;
    return response.parsed_output ?? null;
  } catch (error) {
    logFailure("照合", error);
    return null;
  }
}

// ③ 自己検査 ----------------------------------------------------------------

const Review = z.object({
  results: z.array(
    z.object({
      no: z.number().int(),
      supported: z.boolean().describe("文の内容がすべて、示した根拠の本文に書かれている"),
      neutral: z
        .boolean()
        .describe(
          "個人への服用・使用の可否、受診の要否、販売の可否、商品の優劣・推奨を述べていない",
        ),
    }),
  ),
});

const REVIEW_RULES = [
  "あなたは医薬品の記載の説明文を検査する係です。各文について、示した根拠の本文だけで内容が支えられているか（supported）と、",
  "個人への服用・使用の可否、受診の要否、販売の可否、商品の優劣・推奨を述べていないか（neutral）を判定します。",
  "出典名（薬効群・項目・商品名など）に書かれていることは根拠に含めます。根拠にない内容・数値・理由が少しでも足されていれば supported は false です。迷うときは false にします。",
  "商品の一般的な情報の言い直し（「15歳から」のような記載・確認ポイントの年齢の区切り、項目に挙がっている人）は、特定の人への判断ではないので neutral は true です。",
].join("\n");

// 通った文の番号（0始まり）を返す。検査できなければ null（呼び出し側は説明文を出さない）
export async function reviewWithClaude(
  sentences: { text: string; quotes: string[] }[],
): Promise<Set<number> | null> {
  if (!sentences.length) return new Set();
  const api = client();
  const model = process.env.CLAUDE_MODEL_GUARD || process.env.CLAUDE_MODEL;
  if (!api || !model) return null;
  const body = sentences
    .map((s, i) => `文${i}：${s.text}\n根拠：\n${s.quotes.map((q) => `- ${q}`).join("\n")}`)
    .join("\n\n");
  try {
    const response = await api.messages.parse({
      model,
      max_tokens: 2000,
      output_config: { effort: "low", format: zodOutputFormat(Review) },
      system: REVIEW_RULES,
      messages: [{ role: "user", content: body }],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return null;
    return new Set(
      response.parsed_output.results.filter((r) => r.supported && r.neutral).map((r) => r.no),
    );
  } catch (error) {
    logFailure("自己検査", error);
    return null;
  }
}
