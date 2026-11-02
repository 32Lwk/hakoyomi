import { ExternalLink, MapPin } from "lucide-react";
import { BadgeRow } from "@/components/badges";
import { UI_COPY } from "@/lib/guard/uiCopy";
import type { ProductView } from "@/lib/catalog";
import { illustrationAlt, illustrationSrc, KIND_LABEL } from "@/lib/illustration";

function amount(value: number | null, unit: string | null): string {
  if (value === null || unit === null) return "不明";
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`;
}

export function ProductCard({ view }: { view: ProductView }) {
  const { product, badges, group, location } = view;
  return (
    <article className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl leading-snug font-bold">{product.name}</h1>
        <p className="text-sm text-muted-foreground">
          {product.maker}・JAN {product.jan}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <figure className="flex shrink-0 flex-col items-center gap-1">
            {/* 実物の写真は使わない（L-28）。種類のイメージ図（L-33） */}
            {/* eslint-disable-next-line @next/next/no-img-element -- 小さな静的 SVG */}
            <img
              src={illustrationSrc(product.kind, "box")}
              alt={illustrationAlt(product.kind)}
              width={96}
              height={96}
              className="size-24 rounded-lg bg-muted p-1"
            />
            <figcaption className="text-[11px] text-muted-foreground">
              {UI_COPY.illustration}（{KIND_LABEL[product.kind]}）
            </figcaption>
          </figure>
          <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">区分</dt>
            <dd>
              <span className="rounded border border-foreground px-1.5 font-bold">
                {product.riskClass}
              </span>
            </dd>
            <dt className="text-muted-foreground">内容量</dt>
            <dd className="font-bold">
              {product.contentQty}
              {product.contentUnit}
            </dd>
            <dt className="text-muted-foreground">1日最大</dt>
            <dd>
              {product.dailyMaxUnits}
              {product.contentUnit}（{product.timesPerDay}回）
            </dd>
          </dl>
        </div>
      </header>

      <BadgeRow badges={badges} group={group} />

      <section aria-labelledby="facts-title" className="flex flex-col gap-2">
        <h2 id="facts-title" className="text-base font-bold">
          成分・分量（1日最大量あたり）
        </h2>
        <table className="w-full border-collapse overflow-hidden rounded-lg text-left">
          <tbody>
            {product.facts.map((f) => (
              <tr key={f.ingredient} className="border-b border-border last:border-0">
                <th scope="row" className="py-2 pr-2 text-sm font-normal">
                  {f.ingredient}
                </th>
                <td className="py-2 text-right">
                  {f.uncertain ? (
                    <span className="text-sm text-uncertain underline">{UI_COPY.uncertain}</span>
                  ) : (
                    <span className="text-xl font-bold tabular-nums">
                      {amount(f.amountPerDay, f.unit)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted-foreground">
          出典：この商品の成分・分量（入力：{product.enteredBy}
          {product.verifiedOn ? `、確認日 ${product.verifiedOn}` : "、未確認"}）
        </p>
      </section>

      {location && (
        <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
          <MapPin className="size-4 text-primary" aria-hidden="true" />
          <span>
            {location.areaLabel}　<span className="font-bold">{location.shelf.label}</span>　上から
            {location.tier}段目・左から{location.column}列目
          </span>
        </p>
      )}

      {product.pmdaUrl ? (
        <a
          href={product.pmdaUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1 text-sm text-primary underline"
        >
          添付文書を PMDA で開く
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      ) : (
        <p className="text-xs text-muted-foreground">{UI_COPY.demoProducts}</p>
      )}
    </article>
  );
}
