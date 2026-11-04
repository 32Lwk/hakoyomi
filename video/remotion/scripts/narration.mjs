// 仮ナレーション（macOS say）を作り、秒数を測り、置く位置を決めて src/narration-layout.json に書く。
//   node scripts/narration.mjs               … say で public/narration/<id>.wav を作り直してから測る
//   node scripts/narration.mjs --measure-only … 今ある wav を測るだけ（ゆうの録音に差し替えた後はこちら）
// 差し替え：同じ名前（例 public/narration/s2-1.wav）で置けば Main がそのまま使う。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { voice, lines } = JSON.parse(fs.readFileSync(path.join(root, "src/narration-lines.json"), "utf8"));
const { scenes } = JSON.parse(fs.readFileSync(path.join(root, "src/timeline.json"), "utf8"));
const outDir = path.join(root, "public/narration");
fs.mkdirSync(outDir, { recursive: true });
const measureOnly = process.argv.includes("--measure-only");

const probe = (file) =>
  Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], {
      encoding: "utf8",
    }).trim(),
  );

const durations = {};
for (const line of lines) {
  const wav = path.join(outDir, `${line.id}.wav`);
  if (!measureOnly) {
    const aiff = path.join(outDir, `${line.id}.aiff`);
    execFileSync("say", ["-v", voice, "-o", aiff, line.speak ?? line.text]);
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", aiff, "-ar", "48000", "-ac", "1", wav]);
    fs.rmSync(aiff);
  }
  if (!fs.existsSync(wav)) throw new Error(`missing ${wav}`);
  durations[line.id] = Math.round(probe(wav) * 100) / 100;
}

// 置き方：startSec は「この秒より前には始めない」（画面の動きに合わせた目安）。前の行が終わっていなければ GAP 後ろへずらす。
const GAP = 0.25;
const chars = (t) => t.replace(/[「」\s]/g, "").length;
const layout = {};
let problems = 0;
for (const scene of scenes) {
  const own = lines.filter((l) => l.scene === scene.id);
  console.log(`\n${scene.id} ${scene.title}（${scene.durationSec}s）`);
  let prevEnd = -Infinity;
  let spoken = 0;
  for (const l of own) {
    const d = durations[l.id];
    const start = Math.round(Math.max(l.startSec, prevEnd + GAP) * 100) / 100;
    const end = start + d;
    prevEnd = end;
    spoken += d;
    layout[l.id] = { start, duration: d };
    const shifted = start > l.startSec ? `（目安 ${l.startSec}s から ${(start - l.startSec).toFixed(2)}s 遅らせた）` : "";
    const over = end > scene.durationSec ? `  ← 場面の枠を ${(end - scene.durationSec).toFixed(2)}s 超える` : "";
    if (over) problems++;
    console.log(
      `  ${l.id.padEnd(6)} ${start.toFixed(2).padStart(6)}s → ${end.toFixed(2).padStart(6)}s  ${d.toFixed(2)}s  ${chars(l.text)}字  ${(chars(l.text) / d).toFixed(1)}字/s${shifted}${over}`,
    );
  }
  const total = own.reduce((s, l) => s + chars(l.text), 0);
  console.log(`  計 ${spoken.toFixed(2)}s 発話 / ${total}字（1秒6字なら ${(total / 6).toFixed(1)}s）・最後の行の終わり ${prevEnd.toFixed(2)}s / 枠 ${scene.durationSec}s`);
}
fs.writeFileSync(path.join(root, "src/narration-layout.json"), JSON.stringify(layout, null, 2) + "\n");
console.log(problems ? `\n場面の枠を超える行 ${problems} 件` : "\n超過なし");
