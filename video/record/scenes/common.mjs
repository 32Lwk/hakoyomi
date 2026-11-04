// 場面をまたいで使う操作

// 読み取りシートに JAN を打って読む（ヘッドレスではカメラが使えないため）。シートはどこから開いても同じ
export async function enterJan(s, jan) {
  const sheet = s.page.getByRole("dialog", { name: "JANを読む" });
  await sheet.waitFor();
  await s.pause(500);
  await s.type(sheet.getByLabel("JAN または品名"), jan, { delay: 80, after: 400 });
  await s.tap(sheet.getByRole("button", { name: "読む", exact: true }));
  await sheet.waitFor({ state: "hidden" });
}

// 探す画面から1品読む → 商品カードが出るまで
export async function readFirstProduct(s, product) {
  await s.goto("/");
  await s.pause(1000);
  await s.tap(s.page.getByRole("button", { name: /^JANを読む/ }).first());
  await enterJan(s, product.jan);
  await s.page.getByRole("heading", { level: 1, name: product.name }).waitFor();
}

// 商品の画面の「追加」→ JAN で足す
export async function addByJan(s, product) {
  const { page } = s;
  // 2品目からは少し速く（同じ操作のくり返しなので）
  await s.tap(page.getByRole("button", { name: "追加", exact: true }), { before: 300, after: 400 });
  const picker = page.getByRole("dialog", { name: "商品を追加" });
  await picker.waitFor();
  await s.tap(picker.getByRole("button", { name: /JAN/ }).first(), { before: 300, after: 300 });
  await enterJan(s, product.jan);
  // 追加のシートが残っていれば閉じる
  if (await picker.isVisible()) await s.tap(picker.getByRole("button", { name: "Close" }));
  await page.getByRole("heading", { level: 1, name: product.name }).waitFor();
}

const escape = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 前の場面で読んだ商品を「商品」に積んだ状態から始める（読む操作は S2・S3 で見せている）。
// タブを開いた最初の1回だけ入れる（あとで足した商品を上書きしない）
export async function presetStack(s, ids) {
  await s.context.addInitScript((saved) => {
    try {
      if (!sessionStorage.getItem("hakoyomi.stack"))
        sessionStorage.setItem("hakoyomi.stack", JSON.stringify(saved));
    } catch {}
  }, { ids, currentId: ids.at(-1) });
}

// 質問を送ってから答えが出るまで。段階が1つ終わるごとに目印を付ける
export async function waitAnswer(s, turnIndex, timeout = 40_000) {
  const { page } = s;
  const turn = page.getByRole("list", { name: "やりとり" }).locator(":scope > li").nth(turnIndex);
  await turn.waitFor();
  const done = turn.getByText("どう答えたか", { exact: true });
  const deadline = Date.now() + timeout;
  let seen = 0;
  for (;;) {
    if (await done.isVisible().catch(() => false)) break;
    if (await turn.getByText("質問を送れませんでした", { exact: false }).isVisible().catch(() => false))
      throw new Error("回答が失敗した");
    // 終わった段階（チェックの印つき）だけ数える。動いている段階の行は文が変わるので数えない
    const live = turn
      .getByRole("list", { name: "どう答えたか" })
      .locator(":scope > li")
      .filter({ has: page.getByLabel("済み") });
    const n = await live.count().catch(() => 0);
    for (let i = seen; i < n; i++) {
      const text = (await live.nth(i).innerText().catch(() => "")).replace(/\s+/g, " ").trim();
      if (text) await s.cue(`段階：${text}`);
    }
    seen = Math.max(seen, n);
    if (Date.now() > deadline) throw new Error(`回答が ${timeout / 1000} 秒で出なかった`);
    await new Promise((r) => setTimeout(r, 150));
  }
  return turn;
}
