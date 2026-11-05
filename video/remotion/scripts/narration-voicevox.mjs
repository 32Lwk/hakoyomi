// VOICEVOX Engine (http://127.0.0.1:50021) を使って
// 誤読ゼロ・精密アクセントで高品質なローカル音声を生成し、各シーンの秒数を計測する。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const linesFile = path.join(root, "src/narration-lines.json");
const { lines } = JSON.parse(fs.readFileSync(linesFile, "utf8"));
const { scenes } = JSON.parse(fs.readFileSync(path.join(root, "src/timeline.json"), "utf8"));
const outDir = path.join(root, "public/narration");
fs.mkdirSync(outDir, { recursive: true });

const VV_HOST = process.env.VOICEVOX_HOST || "http://127.0.0.1:50021";
// 四国めたん（ノーマル id:2）: 明瞭で上品なナレーションに最適
const SPEAKER_ID = parseInt(process.env.VOICEVOX_SPEAKER || "2", 10);

const probe = (file) =>
  Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], {
      encoding: "utf8",
    }).trim(),
  );

// 専門用語・略称の読み補正辞書（VOICEVOXに正しく読ませる）
const PHONETIC_MAP = [
  [/2026年5月施行/g, "にせんにじゅうろくねん、ごがつ、しこう"],
  [/指定濫用防止医薬品/g, "していらんようぼうしいやくひん"],
  [/Claude/gi, "クロード"],
  [/BM25/gi, "ビーエムにじゅうご"],
  [/RAG/gi, "ラグ"],
  [/PII/gi, "ピーアイアイ"],
  [/JAN/gi, "ジャン"],
  [/PMDA/gi, "ピーエムディーエー"],
  [/店頭/g, "てんとう"],
  [/添付文書/g, "てんぷぶんしょ"],
  [/接客/g, "せっきゃく"],
  [/ハコよみ/g, "ハコよみ"],
];

function normalizePhonetics(text) {
  let t = text;
  for (const [pattern, repl] of PHONETIC_MAP) {
    t = t.replace(pattern, repl);
  }
  return t;
}

const measureOnly = process.argv.includes("--measure-only");

async function generateLine(line) {
  const wavPath = path.join(outDir, `${line.id}.wav`);
  if (measureOnly && fs.existsSync(wavPath)) {
    return Math.round(probe(wavPath) * 100) / 100;
  }
  const rawText = line.speak ?? line.text;
  const speakText = normalizePhonetics(rawText);

  // 1. audio_query を作成
  const queryUrl = `${VV_HOST}/audio_query?text=${encodeURIComponent(speakText)}&speaker=${SPEAKER_ID}`;
  const queryRes = await fetch(queryUrl, { method: "POST" });
  if (!queryRes.ok) {
    throw new Error(`Failed to create audio_query for ${line.id}: ${queryRes.statusText}`);
  }
  const query = await queryRes.json();

  // シーン枠にピッタリ収まるよう話速（speedScale）を調整
  // テンポよく聞き取りやすいデフォルト 1.08
  query.speedScale = line.speedScale ?? 1.08;
  query.pitchScale = 0.0;
  query.intonationScale = 1.05;
  // 文末の無音を少し詰めてシャープに
  query.postPhonemeLength = 0.08;

  // 2. 音声合成 (synthesis)
  const synUrl = `${VV_HOST}/synthesis?speaker=${SPEAKER_ID}`;
  const synRes = await fetch(synUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });
  if (!synRes.ok) {
    throw new Error(`Failed to synthesize ${line.id}: ${synRes.statusText}`);
  }

  const buf = Buffer.from(await synRes.arrayBuffer());
  fs.writeFileSync(wavPath, buf);

  // 48kHz モノラルに正規化
  const normWav = path.join(outDir, `${line.id}-norm.wav`);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", wavPath, "-ar", "48000", "-ac", "1", normWav]);
  fs.renameSync(normWav, wavPath);

  const dur = Math.round(probe(wavPath) * 100) / 100;
  return dur;
}

async function main() {
  console.log(`🎙️ VOICEVOX Engine (${VV_HOST}) で全ナレーション生成開始 (Speaker ID: ${SPEAKER_ID})...`);

  // エンジン疎通確認
  try {
    const vRes = await fetch(`${VV_HOST}/version`);
    const version = await vRes.text();
    console.log(`✅ VOICEVOX Engine v${version.trim()} 接続成功\n`);
  } catch (err) {
    console.error(`❌ VOICEVOX Engine に接続できません (${VV_HOST})。起動しているか確認してください。`);
    process.exit(1);
  }

  const durations = {};
  for (const line of lines) {
    process.stdout.write(`  生成中: ${line.id} (${line.scene}) ... `);
    const dur = await generateLine(line);
    durations[line.id] = dur;
    console.log(`${dur}s`);
  }

  console.log("\n--- シーン別枠内収縮チェック ---");
  const GAP = 0.25;
  const layout = {};
  let totalProblems = 0;

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
      console.log(`  ${l.id}: [${start}s - ${end}s] (${d}s)  ${l.text.slice(0, 30)}...`);
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
    console.log(`\n🎉 全シーンで枠内収縮・超過ゼロ！音声生成完了！`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
