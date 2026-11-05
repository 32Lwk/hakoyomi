// ハコよみ 収録・プレゼンスタジオ用ローカルサーバー (http://localhost:3030)
// ブラウザでのマイク録音データを直接 public/narration/{id}.wav に保存・変換し、
// スライド・デモ動画・原稿カンペと完全連動するプレゼン環境を提供します。

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 3030;
const narrationDir = path.join(root, "public/narration");
const backupDir = path.join(root, "public/narration_backup_tts");
const cutsFile = path.join(root, "studio/cuts-data.json");
const defaultCutsFile = path.join(root, "studio/cuts-data-default.json");
const linesFile = path.join(root, "src/narration-lines.json");
const studioDir = path.join(root, "studio");

// 音声ファイルの正確な長さを ffprobe で取得
function getAudioDuration(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
      { encoding: "utf8" }
    ).trim();
    return Number(out);
  } catch (err) {
    return null;
  }
}

// レンダリングジョブの管理
let currentRenderJob = null;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORSヘッダー
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ルートへのアクセスはスタジオUIへリダイレクト
  if (pathname === "/" || pathname === "/studio") {
    res.writeHead(302, { Location: "/studio/index.html" });
    res.end();
    return;
  }

  // API: カット一覧と各カットの録音ステータス
  if (pathname === "/api/cuts" && req.method === "GET") {
    try {
      const data = JSON.parse(fs.readFileSync(cutsFile, "utf8"));
      const enrichedCuts = data.cuts.map((cut) => {
        const wavPath = path.join(narrationDir, `${cut.id}.wav`);
        const backupWavPath = path.join(backupDir, `${cut.id}.wav`);
        const currentDur = getAudioDuration(wavPath);
        const ttsDur = getAudioDuration(backupWavPath);

        // バックアップファイルとサイズが異なる、または更新されているか
        let isUserRecorded = false;
        if (fs.existsSync(wavPath) && fs.existsSync(backupWavPath)) {
          const statWav = fs.statSync(wavPath);
          const statBkp = fs.statSync(backupWavPath);
          isUserRecorded = statWav.size !== statBkp.size;
        }

        return {
          ...cut,
          currentSec: currentDur ? Math.round(currentDur * 100) / 100 : null,
          ttsSec: ttsDur ? Math.round(ttsDur * 100) / 100 : null,
          isUserRecorded,
          audioUrl: `/public/narration/${cut.id}.wav?t=${Date.now()}`,
          ttsAudioUrl: `/public/narration_backup_tts/${cut.id}.wav`,
        };
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, cuts: enrichedCuts }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // API: 音声の保存 (ブラウザからのバイナリ録音データを受信 -> ffmpeg で 24kHz WAV に変換)
  if (pathname === "/api/save-audio" && req.method === "POST") {
    const id = url.searchParams.get("id");
    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Missing id parameter" }));
      return;
    }

    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const buffer = Buffer.concat(chunks);
        const tempPath = path.join(root, `.temp_rec_${id}_${Date.now()}.webm`);
        fs.writeFileSync(tempPath, buffer);

        const targetWav = path.join(narrationDir, `${id}.wav`);

        // ffmpeg で 24kHz / 16bit / mono WAV に変換（Remotion ナレーション標準フォーマット）
        execFileSync("ffmpeg", [
          "-y",
          "-i",
          tempPath,
          "-ar",
          "24000",
          "-ac",
          "1",
          "-c:a",
          "pcm_s16le",
          targetWav,
        ]);

        try {
          fs.unlinkSync(tempPath);
        } catch (_) {}

        const duration = getAudioDuration(targetWav);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            ok: true,
            id,
            durationSec: duration ? Math.round(duration * 100) / 100 : null,
            audioUrl: `/public/narration/${id}.wav?t=${Date.now()}`,
          })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // API: 通し録音の保存と自動スライス（1本の通し音声を矢印キーのタイムスタンプで各カットへ分割）
  if (pathname === "/api/save-continuous-take" && req.method === "POST") {
    const splitsHeader = req.headers["x-splits"];
    if (!splitsHeader) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Missing x-splits header" }));
      return;
    }

    let splits = [];
    try {
      splits = JSON.parse(decodeURIComponent(splitsHeader));
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Invalid x-splits JSON" }));
      return;
    }

    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const now = Date.now();
      const tempWebm = path.join(root, `.temp_continuous_${now}.webm`);
      const tempMasterWav = path.join(root, `.temp_continuous_master_${now}.wav`);

      try {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(tempWebm, buffer);

        // まず通し音声を 24kHz / 16bit / mono のマスター WAV に一括変換
        execFileSync("ffmpeg", [
          "-y",
          "-i",
          tempWebm,
          "-ar",
          "24000",
          "-ac",
          "1",
          "-c:a",
          "pcm_s16le",
          tempMasterWav,
        ]);

        const masterDuration = getAudioDuration(tempMasterWav);
        const results = [];

        // 各カットを切り出して public/narration/{id}.wav に保存
        for (const item of splits) {
          const { id, startSec, endSec } = item;
          const targetWav = path.join(narrationDir, `${id}.wav`);

          // 開始秒と終了秒を安全にクランプ
          const s = Math.max(0, startSec);
          const e = Math.min(masterDuration || 9999, endSec);
          const dur = Math.max(0.1, e - s);

          execFileSync("ffmpeg", [
            "-y",
            "-ss",
            s.toString(),
            "-t",
            dur.toString(),
            "-i",
            tempMasterWav,
            "-ar",
            "24000",
            "-ac",
            "1",
            "-c:a",
            "pcm_s16le",
            targetWav,
          ]);

          const actualDur = getAudioDuration(targetWav);
          results.push({
            id,
            startSec: s,
            endSec: e,
            durationSec: actualDur ? Math.round(actualDur * 100) / 100 : null,
            audioUrl: `/public/narration/${id}.wav?t=${Date.now()}`,
          });
        }

        // 一時ファイルを削除
        try {
          fs.unlinkSync(tempWebm);
          fs.unlinkSync(tempMasterWav);
        } catch (_) {}

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            ok: true,
            masterDuration: masterDuration ? Math.round(masterDuration * 100) / 100 : null,
            cuts: results,
          })
        );
      } catch (err) {
        console.error("Continuous take error:", err);
        try {
          if (fs.existsSync(tempWebm)) fs.unlinkSync(tempWebm);
          if (fs.existsSync(tempMasterWav)) fs.unlinkSync(tempMasterWav);
        } catch (_) {}
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // API: 原稿の更新（スタジオ cuts-data.json と動画字幕 narration-lines.json に同時反映）
  if (pathname === "/api/update-script" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { id, text, speak } = JSON.parse(body);
        if (!id || !text) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "Missing id or text" }));
          return;
        }

        // 1. studio/cuts-data.json を更新
        let updatedCut = null;
        if (fs.existsSync(cutsFile)) {
          const cutsData = JSON.parse(fs.readFileSync(cutsFile, "utf8"));
          const target = cutsData.cuts.find((c) => c.id === id);
          if (target) {
            target.text = text;
            if (speak !== undefined) target.speak = speak;
            if (target.customerBubble) target.customerBubble = text;
            if (target.noviceBubble) target.noviceBubble = `新人「${text}」`;
            if (target.veteranBubble) target.veteranBubble = `ベテラン「${text}」`;
            if (target.catchTitle) target.catchTitle = text;
            updatedCut = target;
          }
          fs.writeFileSync(cutsFile, JSON.stringify(cutsData, null, 2), "utf8");
        }

        // 2. src/narration-lines.json を更新（動画の字幕テロップと100%同期）
        if (fs.existsSync(linesFile)) {
          const linesData = JSON.parse(fs.readFileSync(linesFile, "utf8"));
          const lineTarget = linesData.lines.find((l) => l.id === id);
          if (lineTarget) {
            lineTarget.text = text;
            if (speak !== undefined) lineTarget.speak = speak;
          }
          fs.writeFileSync(linesFile, JSON.stringify(linesData, null, 2), "utf8");
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, cut: updatedCut }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // API: 原稿を初期値にリセット
  if (pathname === "/api/reset-script" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { id } = JSON.parse(body || "{}");
        if (!fs.existsSync(defaultCutsFile)) {
          throw new Error("Default cuts backup not found");
        }

        const defaultData = JSON.parse(fs.readFileSync(defaultCutsFile, "utf8"));
        let restoredCut = null;

        if (id) {
          const defCut = defaultData.cuts.find((c) => c.id === id);
          if (!defCut) throw new Error(`Default cut ${id} not found`);

          // cuts-data.json を更新
          const currentData = JSON.parse(fs.readFileSync(cutsFile, "utf8"));
          const target = currentData.cuts.find((c) => c.id === id);
          if (target) {
            target.text = defCut.text;
            target.speak = defCut.speak;
            target.tip = defCut.tip;
            if (target.customerBubble) target.customerBubble = defCut.customerBubble;
            if (target.noviceBubble) target.noviceBubble = defCut.noviceBubble;
            if (target.veteranBubble) target.veteranBubble = defCut.veteranBubble;
            if (target.catchTitle) target.catchTitle = defCut.catchTitle;
            restoredCut = target;
          }
          fs.writeFileSync(cutsFile, JSON.stringify(currentData, null, 2), "utf8");

          // narration-lines.json も更新
          if (fs.existsSync(linesFile)) {
            const linesData = JSON.parse(fs.readFileSync(linesFile, "utf8"));
            const lineTarget = linesData.lines.find((l) => l.id === id);
            if (lineTarget) {
              lineTarget.text = defCut.text;
              lineTarget.speak = defCut.speak;
            }
            fs.writeFileSync(linesFile, JSON.stringify(linesData, null, 2), "utf8");
          }
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, cut: restoredCut }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // API: お手本TTSに戻す
  if (pathname === "/api/restore-tts" && req.method === "POST") {
    const id = url.searchParams.get("id");
    try {
      if (id === "all") {
        // 全ファイルを復元
        const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".wav"));
        for (const f of files) {
          fs.copyFileSync(path.join(backupDir, f), path.join(narrationDir, f));
        }
      } else if (id) {
        const src = path.join(backupDir, `${id}.wav`);
        const dst = path.join(narrationDir, `${id}.wav`);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dst);
        } else {
          throw new Error(`Backup file not found for ${id}`);
        }
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // API: 動画レンダリングの開始 (npm run render)
  if (pathname === "/api/render-video" && req.method === "POST") {
    if (currentRenderJob && currentRenderJob.status === "running") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, status: "already_running" }));
      return;
    }

    currentRenderJob = {
      status: "running",
      startTime: Date.now(),
      logs: [],
    };

    const child = spawn("npm", ["run", "render"], { cwd: root });
    child.stdout.on("data", (d) => {
      const line = d.toString();
      currentRenderJob.logs.push(line);
      if (currentRenderJob.logs.length > 50) currentRenderJob.logs.shift();
    });
    child.stderr.on("data", (d) => {
      const line = d.toString();
      currentRenderJob.logs.push(line);
      if (currentRenderJob.logs.length > 50) currentRenderJob.logs.shift();
    });
    child.on("close", (code) => {
      currentRenderJob.status = code === 0 ? "done" : "error";
      currentRenderJob.code = code;
      currentRenderJob.endTime = Date.now();
    });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, status: "started" }));
    return;
  }

  // API: 動画レンダリングのステータス取得
  if (pathname === "/api/render-status" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        render: currentRenderJob || { status: "idle" },
      })
    );
    return;
  }

  // 静的ファイル配信 (studio, public, out)
  let filePath = null;
  if (pathname.startsWith("/studio/")) {
    filePath = path.join(root, pathname);
  } else if (pathname.startsWith("/public/")) {
    filePath = path.join(root, pathname);
  } else if (pathname.startsWith("/out/")) {
    filePath = path.join(root, pathname);
  }

  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";

    // 範囲リクエスト (Range: bytes=...) のサポート（動画や音声のシーク用）
    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType,
      });
      file.pipe(res);
      return;
    }

    res.writeHead(200, {
      "Content-Length": stat.size,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n======================================================`);
  console.log(`🎙️ ハコよみ 収録・プレゼンスタジオが起動しました！`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
