// プロ仕様 音声自動クリーンアップ＆マスタリングモジュール
// 1. 冒頭・末尾の無音トリミング（silenceremove）
// 2. セリフ末尾の息吸い込み・リップノイズの自動カット
// 3. 低域のこもりカット（highpass 90Hz + EQ 280Hz -4dB）
// 4. 声の輪郭・明瞭度の強調（EQ 3.5kHz +4.5dB + EQ 7.5kHz +2.5dB）
// 5. サ行の刺さり緩和（deesser）
// 6. 音量の滑らかな圧縮（acompressor）
// 7. 世界標準規格による音量均一化（loudnorm -16 LUFS）

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const MASTERING_FILTER_CHAIN = [
  // 冒頭の無音トリミング（-42dB以下）
  "silenceremove=start_periods=1:start_duration=0.03:start_threshold=-42dB",
  // 末尾の無音および息吸い込み・うっ音の自動カット（-37dB以下）
  "areverse",
  "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-37dB",
  "areverse",
  // くっきりクリア・イコライジング
  "highpass=f=90",
  "equalizer=f=280:t=q:w=1.2:g=-4.0",
  "equalizer=f=3500:t=q:w=1.4:g=+4.5",
  "equalizer=f=7500:t=q:w=1.0:g=+2.5",
  "deesser=i=0.25",
  // 音量均一化＆コンプレッサー
  "acompressor=threshold=-19dB:ratio=2.8:attack=12:release=120:makeup=2dB",
  "loudnorm=I=-16:TP=-1.5:LRA=7",
].join(",");

/**
 * 単一の音声ファイルをクリーンアップ＆マスタリングして保存する
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

  console.log("=== プロ仕様 音声自動クリーンアップ＆マスタリング一括実行 ===");
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
  console.log("\n🎉 全カットのクリーンアップ＆マスタリングが完了しました！");
}
