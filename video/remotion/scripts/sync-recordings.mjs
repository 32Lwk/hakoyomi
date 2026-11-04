// video/record/out/*.webm を public/recordings/ に写し、名前と秒数を src/recordings.generated.json に書く。
// Remotion は public/ の中のファイルしか読めないため。録画がなければ空の一覧になり、場面は「未収録」の札で描かれる。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.resolve(root, "../record/out");
const dst = path.join(root, "public/recordings");
fs.mkdirSync(dst, { recursive: true });

const probe = (file) => {
  try {
    const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], {
      encoding: "utf8",
    }).trim();
    const n = Number(out);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
};

const manifest = {};
if (fs.existsSync(src)) {
  for (const f of fs.readdirSync(src).filter((f) => f.endsWith(".webm") || f.endsWith(".mp4"))) {
    const name = f.replace(/\.(webm|mp4)$/, "");
    const from = path.join(src, f);
    const to = path.join(dst, f);
    fs.copyFileSync(from, to);
    // 録画側の json（{ seconds }）があれば、その秒数を優先（Playwright の webm は長さが入らないことがある）
    const meta = path.join(src, `${name}.json`);
    let seconds = null;
    if (fs.existsSync(meta)) {
      try {
        seconds = JSON.parse(fs.readFileSync(meta, "utf8")).seconds ?? null;
      } catch {}
    }
    manifest[name] = { file: `recordings/${f}`, seconds: seconds ?? probe(to) };
  }
}
fs.writeFileSync(path.join(root, "src/recordings.generated.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(Object.keys(manifest).length ? `録画 ${Object.keys(manifest).length} 本: ${Object.keys(manifest).join(", ")}` : "録画なし（未収録の札で描く）");
