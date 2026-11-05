// プロ仕様 音声自動ナチュラルマスタリングモジュール（声の余韻・ブレス完全保持版）
// 1. 低域のこもり・ブーミー感のカット（highpass 80Hz + EQ 280Hz -3.5dB）
// 2. 声の輪郭・明瞭度の強調（EQ 3.5kHz +4.0dB + EQ 7.5kHz +2.0dB）
// 3. サ行の刺さり緩和（deesser）
// 4. 音量の滑らかな圧縮（acompressor）
// 5. 世界標準規格による音量完全均一化（loudnorm -16 LUFS）
// 6. 端部クリックノイズ防止の極小フェード（0.015s）

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const MASTERING_FILTER_CHAIN = [
  // 低域のこもりカット
  "highpass=f=80",
  "equalizer=f=280:t=q:w=1.2:g=-3.5",
  // 声の芯と抜けの強調
  "equalizer=f=3500:t=q:w=1.4:g=+4.0",
  "equalizer=f=7500:t=q:w=1.0:g=+2.0",
  // サ行緩和
  "deesser=i=0.2",
  // 音量均一化＆コンプレッサー
  "acompressor=threshold=-20dB:ratio=2.5:attack=15:release=150:makeup=2dB",
  "loudnorm=I=-16:TP=-1.5:LRA=7",
  // プチノイズ防止の極小フェード
  "afade=t=in:st=0:d=0.015",
].join(",");

/**
 * 単一の音声ファイルをナチュラルマスタリングして保存する
 */
export function cleanAndMasterAudio(inputPath, outputPath) {
  const tempOut = outputPath + `.temp_${Date.now()}.wav`;
  execFileSync("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-af",
    MASTERING_FILTER_CHAIN,
    "-ar",
    "24000",
    "-ac",
    "1",
    "-c:a",
    "pcm_s16le",
    tempOut,
  ]);
  fs.renameSync(tempOut, outputPath);
}

// コマンドラインから直接実行された場合は全カットを一括処理
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rawDir = path.join(root, "public/narration_user_raw");
  const outDir = path.join(root, "public/narration");
  const linesFile = path.join(root, "src/narration-lines.json");
  const { lines } = JSON.parse(fs.readFileSync(linesFile, "utf8"));

  console.log("=== ナチュラルマスタリング（声の余韻完全保持＆音量均一化）一括実行 ===");
  for (const line of lines) {
    const src = path.join(rawDir, `${line.id}.wav`);
    const dst = path.join(outDir, `${line.id}.wav`);

    if (!fs.existsSync(src)) {
      console.warn(`スキップ（ファイルなし）: ${line.id}.wav`);
      continue;
    }

    process.stdout.write(`  処理中: ${line.id} ... `);
    cleanAndMasterAudio(src, dst);
    console.log("✓ 完了");
  }
  console.log("\n🎉 全カットのナチュラルマスタリングが完了しました！");
}
