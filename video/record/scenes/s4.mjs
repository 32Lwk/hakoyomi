// S4 質問エージェント（台本 1:10–1:50）：商品カード →［この商品について質問］→「授乳中について書いてある？」
// → 段階表示（検索→照合→出典検証→ガード、実際の件数）→ 回答 → 出典 →「どう答えたか」→ 店内の説明メモ
import { presetStack, waitAnswer } from "./common.mjs";

export const name = "S4-ask";
export const PRODUCT = { id: "med-05883", name: "パブロンSゴールドW錠" };
export const QUESTION = "授乳中について書いてある？";

export async function run(s) {
  const { page } = s;
  await presetStack(s, [PRODUCT.id]);
  await s.goto("/products");
  await page.getByRole("heading", { level: 1, name: PRODUCT.name }).waitFor();
  await s.pause(1200);
  await s.cue(`商品カード：${PRODUCT.name}`);

  await s.tap(page.getByRole("link", { name: "この商品について質問" }));
  await page.getByRole("heading", { name: "医薬品について質問" }).waitFor();
  await page.getByRole("button", { name: `${PRODUCT.name}を話題から外す` }).waitFor();
  await s.pause(1000);
  await s.cue("質問の画面（話題：商品）");

  // 入力欄のすぐ上のよくある質問から押す
  const chips = page.getByRole("list", { name: "よくある質問" }).last();
  await s.tap(chips.getByRole("button", { name: QUESTION }), { scroll: false });
  await s.cue(`質問：${QUESTION}`);
  const turn = await waitAnswer(s, 0);
  await s.pause(300);
  await s.cue("回答（太字の結論）");
  await s.read(3500);

  // 出典を開く
  const evidence = turn.getByText(/^出典（\d+件）$/);
  if (await evidence.count()) {
    await s.tap(evidence.first());
    await s.cue("出典を開いた");
    await s.read(3500);
  }

  // どう答えたか（段階の記録）を開く
  await s.tap(turn.getByText("どう答えたか", { exact: true }));
  await s.show(turn.getByRole("list", { name: "どう答えたか" }), { settle: 600 });
  await s.cue("どう答えたか");
  await s.read(4000);

  // 回答の下の店内の説明メモ
  const memos = turn.getByRole("region", { name: "店内の説明メモ" });
  if (await memos.count()) {
    await s.show(memos, { settle: 700 });
    await s.cue("店内の説明メモ（公的な出典ではありません）");
    await s.read(3500);
  } else {
    await s.cue("（説明メモなし）");
  }
  await s.cue("おわり");
}
