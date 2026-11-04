// Gemini 2.5 TTS で高品質・自然なナレーション音声を生成し、秒数を測って src/narration-layout.json を更新する。
//   node scripts/narration-gemini.mjs
//   node scripts/narration-gemini.mjs --voice=Kore
//   node scripts/narration-gemini.mjs --measure-only
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const linesData = JSON.parse(fs.readFileSync(path.join(root, "src/narration-lines.json"), "utf8"));
const { scenes } = JSON.parse(fs.readFileSync(path.join(root, "src/timeline.json"), "utf8"));
const outDir = path.join(root, "public/narration");
fs.mkdirSync(outDir, { recursive: true });

// コマンドライン引数
const measureOnly = process.argv.includes("--measure-only");
const force = process.argv.includes("--force");
const voiceArg = process.argv.find((a) => a.startsWith("--voice="))?.split("=")[1];
const selectedVoice = voiceArg || linesData.voice || "Aoede";

// APIキー取得 (.env.local または環境変数)
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  const candidatePaths = [
    path.resolve(root, "../../.env.local"),
    path.resolve(root, "../.env.local"),
    path.resolve(root, ".env.local"),
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "hakoyomi/.env.local"),
  ];
  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      const env = fs.readFileSync(envPath, "utf8");
      const found = env.split("\n").find((l) => l.startsWith("GEMINI_API_KEY="))?.split("=")[1]?.trim();
      if (found) {
        apiKey = found;
        break;
      }
    }
  }
}
if (!apiKey && !measureOnly) {
  throw new Error("GEMINI_API_KEY is required to generate TTS audio.");
}

const probe = (file) =>
  Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], {
      encoding: "utf8",
    }).trim(),
  );

async function generateTTS(text, voiceName, outFile, retries = 5) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
    }
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.status === 429) {
      console.warn(`[Rate Limit 429] Waiting 6.5s before retry (attempt ${attempt}/${retries})...`);
      await new Promise((r) => setTimeout(r, 6500));
      continue;
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`TTS API failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const base64Data = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Data) {
      throw new Error(`No audio data received: ${JSON.stringify(data)}`);
    }

    const tempPcm = path.join(outDir, `_temp_${Date.now()}.pcm`);
    fs.writeFileSync(tempPcm, Buffer.from(base64Data, "base64"));
    // 24000Hz s16le mono -> 48000Hz wav mono (atempo=1.08 で歯切れの良いプロナレーションテンポに微調整)
    execFileSync("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-f",
      "s16le",
      "-ar",
      "24000",
      "-ac",
      "1",
      "-i",
      tempPcm,
      "-af",
      "atempo=1.08",
      "-ar",
      "48000",
      "-ac",
      "1",
      outFile
    ]);
    fs.rmSync(tempPcm, { force: true });
    return;
  }
  throw new Error(`Exceeded max retries for "${text}"`);
}

console.log(`Narration Generation using Gemini 2.5 TTS (Voice: ${selectedVoice})`);

const durations = {};
for (const line of linesData.lines) {
  const wav = path.join(outDir, `${line.id}.wav`);
  if (!measureOnly) {
    if (fs.existsSync(wav) && !force) {
      console.log(`Using existing [${line.id}]: "${line.text}"`);
    } else {
      const textToSpeak = line.speak ?? line.text;
      console.log(`Generating [${line.id}] (${selectedVoice}): "${textToSpeak}"`);
      await generateTTS(textToSpeak, selectedVoice, wav);
      // レート制限（10 requests/min）を回避するため、リクエスト間に 2.5 秒空ける
      await new Promise((r) => setTimeout(r, 2500));
    }
  }
  if (!fs.existsSync(wav)) throw new Error(`Missing ${wav}`);
  durations[line.id] = Math.round(probe(wav) * 100) / 100;
}

// レイアウト計算
const GAP = 0.25;
const chars = (t) => t.replace(/[「」\s]/g, "").length;
const layout = {};
let problems = 0;

for (const scene of scenes) {
  const own = linesData.lines.filter((l) => l.scene === scene.id);
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
console.log(problems ? `\n⚠️ 場面の枠を超える行 ${problems} 件` : "\n✅ 全シーンで枠内収縮・超過なし！");
