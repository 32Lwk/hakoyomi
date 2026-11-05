// S2b 指定濫用防止医薬品の確認・記録（2026年5月施行対応）
import { presetStack } from "./common.mjs";

export const name = "S2b-abuse-record";
export const PRODUCT_ID = "shin-lulu-a-s";

export async function run(s) {
  const { page } = s;
  await presetStack(s, [PRODUCT_ID]);
  await s.goto("/products");
  await page.locator("article h1").waitFor({ timeout: 10000 });

  // 商品カードの「指定濫用防止医薬品の確認・記録」バナー
  const abuseBanner = page.getByRole("button", { name: /指定濫用防止医薬品/ });
  await abuseBanner.waitFor({ timeout: 10000 });
  await s.show(abuseBanner, { block: "center", settle: 600 });
  await s.cue("指定濫用防止医薬品バナー");
  await s.read(1200);

  // バナーをタップして確認シートを開く
  await s.tap(abuseBanner);
  const sheet = page.getByRole("dialog");
  await sheet.waitFor();
  await s.cue("確認・記録シート（2026年5月施行対応）");
  await s.pause(800);

  // 系列店舗タイムラインを見せる
  const timeline = sheet.locator("section").filter({ hasText: "直近の系列店舗での確認記録" });
  if (await timeline.count()) {
    await s.show(timeline, { block: "center", settle: 600 });
    await s.cue("系列店舗タイムライン（匿名・PII非保持）");
    await s.read(1800);
  }

  // 大容量・複数個の理由確認（オ）をタップしてチェック
  const itemO = sheet.getByRole("checkbox", { name: /オ\./ });
  if (await itemO.count()) {
    await s.tap(itemO);
    await s.pause(500);
  }

  // 確認を記録して販売記録の下書きを作成 ボタンをタップ
  const submitBtn = sheet.getByRole("button", { name: /確認を記録|販売記録/ });
  await s.show(submitBtn, { block: "center", settle: 500 });
  await s.tap(submitBtn);
  await s.cue("確認記録の下書き作成（Claude自動生成）");
  await s.pause(1500);

  // 下書きコピーボタン
  const copyBtn = sheet.getByRole("button", { name: /下書きをコピー/ });
  if (await copyBtn.count()) {
    await s.show(copyBtn, { block: "center", settle: 500 });
    await s.tap(copyBtn);
    await s.cue("下書きコピー完了");
    await s.pause(1200);
  }

  await s.cue("おわり");
  await s.pause(800);
}
