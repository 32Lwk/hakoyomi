// S3 2〜4品の比較（台本 0:45–1:10）：鼻炎の内服薬を3品読む →［比べる］→ 違う行だけ琥珀
import { addByJan, readFirstProduct } from "./common.mjs";

export const name = "S3-compare";
// 既定は「違う行」と「同じ行」が両方ある3品（2026-11-04 の localhost で違う 7／11）。台本の例（アレグラFX／アレジオン20／パブロン鼻炎速溶錠EX）は
// 18行すべてが「違う」になり、琥珀の行だけが目に入る絵にならない（README）。S3_SET=script で台本の例で録る
const SETS = {
  clear: [
    { name: "アレグラFX", jan: "4987188166048" },
    { name: "アレジオン20", jan: "4987300060018" },
    { name: "ストナリニZジェル", jan: "4987316014692" },
  ],
  script: [
    { name: "アレグラFX", jan: "4987188166048" },
    { name: "アレジオン20", jan: "4987300060018" },
    { name: "パブロン鼻炎速溶錠EX", jan: "4987306050594" },
  ],
};
export const PRODUCTS = SETS[process.env.S3_SET ?? "clear"] ?? SETS.clear;

export async function run(s) {
  const { page } = s;
  await readFirstProduct(s, PRODUCTS[0]);
  await s.cue(`1品目：${PRODUCTS[0].name}`);
  await s.read(1500);
  for (const p of PRODUCTS.slice(1)) {
    await addByJan(s, p);
    await s.cue(`読んだ：${p.name}`);
    await s.pause(900);
  }

  await s.tap(page.getByRole("tab", { name: /比べる/ }));
  const table = page.getByRole("table", { name: "商品の比較" });
  await table.waitFor();
  await s.pause(600);
  const count = (await page.getByText(/^違う項目/).first().innerText()).replace(/\s+/g, "");
  await s.cue(`比べる表（${count}）`);
  await s.read(3000);

  // 3品だと3列目が画面の外。表を横に送って3品目を見せ、戻す
  const body = table.locator(":scope > div").nth(1);
  await body.evaluate((el) => el.scrollTo({ left: el.scrollWidth, behavior: "smooth" }));
  await s.read(2000);
  await body.evaluate((el) => el.scrollTo({ left: 0, behavior: "smooth" }));
  await s.read(1200);

  // 違いだけにする
  await s.tap(page.getByRole("button", { name: "違いだけ" }));
  await s.cue("違いだけ");
  await s.read(2500);

  // 下へゆっくり送る。列の見出しは画面の上に残る
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, 300);
    await s.read(1500);
  }
  await s.cue("下まで送っても列の見出しが残る");
  await s.read(1500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await s.read(1200);
  await s.cue("おわり");
}
