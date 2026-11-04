import manifest from "./recordings.generated.json";
import type { SceneId } from "./timeline";

type Entry = { file: string; seconds: number | null };
const M = manifest as Record<string, Entry>;

// 録画の名前は「S2-jan-badges」のように場面の番号で始まる（video/record/scenes/*.mjs の name）
const keyOf = (id: SceneId) => id.toLowerCase().replace(".", "\\.?[-_]?");

export function findRecording(id: SceneId): (Entry & { name: string }) | null {
  const re = new RegExp(`^${keyOf(id)}(?:$|[-_])`, "i");
  const is45 = /^s4\.?[-_]?5(?:$|[-_])/i;
  for (const [name, e] of Object.entries(M)) {
    if (!re.test(name)) continue;
    if (id === "S4" && is45.test(name)) continue;
    return { name, ...e };
  }
  return null;
}
