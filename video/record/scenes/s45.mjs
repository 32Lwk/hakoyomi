// S4.5 聞けること（台本 1:50–2:05）：質問の画面で品名を打って商品を選ぶ →「聞けること」を開く →
// 「何歳から？」を押す → 続けて「カフェインは入っている？」「ドーピングの禁止成分は？」を打って送る
import { waitAnswer } from "./common.mjs";

export const name = "S4.5-askable";
// 年齢・カフェイン・ドーピング禁止成分の3つとも答えがある商品
export const PRODUCT = { id: "lulu-attack-nx", name: "ルルアタックNX" };
export const QUESTIONS = ["何歳から？", "カフェインは入っている？", "ドーピングの禁止成分は？"];

export async function run(s) {
  const { page } = s;
  await s.goto("/ask");
  await page.getByRole("heading", { name: "医薬品について質問" }).waitFor();
  await s.pause(1000);
  await s.cue("質問の画面");

  // 品名を打つと一覧が絞られる → 商品を選ぶ
  await s.type(page.getByLabel("質問", { exact: true }), PRODUCT.name, { delay: 120 });
  await s.tap(page.getByRole("button", { name: `${PRODUCT.name}を話題に足す`, exact: true }).first());
  await page.getByRole("button", { name: `${PRODUCT.name}を話題から外す` }).waitFor();
  await s.cue(`話題：${PRODUCT.name}`);

  // 聞けること（種類別の一覧）を開く
  const askable = page.locator("details").filter({ hasText: "聞けること" }).first();
  await s.tap(askable.getByText("聞けること", { exact: true }));
  await s.cue("聞けること（一覧）");
  await s.read(3000);

  // 1問目は一覧から押す
  await s.tap(askable.getByRole("button", { name: QUESTIONS[0], exact: true }));
  await s.cue(`質問1：${QUESTIONS[0]}`);
  let turn = await waitAnswer(s, 0);
  await s.cue(`答え1：${await conclusion(turn)}`);
  await s.read(3000);

  // 2問目・3問目は入力欄に打って送る
  for (const [i, q] of QUESTIONS.slice(1).entries()) {
    await s.type(page.getByLabel("質問", { exact: true }), q, { delay: 110, after: 400 });
    await s.tap(page.getByRole("button", { name: "質問する" }), { scroll: false });
    await s.cue(`質問${i + 2}：${q}`);
    turn = await waitAnswer(s, i + 1);
    await s.cue(`答え${i + 2}：${await conclusion(turn)}`);
    await s.read(3200);
  }
  await s.cue("おわり");
}

// 結論（タグの次の、句点で終わる最初の行）。README とナレーション合わせ用に記録する
async function conclusion(turn) {
  const card = turn.locator(":scope > div").nth(1);
  const lines = (await card.innerText().catch(() => ""))
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return (lines.find((l) => l.length > 6 && /。/.test(l)) ?? lines.slice(0, 3).join(" / ")).slice(0, 160);
}
