// S6 受け継ぐ（台本 2:25–2:42）：ベテラン（模擬）が成分にメモを書いて保存 →
// 推薦の言葉を入れたメモが止まる（ガード）→ 同じ成分を含む別の商品（新ルル）を開くと、
// 画面最上部に「先輩から受け継がれた接客のコツ」として自動反映される！
import { BASE_URL } from "../lib.mjs";
import { addByJan, presetStack } from "./common.mjs";

export const name = "S6-memo";
export const FIRST = { id: "med-05883", name: "パブロンSゴールドW錠" };
export const SECOND = { name: "新ルル-A錠s", jan: "4987107673398" };
export const INGREDIENT = "ジヒドロコデインリン酸塩";
export const MEMO_BODY =
  "濫用防止の対象の成分。購入の数量と、同じ成分の薬をほかで買っていないかを先に確かめる";
export const BLOCKED_BODY = "頭痛ならこれがおすすめ";

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
  await s.pause(800);
  await s.cue(`商品カード：${FIRST.name}`);

  // 店内の説明メモの欄まで送る
  const section = page.locator('section[aria-labelledby="memo-title"]');
  await s.show(page.getByRole("heading", { name: /店内の説明メモ/ }), { settle: 600 });
  await s.cue("店内の説明メモ（いまのメモ）");
  await s.pause(1000);

  // 1. 成分にメモを書いて保存
  await s.tap(section.getByRole("button", { name: "説明メモを書く" }));
  await s.pause(400);
  const target = section.getByLabel("付ける先");
  await s.tap(target, { after: 200 });
  await target.selectOption({ label: `成分：${INGREDIENT}` });
  await s.pause(500);

  // 自動共有先プレビューを確認
  const autoShareNotice = section.getByText("1つの成分メモが同一成分を含む全商品へ自動共有されます");
  if (await autoShareNotice.count()) {
    await s.show(autoShareNotice, { settle: 500 });
    await s.cue("成分メモ：全対象商品へ自動共有プレビュー");
    await s.read(1500);
  }

  await s.type(section.getByLabel("メモの本文"), MEMO_BODY, { delay: 60 });
  await s.tap(section.getByRole("button", { name: "確かめて保存" }));
  await s.cue("確かめて保存（guard検査）");
  await section.getByRole("listitem").filter({ hasText: MEMO_BODY }).waitFor({ timeout: 40_000 });
  await s.pause(400);
  await s.show(section.getByRole("listitem").filter({ hasText: MEMO_BODY }), { settle: 500 });
  await s.cue("保存成功：公的根拠と照合済み");
  await s.read(1800);

  // 2. 推薦の言葉を入れたメモは止まる
  await s.tap(section.getByRole("button", { name: "説明メモを書く" }));
  await s.type(section.getByLabel("メモの本文"), BLOCKED_BODY, { delay: 100 });
  await s.tap(section.getByRole("button", { name: "確かめて保存" }));
  const alert = section.getByRole("alert");
  await alert.waitFor({ timeout: 40_000 });
  await s.show(alert, { settle: 500 });
  await s.cue(`禁止語ガード発動：${(await alert.innerText()).replace(/\s+/g, " ")}`);
  await s.read(2500);
  await s.tap(section.getByRole("button", { name: "やめる" }));

  // 3. 同じ成分を含む別の商品（新ルル-A錠s）を開く → 最上部に自動反映される！
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await s.pause(600);
  await addByJan(s, SECOND);
  await page.getByRole("heading", { level: 1, name: SECOND.name }).waitFor();
  await s.cue(`別の商品を開く：${SECOND.name}`);
  await s.read(1000);

  // 画面最上部に自動浮上した「先輩から受け継がれた接客のコツ」バナー
  const inheritedBanner = page.locator('section[aria-label="先輩から受け継がれた接客のコツ"]');
  await inheritedBanner.waitFor({ timeout: 10000 });
  await s.show(inheritedBanner, { block: "center", settle: 800 });
  await s.cue("最上部に自動反映：先輩から受け継がれた接客のコツ");
  await s.read(3500);
  await s.cue("おわり");
}

export async function cleanupMemos() {
  try {
    const res = await fetch(`${BASE_URL}/api/memos?productIds=${FIRST.id}`);
    const json = await res.json();
    for (const p of json.products ?? [])
      for (const m of p.memos ?? [])
        if ((m.body === MEMO_BODY || m.body === BLOCKED_BODY) && !DEMO_MEMO.test(m.id))
          created.add(m.id);
  } catch (e) {
    console.error("cleanupMemos error:", e.message);
  }
  for (const id of created) {
    try {
      await fetch(`${BASE_URL}/api/memos/${id}`, { method: "DELETE" });
    } catch {
      // ignore
    }
  }
}
