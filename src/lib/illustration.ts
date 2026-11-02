import type { MedicineKind } from "@/lib/schema/product";

// 薬の種類のイメージ図（L-33）。実在の商品のパッケージではない
export const KIND_LABEL: Record<MedicineKind, string> = {
  cold: "かぜ薬",
  fever: "解熱鎮痛薬",
  cough: "せき止め",
  rhinitis: "鼻炎薬",
  nasal: "点鼻薬",
  stomach: "胃腸薬",
  eye: "目薬",
  topical: "外用薬",
  vitamin: "ビタミン剤",
  sleep: "睡眠改善薬",
  kampo: "漢方薬",
  motion: "乗り物酔い薬",
};

export type IllustrationPattern =
  | "box"
  | "box2"
  | "form"
  | "form2"
  | "symbol"
  | "symbol2"
  | "duo"
  | "slim"
  | "square"
  | "pouch"
  | "carton";

// パッケージ型だけ同じ形の描き分け v2〜v5 がある（L-37）。v1 が基本
export type PackagePattern = "box" | "box2" | "slim" | "square" | "pouch" | "carton";
export type IllustrationVariant = 1 | 2 | 3 | 4 | 5;

export function illustrationSrc(
  kind: MedicineKind,
  pattern: IllustrationPattern,
  variant: IllustrationVariant = 1,
): string {
  const isPackage = ["box", "box2", "slim", "square", "pouch", "carton"].includes(pattern);
  const suffix = isPackage && variant > 1 ? `-v${variant}` : "";
  return `/illustrations/${kind}-${pattern}${suffix}.svg`;
}

export function illustrationAlt(kind: MedicineKind): string {
  return `${KIND_LABEL[kind]}のイメージ図`;
}
