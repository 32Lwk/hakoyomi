import { DEMO_SKUS } from "@/data/demo_products";
import { illustrationAlt, illustrationSrc, KIND_LABEL } from "@/lib/illustration";
import type { MedicineKind } from "@/lib/schema/product";

// デモSKUのパッケージ写真を出すか（L-40）。権利の問題が出たら false にすると、全画面がイメージ図（L-33）に戻る
export const PACKAGE_PHOTOS = true;

export type PackageImage = { src: string; alt: string; caption: string; photo: boolean };

const photoById = new Map(DEMO_SKUS.map((s) => [s.id, s.imageUrl]));

export function packageImage(productId: string, kind: MedicineKind, name: string): PackageImage {
  const url = PACKAGE_PHOTOS ? photoById.get(productId) : null;
  if (url) return { src: url, alt: `${name}のパッケージ`, caption: "パッケージ写真", photo: true };
  return {
    src: illustrationSrc(kind, "box"),
    alt: illustrationAlt(kind),
    caption: `イメージ図（${KIND_LABEL[kind]}）`,
    photo: false,
  };
}
