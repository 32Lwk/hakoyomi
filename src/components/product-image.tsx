import Image from "next/image";
import { packageImage } from "@/lib/packageImage";
import type { MedicineKind } from "@/lib/schema/product";
import { cn } from "@/lib/utils";

// 商品の目印。デモSKUはパッケージ写真、それ以外は種類のイメージ図（L-33・L-40）
export function ProductImage({
  id,
  kind,
  name,
  size,
  className,
  decorative = false,
}: {
  id: string;
  kind: MedicineKind;
  name: string;
  size: number;
  className?: string;
  decorative?: boolean;
}) {
  const image = packageImage(id, kind, name);
  const alt = decorative ? "" : image.alt;
  if (image.photo)
    return (
      <Image
        src={image.src}
        alt={alt}
        width={size}
        height={size}
        className={cn("object-contain", className)}
      />
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 小さな静的 SVG
    <img src={image.src} alt={alt} width={size} height={size} className={className} />
  );
}
