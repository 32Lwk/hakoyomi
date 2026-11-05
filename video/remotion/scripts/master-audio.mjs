// プロ仕様の音声自動マスタリングスクリプト（くっきりクリア版）
// 1. 低域のこもり・ブーミー感のカット（highpass 90Hz + EQ 280Hz -4dB）
// 2. 声の輪郭・明瞭度の強調（EQ 3.5kHz +4.5dB + EQ 7.5kHz +2.5dB）
// 3. サ行の刺さり緩和（deesser）
// 4. 音量の滑らかな圧縮（acompressor）
// 5. 世界標準規格による音量完全均一化（loudnorm -16 LUFS）

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = path.join(root, "public/narration_user_raw");
const outDir = path.join(root, "public/narration");
const linesFile = path.join(root, "src/narration-lines.json");
const { lines } = JSON.parse(fs.readFileSync(linesFile, "utf8"));

if (!fs.existsSync(rawDir)) {
  console.error("rawDir が見つかりません:", rawDir);
  process.exit(1);
}

// くっきりクリア・マスタリングフィルター
const filterChain = [
  "highpass=f=90",
  "equalizer=f=280:t=q:w=1.2:g=-4.0",
  "equalizer=f=3500:t=q:w=1.4:g=+4.5",
  "equalizer=f=7500:t=q:w=1.0:g=+2.5",
  "deesser=i=0.25",
  "acompressor=threshold=-19dB:ratio=2.8:attack=12:release=120:makeup=2dB",
  "loudnorm=I=-16:TP=-1.5:LRA=7",
].join(",");

console.log("=== プロ仕様 音声自動マスタリング（くっきりクリア＆音量均一化）開始 ===");

for (const line of lines) {
  const src = path.join(rawDir, `${line.id}.wav`);
  const dst = path.join(outDir, `${line.id}.wav`);

  if (!fs.existsSync(src)) {
    console.warn(`スキップ（ファイルなし）: ${line.id}.wav`);
    continue;
  }

  process.stdout.write(`  処理中: ${line.id} ... `);
  execFileSync("ffmpeg", [
    "-y",
    "-i",
    src,
    "-af",
    filterChain,
    "-ar",
    "24000",
    "-ac",
    "1",
    "-c:a",
    "pcm_s16le",
    dst,
  ]);
  console.log("✓ 完了");
}

console.log("\n🎉 全26カットのマスタリングが完了しました！");
console.log("次にタイムライン（narration-layout.json）を自動同期します...\n");

// タイムライン同期スクリプトを実行
execFileSync("node", ["scripts/sync-user-audio-layout.mjs"], {
  cwd: root,
  stdio: "inherit",
});
