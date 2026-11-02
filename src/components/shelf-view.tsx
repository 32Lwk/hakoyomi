"use client";

import { useEffect, useState } from "react";
import { useStack } from "@/components/stack-provider";
import { Button } from "@/components/ui/button";
import type { MockStore, Rect, Shelf, ShelfLocation } from "@/data/mock_store";
import type { LocatedShelf } from "@/lib/catalog";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { illustrationAlt, illustrationSrc } from "@/lib/illustration";
import type { MedicineKind } from "@/lib/schema/product";
import { cn } from "@/lib/utils";

type Item = { id: string; name: string; kind: MedicineKind; location: LocatedShelf };
type Occupant = ShelfLocation & { name: string; kind: MedicineKind };
type ShelfData = { store: MockStore; items: Item[]; occupants: Occupant[] };
type Numbered = Item & { no: number };

// 売場図の色（design.md のトークンに合わせる）
const C = {
  floor: "#f6f8fa",
  line: "#d0d7de",
  fixture: "#ffffff",
  text: "#57606a",
  primary: "#1e3a5f",
  diff: "#f5b700",
  soft: "#eef2f7",
};

export function ShelfView() {
  const { ids, setScannerOpen } = useStack();
  const key = ids.join(",");
  const [data, setData] = useState<{ key: string; data: ShelfData } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/shelf?ids=${encodeURIComponent(key)}`)
      .then((res) => res.json() as Promise<ShelfData>)
      .then((d) => {
        if (!cancelled) setData({ key, data: d });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (!data || data.key !== key) return <p className="pt-6 text-muted-foreground">…</p>;
  const { store, items, occupants } = data.data;

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-4 pt-10 text-center">
        <p>{UI_COPY.emptyRead}</p>
        <Button onClick={() => setScannerOpen(true)} className="h-12 px-6">
          JANを読む
        </Button>
      </div>
    );
  }

  // 番号は読んだ順。リスト・売場図・棚の図で同じ番号を使う
  const numbered: Numbered[] = items.map((item, i) => ({ ...item, no: i + 1 }));
  const shelves = store.shelves.filter((s) => numbered.some((n) => n.location.shelfId === s.id));

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-col gap-2">
        {numbered.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <Marker no={item.no} />
            {/* eslint-disable-next-line @next/next/no-img-element -- 小さな静的 SVG */}
            <img
              src={illustrationSrc(item.kind, "box")}
              alt={illustrationAlt(item.kind)}
              width={40}
              height={40}
              className="size-10 shrink-0 rounded bg-muted p-0.5"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{item.name}</span>
              <span className="block text-sm text-muted-foreground">
                {item.location.shelf.label}（{item.location.areaLabel}）・上から
                {item.location.tier}段目・左から{item.location.column}列目
              </span>
            </span>
          </li>
        ))}
      </ol>

      <section aria-labelledby="map-title" className="flex flex-col gap-2">
        <h2 id="map-title" className="text-base font-bold">
          売場図
        </h2>
        <StoreMap store={store} items={numbered} />
        <p className="text-xs text-muted-foreground">
          点線はレジ前からの道順です。上が店の奥、下が入口側。{UI_COPY.mockNotice}
        </p>
      </section>

      {shelves.map((shelf) => (
        <ShelfFront
          key={shelf.id}
          shelf={shelf}
          items={numbered.filter((n) => n.location.shelfId === shelf.id)}
          occupants={occupants.filter((o) => o.shelfId === shelf.id)}
        />
      ))}
    </div>
  );
}

function box(r: Rect) {
  return { x: r.x, y: r.y, width: r.w, height: r.h };
}

// 棚の面の、通路側の線の y と、そこに立つ位置の y
function faceGeometry(store: MockStore, shelf: Shelf) {
  const g = store.gondolas.find((x) => x.id === shelf.gondolaId);
  if (!g) return null;
  const half = g.h / 2;
  const faceY = shelf.side === "N" ? g.y : g.y + g.h;
  const standY = shelf.side === "N" ? g.y - 4 : g.y + g.h + 4;
  const bandY = shelf.side === "N" ? g.y : g.y + half;
  return { g, half, faceY, standY, bandY };
}

function StoreMap({ store, items }: { store: MockStore; items: Numbered[] }) {
  const activeShelves = new Set(items.map((i) => i.location.shelfId));
  const { w, h } = store.size;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="売場図。番号の位置が商品の棚"
      className="w-full rounded-lg border border-border"
      style={{ background: C.floor }}
    >
      {/* 外壁と入口 */}
      <rect
        x={1}
        y={1}
        width={w - 2}
        height={h - 2}
        fill="none"
        stroke={C.text}
        strokeWidth={0.8}
      />
      <rect {...box(store.entrance)} fill={C.floor} />
      <line
        x1={store.entrance.x}
        x2={store.entrance.x + store.entrance.w}
        y1={h - 1}
        y2={h - 1}
        stroke={C.text}
        strokeWidth={0.6}
        strokeDasharray="1.5 1"
      />
      <text
        x={store.entrance.x + store.entrance.w / 2}
        y={h - 4}
        fontSize={3}
        textAnchor="middle"
        fill={C.text}
      >
        入口（自動ドア）
      </text>

      {/* 壁面の棚 */}
      {store.walls.map((wall) => (
        <g key={wall.id}>
          <rect {...box(wall)} fill={C.fixture} stroke={C.line} strokeWidth={0.4} />
          <text
            x={wall.x + wall.w / 2}
            y={wall.y + wall.h / 2}
            fontSize={2.6}
            textAnchor="middle"
            dominantBaseline="central"
            fill={C.text}
            transform={
              wall.vertical
                ? `rotate(-90 ${wall.x + wall.w / 2} ${wall.y + wall.h / 2})`
                : undefined
            }
          >
            {wall.label}
          </text>
        </g>
      ))}

      {/* ゴンドラ（両面）とエンド */}
      {store.gondolas.map((g) => (
        <g key={g.id}>
          <rect
            x={g.x}
            y={g.y}
            width={g.w}
            height={g.h}
            fill={C.fixture}
            stroke={C.line}
            strokeWidth={0.4}
          />
          <line
            x1={g.x}
            x2={g.x + g.w}
            y1={g.y + g.h / 2}
            y2={g.y + g.h / 2}
            stroke={C.line}
            strokeWidth={0.3}
          />
          <rect
            x={g.x + g.w}
            y={g.y}
            width={6}
            height={g.h}
            fill={C.soft}
            stroke={C.line}
            strokeWidth={0.4}
          />
          <text
            x={g.x + g.w + 3}
            y={g.y + g.h / 2}
            fontSize={2.2}
            textAnchor="middle"
            dominantBaseline="central"
            fill={C.text}
            transform={`rotate(-90 ${g.x + g.w + 3} ${g.y + g.h / 2})`}
          >
            エンド
          </text>
        </g>
      ))}

      {/* 棚の面（該当する面は濃紺で塗る） */}
      {store.shelves.map((shelf) => {
        const geo = faceGeometry(store, shelf);
        if (!geo) return null;
        const active = activeShelves.has(shelf.id);
        return (
          <g key={shelf.id}>
            <rect
              x={geo.g.x + 0.4}
              y={geo.bandY + 0.4}
              width={geo.g.w - 0.8}
              height={geo.half - 0.8}
              fill={active ? C.primary : C.fixture}
            />
            <text
              x={geo.g.x + geo.g.w / 2}
              y={geo.bandY + geo.half / 2}
              fontSize={2.7}
              fontWeight={active ? 700 : 400}
              textAnchor="middle"
              dominantBaseline="central"
              fill={active ? "#ffffff" : C.text}
            >
              {shelf.id} {shelf.category}
            </text>
          </g>
        );
      })}

      {/* レジ */}
      <rect {...box(store.register)} fill={C.soft} stroke={C.text} strokeWidth={0.5} rx={1} />
      <text
        x={store.register.x + store.register.w / 2}
        y={store.register.y + store.register.h / 2}
        fontSize={3.2}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
        fill={C.primary}
      >
        レジ
      </text>

      {/* レジ前から各棚への道順 */}
      {items.map((item) => {
        const geo = faceGeometry(store, item.location.shelf);
        if (!geo) return null;
        const tx = geo.g.x + ((item.location.column - 0.5) / item.location.shelf.columns) * geo.g.w;
        const { start, mainAisleX } = store;
        const points = [
          [start.x, start.y],
          [mainAisleX, start.y],
          [mainAisleX, geo.standY],
          [tx, geo.standY],
        ]
          .map((p) => p.join(","))
          .join(" ");
        return (
          <g key={item.id}>
            <polyline
              points={points}
              fill="none"
              stroke={C.primary}
              strokeWidth={0.7}
              strokeDasharray="1.6 1.2"
              strokeLinejoin="round"
            />
            <line
              x1={tx}
              x2={tx}
              y1={geo.standY}
              y2={geo.faceY}
              stroke={C.diff}
              strokeWidth={1.2}
            />
            <circle
              cx={tx}
              cy={geo.standY}
              r={3}
              fill={C.diff}
              stroke={C.primary}
              strokeWidth={0.5}
            />
            <text
              x={tx}
              y={geo.standY}
              fontSize={3.4}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="central"
              fill={C.primary}
            >
              {item.no}
            </text>
          </g>
        );
      })}

      {/* 現在地 */}
      <circle cx={store.start.x} cy={store.start.y} r={2.2} fill={C.primary} />
      <circle
        cx={store.start.x}
        cy={store.start.y}
        r={3.6}
        fill="none"
        stroke={C.primary}
        strokeWidth={0.4}
      />
      <text
        x={store.start.x - 5}
        y={store.start.y}
        fontSize={2.8}
        textAnchor="end"
        dominantBaseline="central"
        fill={C.primary}
        fontWeight={700}
      >
        現在地（{store.start.label}）
      </text>
    </svg>
  );
}

function tierLabel(tier: number, tiers: number): string {
  if (tier === 1) return "最上段";
  if (tier === tiers) return "最下段";
  return `${tier}段目`;
}

function ShelfFront({
  shelf,
  items,
  occupants,
}: {
  shelf: Shelf;
  items: Numbered[];
  occupants: Occupant[];
}) {
  return (
    <section aria-label={`${shelf.label} の正面`} className="flex flex-col gap-2">
      <h2 className="text-base font-bold">
        {shelf.label}（{shelf.category}）の正面
      </h2>
      <div className="overflow-hidden rounded-lg border-2 border-neutral-400 bg-neutral-100">
        {/* 売場の看板 */}
        <div className="bg-primary px-3 py-1.5 text-center text-sm font-bold text-primary-foreground">
          {shelf.id}　{shelf.category}
        </div>
        <div className="flex flex-col gap-0 px-1.5 pt-1.5">
          {Array.from({ length: shelf.tiers }, (_, t) => {
            const tier = t + 1;
            return (
              <div key={tier} className="flex items-stretch gap-1.5">
                <span className="flex w-9 shrink-0 items-center justify-center text-center text-[10px] leading-tight text-muted-foreground">
                  {tierLabel(tier, shelf.tiers)}
                </span>
                <div className="flex-1">
                  <div
                    className="grid gap-1 pt-1"
                    style={{ gridTemplateColumns: `repeat(${shelf.columns}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: shelf.columns }, (_, c) => {
                      const column = c + 1;
                      const target = items.find(
                        (n) => n.location.tier === tier && n.location.column === column,
                      );
                      const other = occupants.find((o) => o.tier === tier && o.column === column);
                      return (
                        <div
                          key={column}
                          className={cn(
                            "relative flex aspect-[3/4] items-end justify-center rounded-sm",
                            target && "ring-4 ring-diff",
                          )}
                          aria-label={
                            target
                              ? `${target.name}：${tierLabel(tier, shelf.tiers)}・左から${column}列目`
                              : undefined
                          }
                        >
                          {other ? (
                            // eslint-disable-next-line @next/next/no-img-element -- 小さな静的 SVG
                            <img
                              src={illustrationSrc(other.kind, "box")}
                              alt=""
                              className={cn("size-full object-contain", !target && "opacity-35")}
                            />
                          ) : (
                            <FillerPackage />
                          )}
                          {target && (
                            <span className="absolute -top-2 -right-1">
                              <Marker no={target.no} />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* 値札レール */}
                  <div className="mt-0.5 flex h-3 items-center justify-around rounded-[2px] bg-neutral-300">
                    {Array.from({ length: shelf.columns }, (_, c) => (
                      <span key={c} className="h-2 w-3 rounded-[1px] bg-white" />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 h-2 bg-neutral-400" />
      </div>
      <p className="text-xs text-muted-foreground">
        黄色の枠が該当の場所です。薄い箱は同じ棚のほかの商品（イメージ図）です。
      </p>
    </section>
  );
}

// 棚の空き位置に置く、無地の箱（ほかの商品の代わり）
function FillerPackage() {
  return (
    <span className="flex size-[78%] flex-col overflow-hidden rounded-[2px] border border-neutral-300 bg-white opacity-70">
      <span className="h-1/4 bg-neutral-300" />
    </span>
  );
}

function Marker({ no }: { no: number }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow">
      {no}
    </span>
  );
}
