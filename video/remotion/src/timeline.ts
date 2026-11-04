import timeline from "./timeline.json";
import { FPS } from "./theme";

export type SceneId = "S1" | "S2" | "S3" | "S4" | "S4.5" | "S5" | "S6" | "S7";
/** 録画の区切り（録画の秒）。play は from〜to を rate 倍、hold は at の絵で止める */
export type Segment =
  | { from: number; to: number; rate: number; note?: string }
  | { at: number; hold: number; note?: string };

export type SceneDef = {
  id: SceneId;
  title: string;
  startSec: number;
  durationSec: number;
  recording?: boolean;
  segments?: Segment[];
};

export const isHold = (g: Segment): g is Extract<Segment, { hold: number }> => "hold" in g;
export const segLen = (g: Segment) => (isHold(g) ? g.hold : (g.to - g.from) / g.rate);

/** 録画の秒 t が場面の何秒目に映るか（早送り・一時停止を足し引きした後）。区切りの外なら null */
export function outputSec(def: SceneDef, t: number): number | null {
  let at = 0;
  for (const g of def.segments ?? []) {
    if (!isHold(g) && t >= g.from && t <= g.to) return at + (t - g.from) / g.rate;
    at += segLen(g);
  }
  return null;
}

export const SCENES = timeline.scenes as SceneDef[];
export const scene = (id: SceneId) => {
  const s = SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`unknown scene ${id}`);
  return s;
};
export const sec = (s: number) => Math.round(s * FPS);
export const TOTAL_SEC = SCENES.reduce((m, s) => Math.max(m, s.startSec + s.durationSec), 0);
