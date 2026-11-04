// S6 受け継ぐ（台本 2:25–2:42）：ベテラン（模擬）が成分にメモを書いて保存 →
// 推薦の言葉を入れたメモが止まる（ガード）→ 同じ成分を含む別の商品を読むと、同じメモが出る。
// メモは本物の Supabase に保存されるので、録り終えたら作った分だけ消す（cleanupMemos、record.mjs が必ず呼ぶ）
import { BASE_URL } from "../lib.mjs";
import { addByJan, presetStack } from "./common.mjs";

export const name = "S6-memo";
// ジヒドロコデインリン酸塩を含む2品（成分のメモは、その成分を含む商品すべてに出る）
export const FIRST = { id: "med-05883", name: "パブロンSゴールドW錠" };
export const SECOND = { name: "新ルル-A錠s", jan: "4987107673398" };
export const INGREDIENT = "ジヒドロコデインリン酸塩";
// 説明の仕方だけ（勧めない・お客様の情報を書かない）
export const MEMO_BODY =
  "濫用防止の対象の成分。購入の数量と、同じ成分の薬をほかで買っていないかを先に確かめる";
// わざと止まる文（推薦の言葉）。この場面でだけ使う
export const BLOCKED_BODY = "頭痛ならこれがおすすめ";

// デモ用のメモ（…0401〜0403）は消さない
const DEMO_MEMO = /^00000000-0000-4000-8000-00000000040\d$/;
const created = new Set();

export async function run(s) {
  const { page } = s;
  page.on("response", async (res) => {
    if (res.request().method() !== "POST" || !res.url().endsWith("/api/memos")) return;
    if (res.status() !== 201) return;
    const id = (await res.json().catch(() => null))?.memo?.id;
    if (id && !DEMO_MEMO.test(id)) created.add(id);
  });

  await presetStack(s, [FIRST.id]);
  await s.goto("/products");
  await page.locator("article h1", { hasText: FIRST.name }).waitFor();
  await s.pause(1000);
  await s.cue(`商品カード：${FIRST.name}`);

  // 店内の説明メモの欄まで送る
  const section = page.getByRole("region", { name: /店内の説明メモ/ });
  await section.getByText("読み込み中…").waitFor({ state: "hidden" });
  await s.show(page.getByRole("heading", { name: /店内の説明メモ/ }), { settle: 900 });
  await s.cue("店内の説明メモ（いまのメモ）");
  await s.read(2000);

  // 1. 成分にメモを書いて保存
  await s.tap(section.getByRole("button", { name: "説明メモを書く" }));
  await s.pause(500);
  const target = section.getByLabel("付ける先");
  await s.tap(target, { after: 200 });
  await target.selectOption({ label: `成分：${INGREDIENT}` });
  await s.pause(700);
  await s.show(section.getByText(`成分のメモは、${INGREDIENT}を含む商品すべてに出ます`), { settle: 600 });
  await s.cue(`付ける先：成分：${INGREDIENT}（書いた人：ベテラン（模擬））`);
  await s.type(section.getByLabel("メモの本文"), MEMO_BODY, { delay: 85 });
  await s.tap(section.getByRole("button", { name: "確かめて保存" }));
  await s.cue("確かめて保存（guard）");
  await section.getByRole("listitem").filter({ hasText: MEMO_BODY }).waitFor({ timeout: 40_000 });
  await s.pause(400);
  await s.show(section.getByRole("listitem").filter({ hasText: MEMO_BODY }), { settle: 600 });
  await s.cue("保存された");
  await s.read(2500);

  // 2. 推薦の言葉を入れたメモは止まる
  await s.tap(section.getByRole("button", { name: "説明メモを書く" }));
  await s.type(section.getByLabel("メモの本文"), BLOCKED_BODY, { delay: 150 });
  await s.tap(section.getByRole("button", { name: "確かめて保存" }));
  const alert = section.getByRole("alert");
  await alert.waitFor({ timeout: 40_000 });
  await s.show(alert, { settle: 500 });
  await s.cue(`止まった：${(await alert.innerText()).replace(/\s+/g, " ")}`);
  await s.read(3500);
  await s.tap(section.getByRole("button", { name: "やめる" }));

  // 3. 同じ成分を含む別の商品を読む → 同じメモが出る
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await s.pause(900);
  await addByJan(s, SECOND);
  await page.getByRole("heading", { level: 1, name: SECOND.name }).waitFor();
  await s.cue(`別の商品：${SECOND.name}`);
  await s.read(1500);
  const memo = page
    .getByRole("region", { name: /店内の説明メモ/ })
    .getByRole("listitem")
    .filter({ hasText: MEMO_BODY });
  await memo.waitFor();
  await s.show(memo, { settle: 900 });
  await s.cue("同じメモが出た（成分：ジヒドロコデインリン酸塩）");
  await s.read(3500);
  await s.cue("おわり");
}

// この場面で作ったメモを消す。応答で拾った id に加え、本文が同じメモ（前の回の消し残し）も消す
export async function cleanupMemos() {
  try {
    const res = await fetch(`${BASE_URL}/api/memos?productIds=${FIRST.id}`);
    const json = await res.json();
    for (const p of json.products ?? [])
      for (const m of p.memos ?? [])
        if ((m.body === MEMO_BODY || m.body === BLOCKED_BODY) && !DEMO_MEMO.test(m.id))
          created.add(m.id);
  } catch (e) {
    console.error(`メモの一覧を読めませんでした：${e.message}`);
  }
  for (const id of created) {
    if (DEMO_MEMO.test(id)) continue;
    const res = await fetch(`${BASE_URL}/api/memos/${id}`, { method: "DELETE" }).catch((e) => e);
    const status = res instanceof Error ? res.message : res.status;
    console.log(`メモを消した ${id} → ${status}`);
    if (res.status === 204 || res.status === 404) created.delete(id);
  }
  if (created.size) console.error(`消せなかったメモ：${[...created].join(", ")}`);
}
