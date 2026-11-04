// S5 逆引き → 棚（台本 2:05–2:25）：探すの検索欄に「鼻水」→ 効能・効果の語で探す →
// 含まない「運転注意の成分を含まない」→ 品名順の一覧 → 1品を選ぶ →［棚で見る］→ 店内マップと正面図
export const name = "S5-reverse-shelf";
export const TERM = "鼻水";
// 一覧から選ぶ商品（含まないの条件のあとに一覧に残るもの。なければ一覧の先頭）
export const PICK = process.env.S5_PICK ?? "アレグラFX";

export async function run(s) {
  const { page } = s;
  await s.goto("/");
  await s.pause(1200);
  await s.cue("探す画面");

  await s.type(page.getByRole("searchbox").or(page.getByLabel("品名・メーカー・成分名で探す")).first(), TERM, {
    delay: 200,
  });
  await s.pause(600);
  await s.tap(page.getByRole("button", { name: `「${TERM}」を効能・効果の語で探す` }));
  const panel = page.getByRole("region", { name: "承認基準の効能・効果の語" });
  await panel.waitFor({ timeout: 40_000 });
  await s.pause(500);
  await s.cue(`逆引き：${(await panel.innerText()).replace(/\s+/g, " ").slice(0, 120)}`);
  await s.read(3500);

  // 含まない →「運転注意の成分を含まない」
  await s.tap(page.getByRole("button", { name: /^含まない/ }));
  const sheet = page.getByRole("dialog", { name: "含まない成分で絞る" });
  await sheet.waitFor();
  await s.pause(600);
  await s.tap(sheet.getByRole("checkbox", { name: "運転注意の成分を含まない" }));
  const showBtn = sheet.getByRole("button", { name: /品を表示$/ });
  await s.cue(`含まない：運転注意の成分を含まない（${await showBtn.innerText()}）`);
  await s.read(1500);
  await s.tap(showBtn);
  await sheet.waitFor({ state: "hidden" });

  // 品名順の一覧
  const count = page.getByText(/^\d+品$/).first();
  await count.waitFor();
  await s.show(count, { settle: 800 });
  await s.cue(`一覧：${await count.innerText()}（品名順）`);
  await s.read(3000);
  await page.mouse.wheel(0, 260);
  await s.read(2000);

  // 1品を選ぶ → 商品 →［棚で見る］
  // 一覧の行（「効能の語」が付いている行）。「＋追加」のボタンではなく行そのものを押す
  const rows = page.getByRole("button").filter({ hasText: "効能の語" });
  let item = rows.filter({ hasText: PICK }).first();
  if (!(await item.count())) item = rows.first();
  await s.tap(item);
  await page.getByRole("link", { name: "棚で見る" }).waitFor();
  const picked = (await page.locator("article h1").first().innerText()).trim();
  await s.cue(`商品カード：${picked}`);
  await s.read(1800);
  await s.tap(page.getByRole("link", { name: "棚で見る" }));
  await page.getByRole("heading", { name: "売場図" }).waitFor();
  await s.pause(800);
  const where = page.getByRole("list", { name: "読んだ商品の場所" }).getByRole("button").first();
  await s.cue(`棚：売場図（${(await where.innerText()).replace(/\s+/g, " ")}）`);
  await s.read(3000);

  // 場所の行を押す → 棚の正面図（選んだ商品の位置が琥珀）
  await s.tap(where);
  const front = page.getByRole("dialog");
  await front.waitFor();
  await s.pause(600);
  await s.cue("棚：正面図");
  await s.read(4000);
  await s.cue("おわり");
}
