// S2 JANを読む → バッジ → 根拠（L-20261104-24：ベテランでないと戸惑う確認を、新人でも自信を持って答える）
// 主役は「コルゲンコーワIB透明カプセルαプラス」（濫用防止・運転・授乳・年齢・飲酒・カフェイン・ドーピング・ゼラチンのバッジがそろう）。
// カメラで箱を読むところは実写（ヘッドレスにカメラがないので JAN を手入力）。
export const name = "S2-jan-badges";
export const PRODUCT = { name: "コルゲンコーワIB透明カプセルαプラス", jan: "4987067277100" };

export async function run(s) {
  const { page } = s;
  await s.goto("/");
  await s.pause(1200);
  await s.cue("探す画面");
  await s.tap(page.getByRole("button", { name: /^JANを読む/ }).first());
  const sheet = page.getByRole("dialog", { name: "JANを読む" });
  await sheet.waitFor();
  await s.cue("読み取りシート");
  await s.pause(700);
  await s.type(sheet.getByLabel("JAN または品名"), PRODUCT.jan, { delay: 100 });
  await s.tap(sheet.getByRole("button", { name: "読む", exact: true }));

  const badges = page.getByRole("list", { name: "この商品のバッジ" });
  await badges.waitFor();
  await s.pause(500);
  await s.cue(`商品カード：${PRODUCT.name}`);
  await s.read(1500);

  // 接客前チェック（先輩ならここを確認する）
  const checklist = page.locator('section[aria-label="接客前の確認チェック"]');
  if (await checklist.count()) {
    await s.show(checklist, { block: "center", settle: 800 });
    await s.cue("接客前チェック（先輩ならここを確認する）");
    await s.read(2800);
  }

  await s.show(badges, { block: "start", settle: 900 });
  await s.cue(`バッジ：${(await badges.getByRole("button").allInnerTexts()).join("／")}`);
  await s.read(3200);

  // 根拠シートを順に開く：ドーピング → ゼラチン等（ハラール）→ 授乳中
  for (const label of [/ドーピング/, /ゼラチン/, /授乳/]) {
    const chip = badges.getByRole("button", { name: label });
    if (!(await chip.count())) continue;
    await s.tap(chip.first());
    const evidence = page.getByRole("dialog");
    await evidence.waitFor();
    await s.cue(`根拠シート：${(await evidence.getByRole("heading").first().innerText()).trim()}`);
    await s.read(3800);
    await evidence.evaluate((el) => {
      const box = [el, ...el.querySelectorAll("*")].find(
        (n) => n.scrollHeight > n.clientHeight + 20 && getComputedStyle(n).overflowY !== "visible",
      );
      box?.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
    });
    await s.read(2600);
    await s.tap(evidence.getByRole("button", { name: "Close" }));
    await s.pause(700);
  }
  await s.cue("おわり");
  await s.pause(800);
}
