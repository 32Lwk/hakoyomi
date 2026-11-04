// 字幕とナレーションの位置。正本は docs/demo-script.md。
// 文は narration-lines.json、秒は scripts/narration.mjs が測って narration-layout.json に書く（音声を差し替えたら `npm run narration:measure`）。
import narration from "./narration-lines.json";
import layoutJson from "./narration-layout.json";
import { scene, type SceneId } from "./timeline";

export type NarrationLine = { id: string; scene: SceneId; startSec: number; text: string; speak?: string };
type Layout = Record<string, { start: number; duration: number }>;

export const LINES = narration.lines as NarrationLine[];
const LAYOUT = layoutJson as Layout;

export type Caption = {
  lineId: string;
  scene: SceneId;
  /** 動画の頭からの秒 */
  start: number;
  end: number;
  text: string;
  /** 音声ファイル（public/ からの相対） */
  audio: string;
};

/** 行ごとの位置（動画の頭からの秒）。場面の中の秒は sceneStart を引く。 */
export const lineTiming = (id: string) => {
  const line = LINES.find((l) => l.id === id);
  if (!line) throw new Error(`unknown line ${id}`);
  const lay = LAYOUT[id] ?? { start: line.startSec, duration: 3 };
  const s = scene(line.scene);
  return { inScene: lay.start, start: s.startSec + lay.start, end: s.startSec + lay.start + lay.duration, duration: lay.duration };
};

/** 画面の動きの目安（narration-lines.json の startSec、場面の中の秒）。声が延びても画面の段取りは崩さない */
export const cueSec = (id: string) => {
  const line = LINES.find((l) => l.id === id);
  if (!line) throw new Error(`unknown line ${id}`);
  return line.startSec;
};

export const AUDIO = LINES.map((l) => ({ id: l.id, src: `narration/${l.id}.wav`, ...lineTiming(l.id) }));

// 長い行は「。」で切り、さらに長ければ「、」で切って、字数に比例した時間で出す（1枚 MAX 字まで）
const MAX = 34;
const visible = (t: string) => t.replace(/\s/g, "").length;

function split(text: string): string[] {
  const sentences = text.match(/[^。？]+[。？」]*」?/g) ?? [text];
  const out: string[] = [];
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    if (visible(s) <= MAX) {
      out.push(s);
      continue;
    }
    // 「、」で、なるべく半分に近いところで切る
    const parts = s.split(/(?<=、)/);
    let cur = "";
    const half = visible(s) / 2;
    for (const p of parts) {
      if (cur && visible(cur) + visible(p) > Math.max(half, MAX * 0.6) && visible(cur) >= half * 0.6) {
        out.push(cur);
        cur = p;
      } else cur += p;
    }
    if (cur) out.push(cur);
  }
  // 短すぎる切れ端は前とまとめる
  return out.reduce<string[]>((acc, s) => {
    const last = acc[acc.length - 1];
    if (last && visible(last) + visible(s) <= MAX && (visible(s) < 10 || visible(last) < 10)) acc[acc.length - 1] = last + s;
    else acc.push(s);
    return acc;
  }, []);
}

export const CAPTIONS: Caption[] = LINES.flatMap((l) => {
  const t = lineTiming(l.id);
  const chunks = split(l.text);
  const total = chunks.reduce((s, c) => s + visible(c), 0);
  let at = t.start;
  return chunks.map((c, i) => {
    const len = (t.duration * visible(c)) / total;
    const cap: Caption = {
      lineId: l.id,
      scene: l.scene,
      start: at,
      end: i === chunks.length - 1 ? t.end + 0.2 : at + len,
      text: c,
      audio: `narration/${l.id}.wav`,
    };
    at += len;
    return cap;
  });
});
