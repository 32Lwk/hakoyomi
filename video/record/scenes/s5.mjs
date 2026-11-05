// S5 逆引き → 棚（台本 2:05–2:25）：探すの検索欄に「鼻水」→ 効能・効果の語で探す →
// ワンタップ条件「眠気注意なし」→ 1行ピルの逆引きと商品一覧 →［棚 6B-5］→ 店内マップと正面図
export const name = "S5-reverse-shelf";
export const TERM = "鼻水";
export const PICK = process.env.S5_PICK ?? "アレグラFX";

export async function run(s) {
  const { page } = s;
  await s.goto("/");
  await s.pause(800);
  await s.cue("探す画面");

  // 検索欄に入力
  const searchInput = page.getByRole("searchbox").or(page.getByLabel("品名・メーカー・成分名で探す")).first();
  await s.type(searchInput, TERM, { delay: 120 });
  await s.pause(400);

  // 「鼻水」を効能・効果の語で探す
  await s.tap(page.getByRole("button", { name: `「${TERM}」を効能・効果の語で探す` }));
  const reverseTitle = page.locator("#reverse-title");
  await reverseTitle.waitFor({ timeout: 40_000 });
  await s.cue(`逆引き1行ピル：${(await reverseTitle.innerText()).replace(/\s+/g, " ")}`);
  await s.read(1500);

  // ワンタップ条件チップ「眠気注意なし」をタップ
  const chipDrowsy = page.getByRole("button", { name: "眠気注意なし" }).first();
  if (await chipDrowsy.count()) {
    await s.tap(chipDrowsy);
    await s.cue("ワンタップ条件：眠気注意なし");
    await s.pause(800);
  }

  // 品名順の一覧（スクロール不要ですぐに見える）
  const count = page.getByText(/^\d+品$/).first();
  await count.waitFor();
  await s.show(count, { settle: 600 });
  await s.cue(`一覧：${await count.innerText()}（品名順）`);
  await s.read(2000);

  // 商品行の「棚」直行ボタンをタップ
  const rows = page.locator("li").filter({ hasText: PICK });
  const targetRow = (await rows.count()) ? rows.first() : page.locator("li").filter({ hasText: "棚" }).first();
  const shelfBtn = targetRow.getByRole("button", { name: /棚/ }).first();

  if (await shelfBtn.count()) {
    await s.cue(`商品から棚へ直行：${await shelfBtn.innerText()}`);
    await s.tap(shelfBtn);
  } else {
    // なければ商品詳細経由
    await s.tap(targetRow);
    const shelfLink = page.getByRole("link", { name: "棚で見る" });
    await shelfLink.waitFor();
    await s.tap(shelfLink);
  }

  // 売場図・棚の表示
  await page.getByRole("heading", { name: "売場図" }).waitFor({ timeout: 10000 });
  await s.pause(600);
  const where = page.getByRole("list", { name: "読んだ商品の場所" }).getByRole("button").first();
  if (await where.count()) {
    await s.cue(`棚：売場図（${(await where.innerText()).replace(/\s+/g, " ")}）`);
    await s.read(2000);
    // 場所の行を押して正面図へ
    await s.tap(where);
    const front = page.getByRole("dialog");
    await front.waitFor();
    await s.pause(500);
    await s.cue("棚：正面図（琥珀色にハイライト）");
    await s.read(3000);
  }

  await s.cue("おわり");
  await s.pause(600);
}
