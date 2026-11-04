// ハコよみ デモ動画（T603）の画面録画の共通部品（L-20261104-19）。
// 1場面＝1つのブラウザの文脈＝1本の webm。動きは人の操作に見えるよう、間・1字ずつの入力・読む時間を入れる。
import { spawnSync } from "node:child_process";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
export const BASE_URL = (process.env.BASE_URL ?? "https://hakoyomi.yutok.dev").replace(/\/$/, "");
export const OUT_DIR = path.join(here, "out");
const RAW_DIR = path.join(OUT_DIR, ".raw");

// 速さの倍率（SPEED=0.5 で間を半分に。確かめるとき用。本番の収録は 1）
const SPEED = Number(process.env.SPEED ?? "1") || 1;
// 押した場所に丸を出す（画面録画にはマウスが映らないため）。TAP=0 で消す
const SHOW_TAP = process.env.TAP !== "0";
const HEADED = process.env.HEADED === "1";
const SHOTS = process.env.SHOTS === "1";

// DEVICE=ipad で iPad 縦（820×1180）。出力名は JD-ipad-<場面>（Remotion の JanDemo 用。S2〜S6 の名前と取り違えない）
export const DEVICE = process.env.DEVICE === "ipad" ? "ipad" : "iphone";
export const VIEWPORT = DEVICE === "ipad" ? { width: 820, height: 1180 } : { width: 390, height: 844 };
const SCALE = 2;

// Claude の回答は長くかかる（段階表示が出きるまで）
export const ANSWER_TIMEOUT = 40_000;

export function wait(ms) {
  return new Promise((r) => setTimeout(r, Math.round(ms * SPEED)));
}

// 押した場所に薄い紺の丸（design.md の濃紺 #1E3A5F）を出す。ページの中身は変えない
const HIDE_DEV = `
(() => {
  const kill = () => document.querySelectorAll("nextjs-portal").forEach((e) => e.remove());
  new MutationObserver(kill).observe(document, { childList: true, subtree: true });
  kill();
})();
`;
const TAP_SCRIPT = `
(() => {
  const add = () => {
    if (document.getElementById("__rec_tap_style")) return;
    const s = document.createElement("style");
    s.id = "__rec_tap_style";
    s.textContent = ".__rec_tap{position:fixed;z-index:2147483647;pointer-events:none;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(30,58,95,.28);border:2px solid rgba(30,58,95,.55);animation:__rec_tap .55s ease-out forwards}@keyframes __rec_tap{from{transform:scale(.4);opacity:1}to{transform:scale(1.35);opacity:0}}";
    document.documentElement.appendChild(s);
  };
  window.addEventListener("pointerdown", (e) => {
    add();
    const d = document.createElement("div");
    d.className = "__rec_tap";
    d.style.left = e.clientX + "px";
    d.style.top = e.clientY + "px";
    document.documentElement.appendChild(d);
    setTimeout(() => d.remove(), 700);
  }, true);
})();
`;

let browser = null;
async function getBrowser() {
  // ヘッドレスの画面録画（screencast）は deviceScaleFactor を無視して 1倍で撮り、780×1688 の左上に
  // 小さく置いて残りを灰色にする。ブラウザ全体の倍率を 2 にすると、録画も 2倍で枠いっぱいに撮れる
  browser ??= await chromium.launch({
    headless: !HEADED,
    args: [`--force-device-scale-factor=${SCALE}`],
  });
  return browser;
}
export async function closeBrowser() {
  await browser?.close();
  browser = null;
}

// 場面を1本録る。fn(scene) の中で操作する。戻り値：{ file, seconds, cues }
export async function recordScene(sceneName, fn) {
  const name = DEVICE === "ipad" ? `JD-ipad-${sceneName}` : `${process.env.NAME_PREFIX ?? ""}${sceneName}`;
  mkdirSync(RAW_DIR, { recursive: true });
  const b = await getBrowser();
  const context = await b.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    isMobile: true,
    hasTouch: false, // クリックをマウスのまま使う（タップの丸は pointerdown で出す）
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    colorScheme: "light",
    recordVideo: {
      dir: RAW_DIR,
      size: { width: VIEWPORT.width * SCALE, height: VIEWPORT.height * SCALE },
    },
  });
  await context.addInitScript(HIDE_DEV); // 開発サーバーの「N」の丸を映さない
  if (SHOW_TAP) await context.addInitScript(TAP_SCRIPT);
  context.setDefaultTimeout(15_000);
  const page = await context.newPage();
  const started = Date.now();
  const cues = [];
  // 最初のページが描けた時刻（ms、started から）。それより前は about:blank が 1倍で左上に小さく描かれ、
  // 残りが灰色になるので、録り終えたあとにここまでを切り落とす
  let contentStart = null;
  const scene = {
    page,
    context,
    // 動画の何秒目に何が映ったか（ナレーション合わせ用）
    async cue(label) {
      const t = (Date.now() - started - (contentStart ?? 0)) / 1000;
      cues.push({ t: Number(Math.max(0, t).toFixed(1)), label });
      console.log(`  [${cues.at(-1).t.toFixed(1)}s] ${label}`);
      // SHOTS=1：目印ごとに静止画も残す（README・ナレーション合わせの確認用。動画には影響しない）
      if (SHOTS) {
        mkdirSync(path.join(OUT_DIR, "shots"), { recursive: true });
        const n = String(cues.length).padStart(2, "0");
        await page.screenshot({ path: path.join(OUT_DIR, "shots", `${name}-${n}.png`) });
      }
    },
    async goto(p) {
      await page.goto(BASE_URL + p, { waitUntil: "networkidle" });
      if (contentStart === null) {
        // 2倍で描いた最初のフレームが出るまで待つ（2フレーム＋余裕）
        await page.evaluate(
          () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
        );
        await new Promise((r) => setTimeout(r, 300));
        contentStart = Date.now() - started;
      }
    },
    tap: (locator, opts) => tap(page, locator, opts),
    type: (locator, text, opts) => typeHuman(page, locator, text, opts),
    show: (locator, opts) => show(page, locator, opts),
    read: (ms = 2500) => wait(ms),
    pause: (ms = 600) => wait(ms),
  };
  let error = null;
  try {
    await fn(scene);
  } catch (e) {
    error = e;
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.error.png`) }).catch(() => {});
  }
  const video = page.video();
  await context.close();
  const file = path.join(OUT_DIR, `${name}.webm`);
  rmSync(file, { force: true });
  let trimmed = 0;
  if (video) {
    const raw = await video.path();
    trimmed = trimLeadIn(raw, file, (contentStart ?? 0) / 1000);
    if (trimmed === null) {
      // ffmpeg がないときは切らずに置く（cues.json の leadIn 秒を編集で切る）
      renameSync(raw, file);
      trimmed = 0;
    } else rmSync(raw, { force: true });
  }
  const wall = (Date.now() - started) / 1000 - trimmed;
  const seconds = probeSeconds(file) ?? wall;
  writeFileSync(
    path.join(OUT_DIR, `${name}.cues.json`),
    JSON.stringify(
      {
        scene: name,
        baseUrl: BASE_URL,
        seconds,
        // 切り落とした最初の秒数（0 で切っていないときは、この秒数までが about:blank の灰色）
        leadInTrimmed: trimmed,
        leadIn: trimmed ? 0 : (contentStart ?? 0) / 1000,
        cues,
      },
      null,
      2,
    ) + "\n",
  );
  if (error) throw Object.assign(error, { scene: name, file });
  return { name, file, seconds, cues };
}

// 最初の seconds 秒を切り落として VP9 で書き直す（画質はほぼそのまま：crf 12）。切った秒数、ffmpeg がなければ null
function trimLeadIn(raw, out, seconds) {
  const args = ["-hide_banner", "-v", "error", "-y", "-ss", seconds.toFixed(2), "-i", raw];
  args.push("-an", "-c:v", "libvpx-vp9", "-crf", "12", "-b:v", "0", "-row-mt", "1");
  args.push("-deadline", "good", "-cpu-used", "4", "-pix_fmt", "yuv420p", out);
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.error || r.status !== 0) {
    if (!r.error) console.error(`ffmpeg で切れませんでした：${r.stderr?.slice(0, 300)}`);
    rmSync(out, { force: true });
    return null;
  }
  return seconds;
}

// 動画の秒数。ffprobe があればそれで。Playwright の webm は長さが入っていないことがあるので、
// そのときは ffmpeg で最後まで読んで数える。どちらもなければ null（録った時間を使う）
function probeSeconds(file) {
  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file],
    { encoding: "utf8" },
  );
  const n = Number(probe.stdout?.trim());
  if (probe.status === 0 && Number.isFinite(n) && n > 0) return n;
  const full = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-f", "null", "-"], {
    encoding: "utf8",
  });
  const m = [...String(full.stderr ?? "").matchAll(/time=(\d+):(\d+):([\d.]+)/g)].at(-1);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
}

// 要素を画面の真ん中あたりに静かに出す
async function show(page, locator, { block = "center", settle = 500 } = {}) {
  await locator.waitFor({ state: "visible" });
  await locator.evaluate((el, b) => el.scrollIntoView({ behavior: "smooth", block: b }), block);
  await wait(settle);
}

// 人が押すように：見える所まで出す → 少し待つ → 押す → 少し待つ
async function tap(page, locator, { before = 450, after = 650, scroll = true } = {}) {
  await locator.waitFor({ state: "visible" });
  if (scroll) {
    const inView = await locator.evaluate((el) => {
      const r = el.getBoundingClientRect();
      // 下の固定の列（約 9rem）に隠れない位置にあるか
      return r.top >= 60 && r.bottom <= window.innerHeight - 150;
    });
    if (!inView) await show(page, locator);
  }
  const box = await locator.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
  }
  await wait(before);
  await locator.click();
  await wait(after);
}

// 1字ずつ打つ（日本語も1字ずつ入れる。IME の変換の候補は映らない）
async function typeHuman(page, locator, text, { delay = 140, before = 400, after = 600 } = {}) {
  await tap(page, locator, { before, after: 250 });
  for (const ch of text) {
    await page.keyboard.type(ch);
    await wait(delay * (0.7 + Math.random() * 0.6));
  }
  await wait(after);
}
