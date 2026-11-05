// 録画の入口。node record.mjs           → 全場面
//              node record.mjs s3 s4     → 指定した場面だけ
// BASE_URL（既定 https://hakoyomi.yutok.dev）で録る先を切り替える
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BASE_URL, closeBrowser, recordScene } from "./lib.mjs";
import { cleanupMemos } from "./scenes/s6.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ORDER = ["s2", "s2b", "s3", "s4", "s45", "s5", "s6"];
const wanted = process.argv.slice(2).map((a) => a.toLowerCase().replace(/[^a-z0-9]/g, ""));
const available = readdirSync(path.join(here, "scenes")).map((f) => f.replace(/\.mjs$/, ""));
const keys = (wanted.length ? wanted : ORDER).filter((k) => {
  if (available.includes(k)) return true;
  console.error(`場面 ${k} がありません（${ORDER.join(" ")}）`);
  process.exitCode = 1;
  return false;
});

console.log(`BASE_URL=${BASE_URL}`);
const results = [];
try {
  for (const key of keys) {
    const mod = await import(pathToFileURL(path.join(here, "scenes", `${key}.mjs`)).href);
    console.log(`\n● ${mod.name}`);
    try {
      results.push(await recordScene(mod.name, mod.run));
    } catch (e) {
      console.error(`✗ ${mod.name}: ${e.message.split("\n")[0]}`);
      results.push({ name: mod.name, file: e.file, seconds: null, failed: true });
      process.exitCode = 1;
    }
  }
} finally {
  await closeBrowser();
  // S6 で作ったメモは、失敗しても必ず消す（デモ用の3件 …0401〜0403 は消さない）
  await cleanupMemos();
}

console.log("\n場面            秒数   ファイル");
let total = 0;
for (const r of results) {
  total += r.seconds ?? 0;
  const sec = r.seconds == null ? "  失敗" : r.seconds.toFixed(1).padStart(6);
  console.log(`${r.name.padEnd(15)} ${sec}  ${r.file ? path.relative(process.cwd(), r.file) : "-"}`);
}
console.log(`合計 ${total.toFixed(1)} 秒`);
