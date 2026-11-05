// ユーザー録音の音声ファイル（public/narration/*.wav）の実測長をもとに、
// 重複ゼロ・自然な間（GAP 0.25秒）で narration-layout.json を完全同期・再計算する。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const linesFile = path.join(root, "src/narration-lines.json");
const { lines } = JSON.parse(fs.readFileSync(linesFile, "utf8"));
const { scenes } = JSON.parse(fs.readFileSync(path.join(root, "src/timeline.json"), "utf8"));
const narrationDir = path.join(root, "public/narration");

const probe = (file) =>
  Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], {
      encoding: "utf8",
    }).trim()
  );

const durations = {};
for (const line of lines) {
  const f = path.join(narrationDir, `${line.id}.wav`);
  const dur = Math.round(probe(f) * 100) / 100;
  durations[line.id] = dur;
}

const GAP = 0.25;
const layout = {};
let totalProblems = 0;

console.log("=== ユーザー録音音声との完全レイアウト同期 ===");

for (const sc of scenes) {
  const scLines = lines.filter((l) => l.scene === sc.id);
  let prevEnd = -Infinity;
  let spoken = 0;
  console.log(`\n【${sc.id}】${sc.title}（上限 ${sc.durationSec}s）`);

  for (const l of scLines) {
    const d = durations[l.id];
    const start = Math.round(Math.max(l.startSec, prevEnd + GAP) * 100) / 100;
    const end = Math.round((start + d) * 100) / 100;
    layout[l.id] = { start: start, duration: d, startSec: start, durationSec: d, endSec: end };
    prevEnd = end;
    spoken += d;
    console.log(`  ${l.id}: [${start}s - ${end}s] (${d}s)  ${l.text.slice(0, 32)}...`);
  }

  if (prevEnd > sc.durationSec) {
    const diff = Math.round((prevEnd - sc.durationSec) * 100) / 100;
    console.error(`  ⚠️ シーン ${sc.id} で枠を +${diff}秒 超過しています！`);
    totalProblems++;
  } else {
    const rem = Math.round((sc.durationSec - prevEnd) * 100) / 100;
    console.log(`  ✅ 枠内OK（残り余白: ${rem}s）`);
  }
}

fs.writeFileSync(path.join(root, "src/narration-layout.json"), JSON.stringify(layout, null, 2));

if (totalProblems > 0) {
  console.error(`\n❌ ${totalProblems} 個のシーンで枠超過が発生しました。調整が必要です。`);
} else {
  console.log(`\n🎉 重複ゼロ＆全シーン枠内収縮！narration-layout.json を完全同期しました！`);
}
