// 通知テキスト → Claude で項目・本文・記載条件に構造化 → zod 検証 → 原文照合（T101、開発時のみ）。
// 出力は data/notices/out/ の下書き。ゆうが通知原文と照らして検証してから seed にする（T102）。
//
// 使い方：
//   python3 -I scripts/notice/extract.py data/notices/001742612.pdf data/notices/001742612.pages.json
//   python3 -I scripts/notice/extract.py data/notices/000240698.pdf data/notices/000240698.pages.json  # 漢方製剤
//   npm run notice:structure            # 全薬効群
//   npm run notice:structure -- kaze_1  # 指定した薬効群だけ（kampo なら漢方製剤の全処方）
//   npm run notice:structure -- --recheck  # Claude を呼ばず、保存済みの下書きで照合だけやり直す
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NoticeGroup, type NoticeItem } from "@/lib/schema/notice";
import { guard } from "@/lib/guard/guard";
import {
  DraftOutput,
  NOTICE_SOURCES,
  sliceSource,
  sourcePdf,
  toNoticeItems,
  type Issue,
  type NoticeSource,
  type PageText,
} from "./lib";

const DATA_DIR = "data/notices";
const OUT_DIR = `${DATA_DIR}/out`;

const SYSTEM = `あなたは厚生労働省の通知「使用上の注意」を、プログラムで扱える項目に分ける作業をします。
入力は通知PDFから抽出したテキストで、1つの薬効群の「添付文書等に記載すべき事項」です。改行や空白は PDF 抽出の都合で崩れています。

## 項目の分け方
- 番号のついた記載（「１．」「（３）」など）を1項目にする。子の番号がある親（例「１．次の人は服用しないこと」）も、親の見出しだけを本文とする1項目にする。
- itemNo は半角で「1.」「1.(3)」のように親子をつなぐ。「その他」の項目は小見出しを前に付ける（例「保管及び取扱い上の注意(1)」、番号がなければ小見出しだけ）。本文に「１）」「２）」の書き分けがあり、条件が違うときは別項目にし、itemNo を「3.1)」「3.2)」とする。
- section は「してはいけないこと」「相談すること」のどちらかで、それ以外（その他の注意、用法及び用量に関連する注意、保管及び取扱い上の注意など）は「その他」とする。
- 副作用の表（関係部位・症状）は、その表を含む番号の項目の本文に含める。
- ただし表の行に注番号（「１）」など）で別の記載条件が付いているときは、その行を子の項目に分ける。itemNo は親に「r1」「r2」…を足す（例「2.r1」）。子の本文はその行の文面（関係部位と症状、又は症状の名称と症状）で、重篤な症状の行なら頭に「まれに下記の重篤な症状が起こることがある。その場合は直ちに医師の診療を受けること。」を付ける。子の条件はその注の条件。親の本文には条件のない行だけを残し、条件のない重篤な症状の行がなければ「まれに下記の…」の文も親に入れない。行の注番号は本文から除く。
- 「（９）次の診断を受けた人。高血圧１）２）、…」のように語ごとに注番号で条件が違うときは、条件ごとに子の項目（「1.(9)1)」「1.(9)2)」）に分け、本文は見出しを頭に付けて「次の診断を受けた人。高血圧、心臓病、腎臓病」のように注番号を除いた語だけを並べる。

## 本文（body）
- 通知の文面をそのまま写す。言い換え・要約・補足・表記の統一をしない。全角・半角も原文のまま。崩れた改行・空白だけ詰めてよい。
- 〔 〕で囲まれた記載条件の注記は本文に入れない。

## 記載条件（conditionText と conditionJson）
- conditionText はその項目に係る〔 〕の中の文をそのまま写す。なければ null。
- conditionJson は次の型の JSON 文字列にする（成分名は通知の表記のまま）：
  {"always": true}  条件なし（全製剤に記載）
  {"hasIngredient": ["成分名", ...]}  いずれかを含有する
  {"hasClass": ["抗ヒスタミン剤", ...]}  成分群（通知が成分群で書いているとき）
  {"amountAtLeast": {"ingredients": [...], "as": "換算先（「○○として」のとき）", "value": 数値, "unit": "mg"|"g", "per": "1回"|"1日"}}
  {"dosageForm": ["錠剤", "丸剤", ...]}  剤形（「錠剤」「丸剤」「カプセル剤」のように「剤」まで書く）
  {"usageUnderMonths": 月齢}  その月齢未満の用法がある製剤（生後３ヵ月未満 → 3、１歳未満 → 12、３歳未満 → 36、５歳未満 → 60、小児（の用法及び用量がある）→ 180）
  {"all": [条件, ...]}  {"any": [条件, ...]}  {"not": 条件}
- 「1日最大配合量」は per "1日"、「1回分量」は per "1回"。
- 「ただし，「してはいけないこと」の４．を記載した製剤にあっては記載しない」は excludedBy に {"section","itemNo"} で入れる（conditionJson には入れない）。
- 剤形・用法（小児の用法がある、錠剤の場合など）・年齢の置き換え・各社の承認の範囲など、上の型で表せない条件は、表せる部分だけを式にして needsReview を true、reviewNote に表せなかった点を短く書く。表せる部分がなければ {"always": true}。
- 判断に迷ったときも needsReview を true にする。推測で条件を補わない。
- 一般用漢方製剤の「１日最大配合量が甘草として１ｇ以上（エキス剤については原生薬に換算して１ｇ以上）含有する」は {"amountAtLeast": {"ingredients": ["甘草"], "value": 1, "unit": "g", "per": "1日"}} とする（as は付けない。エキス剤の原生薬換算は商品の入力値が原生薬量なので式で表せている。needsReview にしない）。「マオウ又は、…甘草として１ｇ以上…」は any でつなぐ。
- 番号のない見出し（漢方製剤の「次の人は服用しないこと」など）は itemNo「1.」とし、その下の記載を「1.(1)」のように子の項目にする。
- 「生後３ヵ月未満の用法がある製剤」「小児の用法及び用量がある場合」「５歳未満の幼児の用法がある錠剤・丸剤」「３歳未満の用法及び用量を有する丸剤」「カプセル剤及び錠剤・丸剤以外の製剤」は dosageForm・usageUnderMonths・not で表し、needsReview にしない（例：カプセル剤及び錠剤・丸剤以外 → {"not": {"dosageForm": ["カプセル剤", "錠剤", "丸剤"]}}）。親に「小児の用法がある場合、剤形により…いずれかを記載」とあるときは、子の条件に親の条件を all でつなぐ。親の見出しが記載条件の注記だけなら親は項目にしない。
- 子の項目しか条件に当たらない見出しだけの親（「次の人は服用しないこと」の下が条件つきの子だけ等）は、親の条件を子の条件の any にする。
- 保管及び取扱い上の注意の「（ ）内は必要とする場合に記載」「容器等の個々に至適表示がなされていて…記載しなくてもよい」は商品で判定しない注記なので、条件は {"always": true}、needsReview にしない。

## badge
本文と条件が次に当たるときだけ付ける。迷ったら null。
- abuse：指定濫用防止医薬品の注意（過量服用しないこと）
- drive：乗物又は機械類の運転操作をしないこと
- breastfeeding：授乳に関する記載
- under15：15歳未満の小児に服用させない記載
- under12：12歳未満の小児に服用させない記載
- alcohol：服用前後の飲酒の記載
- caffeine：カフェインを含有する飲料等に関する記載
- doping：ドーピングに関する記載`;

async function structure(client: Anthropic, model: string, source: NoticeSource, text: string) {
  const stream = client.beta.messages.stream({
    model,
    max_tokens: 64000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: betaZodOutputFormat(DraftOutput),
    },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `薬効群：${source.name}\n出典：${sourcePdf(source).url}（${source.pages[0]}〜${source.pages[1]}頁）\n\n<notice>\n${text}\n</notice>`,
      },
    ],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal")
    throw new Error(`${source.id}: Claude が応答を拒否しました`);
  if (message.stop_reason === "max_tokens")
    throw new Error(`${source.id}: 出力が max_tokens で切れました`);
  const json = message.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");
  return DraftOutput.parse(JSON.parse(json)).items;
}

function report(group: NoticeGroup, items: NoticeItem[], issues: Issue[]): string {
  const issuesById = Map.groupBy(issues, (issue) => issue.id);
  const lines = [
    `# ${group.name}（${group.id}）検証用`,
    "",
    `出典：${group.sourceUrl} ${group.sourcePage}頁〜／取得日 ${group.fetchedOn}`,
    `項目 ${items.length}件、指摘 ${issues.length}件。通知原文と照らして本文・条件式・バッジを確認する（T102）。`,
    "",
  ];
  for (const item of items) {
    const marks = issuesById.get(item.id) ?? [];
    lines.push(
      `## ${marks.length ? "⚠ " : ""}${item.section} ${item.itemNo}（${item.id}）`,
      "",
      `- 本文：${item.body}`,
      `- 記載条件：${item.conditionText ?? "なし"}`,
      `- 条件式：\`${JSON.stringify(item.condition)}\``,
      `- 除外：${item.excludedBy.join(", ") || "なし"}`,
      `- バッジ：${item.badge ?? "なし"}`,
      ...marks.map((m) => `- ⚠ ${m.problem}`),
      "",
    );
  }
  return lines.join("\n");
}

async function main() {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // .env.local がなければ環境変数をそのまま使う
  }
  const model = process.env.CLAUDE_MODEL || "claude-opus-5-5";
  const args = process.argv.slice(2);
  const recheck = args.includes("--recheck");
  const only = args.filter((arg) => !arg.startsWith("--"));
  const sources = only.length
    ? NOTICE_SOURCES.filter((s) => only.some((a) => s.id === a || s.id.startsWith(`${a}_`)))
    : NOTICE_SOURCES;
  if (!sources.length) throw new Error(`薬効群が見つかりません：${only.join(", ")}`);

  const pagesOf = (file: string): PageText[] =>
    JSON.parse(readFileSync(`${DATA_DIR}/${file}.pages.json`, "utf8"));
  const fetchedOn = new Date().toISOString().slice(0, 10);
  const client = new Anthropic();
  mkdirSync(OUT_DIR, { recursive: true });

  for (const source of sources) {
    const text = sliceSource(pagesOf(sourcePdf(source).file), source);
    const draftPath = `${OUT_DIR}/${source.id}.draft.json`;
    let drafts;
    if (recheck) {
      drafts = DraftOutput.parse(JSON.parse(readFileSync(draftPath, "utf8"))).items;
    } else {
      console.log(`${source.id}: ${text.length}字を構造化中（${model}）…`);
      drafts = await structure(client, model, source, text);
      writeFileSync(draftPath, JSON.stringify({ items: drafts }, null, 2));
    }
    const { items, issues } = toNoticeItems(source.id, drafts, text);

    // 通知の文面でも禁止語に当たるものがないか見ておく（当たっても通知の原文なので消さず、検証で見る）
    for (const item of items) {
      const result = guard(item.body);
      if (!result.ok)
        issues.push({
          id: item.id,
          problem: `禁止語に当たる（通知の原文。T301 の guard で抜き出しの扱いを決める）：${result.hits.join("、")}`,
        });
    }

    const group = NoticeGroup.parse({
      id: source.id,
      name: source.name,
      sourceUrl: sourcePdf(source).url,
      sourcePage: source.pages[0],
      fetchedOn,
    });
    writeFileSync(`${OUT_DIR}/${source.id}.source.txt`, text);
    writeFileSync(
      `${OUT_DIR}/${source.id}.json`,
      JSON.stringify({ group, items, issues }, null, 2),
    );
    writeFileSync(`${OUT_DIR}/${source.id}.review.md`, report(group, items, issues));
    console.log(
      `${source.id}: 項目 ${items.length}件、指摘 ${issues.length}件 → ${OUT_DIR}/${source.id}.review.md`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
