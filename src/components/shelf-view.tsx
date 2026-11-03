"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/product-image";
import { useStack } from "@/components/stack-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BAY_W,
  ZONE_LABEL,
  sectionAt,
  type Area,
  type Face,
  type Fixture,
  type MockStore,
  type Rect,
  type Shelf,
  type ShelfLocation,
  type Side,
  type Zone,
} from "@/data/mock_store";
import type { LocatedShelf } from "@/lib/catalog";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { illustrationSrc, type IllustrationVariant, type PackagePattern } from "@/lib/illustration";
import type { MedicineKind } from "@/lib/schema/product";
import { cn } from "@/lib/utils";

type Item = { id: string; name: string; kind: MedicineKind; location: LocatedShelf };
type Occupant = ShelfLocation & { name: string; kind: MedicineKind };
type ShelfData = { store: MockStore; items: Item[]; occupants: Occupant[] };
type Numbered = Item & { no: number };
type Pt = [number, number];
type View = "zoom" | "overall";

// 売場図の色（design.md のトークンに合わせる）。売場のまとまりは薄い色で塗り分ける
const C = {
  floor: "#f6f8fa",
  line: "#9aa4ae",
  fixture: "#ffffff",
  text: "#57606a",
  primary: "#1e3a5f",
  diff: "#f5b700",
  staff: "#e4e7eb",
};
const ZONE_FILL: Record<Zone, string> = {
  medicine: "#dce7f5",
  health: "#e3efd9",
  food: "#f5ead6",
  daily: "#e2eee6",
  cosmetics: "#f7e1ea",
};

export function ShelfView() {
  const { ids, currentId, add, select: selectProduct, setScannerOpen } = useStack();
  const router = useRouter();
  const key = ids.join(",");
  const [data, setData] = useState<{ key: string; data: ShelfData } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [view, setView] = useState<View>("zoom");
  const [open, setOpen] = useState(false);
  const mapRef = useRef<HTMLElement>(null);

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

  // 番号は読んだ順。リスト・売場図・棚の図で同じ番号を使う
  const numbered: Numbered[] = items.map((item, i) => ({ ...item, no: i + 1 }));
  // 選んだ棚。選ぶ前は、いま見ている商品（なければ1品目）の棚
  const fallback =
    numbered.find((n) => n.id === currentId)?.location.shelfId ?? numbered[0]?.location.shelfId;
  const selectedId = picked ?? fallback ?? null;
  const shelf = store.shelves.find((s) => s.id === selectedId) ?? null;
  const area = store.areas.find((a) => a.id === selectedId) ?? null;

  // 棚・売場を押すと、ボトムシートで開く
  function select(id: string) {
    setPicked(id);
    setOpen(true);
  }

  function showMedicine() {
    setOpen(false);
    setView("zoom");
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // 商品カードを開く。読んだ商品ならそのまま選び、ほかは読んだ商品に足す
  function openProduct(id: string) {
    if (ids.includes(id)) selectProduct(id);
    else add(id);
    setOpen(false);
    router.push("/products");
  }

  return (
    <div className="flex flex-col gap-5">
      {numbered.length > 0 ? (
        <ol className="flex flex-col gap-1.5" aria-label="読んだ商品の場所">
          {numbered.map((item) => {
            const on = selectedId === item.location.shelfId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => select(item.location.shelfId)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left",
                    on ? "border-diff bg-diff-soft" : "border-border bg-card",
                  )}
                >
                  <Marker no={item.no} />
                  <ProductImage
                    id={item.id}
                    kind={item.kind}
                    name={item.name}
                    size={40}
                    className="size-10 shrink-0 rounded bg-muted p-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{item.name}</span>
                    <span className="block text-sm">
                      <span className="font-bold text-primary">{item.location.shelf.label}</span>
                      <span className="text-muted-foreground">
                        （{item.location.shelf.where}）上から{item.location.tier}段目・左から
                        {item.location.column}列目
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2.5 text-sm">
          <span>{UI_COPY.emptyRead}</span>
          <Button onClick={() => setScannerOpen(true)} className="h-10 shrink-0 px-4">
            JANを読む
          </Button>
        </div>
      )}

      <section
        ref={mapRef}
        aria-labelledby="map-title"
        className="flex scroll-mt-16 flex-col gap-2"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="map-title" className="text-base font-bold">
            売場図
          </h2>
          <div role="tablist" className="flex rounded-lg bg-muted p-0.5 text-sm">
            {(
              [
                ["zoom", "医薬品売場"],
                ["overall", "店全体"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-3 py-1",
                  view === v ? "bg-card font-bold text-primary shadow-sm" : "text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <StoreMap
          store={store}
          items={numbered}
          selectedId={selectedId}
          onSelect={select}
          view={view}
        />
        <p className="text-xs text-muted-foreground">
          棚をタップすると、棚の正面が開きます。
          {view === "overall"
            ? "点線の枠が医薬品売場です（「医薬品売場」で拡大）。"
            : "数字は左から何本目か（正面に立って見たとき）です。"}
        </p>
        <MapLegend />
      </section>

      <Sheet open={open && !!(shelf || area)} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className={cn(
            "gap-0 rounded-t-2xl px-4 pt-2 pb-0",
            // 棚は画面の高さに収めてスクロールさせない。売場（医薬品以外）は高さ自動
            shelf
              ? "overflow-hidden data-[side=bottom]:h-[92dvh]"
              : "max-h-[92dvh] overflow-y-auto",
          )}
        >
          <span
            aria-hidden="true"
            className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30"
          />
          {shelf ? (
            <ShelfPanel
              key={shelf.id}
              store={store}
              shelf={shelf}
              items={numbered}
              occupants={occupants}
              onOpenProduct={openProduct}
            />
          ) : area ? (
            <AreaPanel area={area} onShowMedicine={showMedicine} />
          ) : null}
        </SheetContent>
      </Sheet>

      <p className="text-xs text-muted-foreground">
        売場は約20m×28m（約170坪）、棚1本は幅90cm・通路は1.6〜1.8mの想定で描いています。上が店の奥、下が入口側。
        {UI_COPY.mockNotice}
      </p>
    </div>
  );
}

function box(r: Rect) {
  return { x: r.x, y: r.y, width: r.w, height: r.h };
}

// 面の矩形（ゴンドラは片側半分、壁面は全体）
function faceRect(f: Fixture, side: Side): Rect {
  if (f.kind !== "gondola") return f;
  return { x: f.x, y: side === "S" ? f.y + f.h / 2 : f.y, w: f.w, h: f.h / 2 };
}

// 面の中の1本（左から bay 本目）の矩形。面の向きで左右が地図と逆になる
function bayRect(f: Fixture, side: Side, bay: number): Rect {
  const i = bay - 1;
  const r = faceRect(f, side);
  if (f.vertical) {
    // W 面は東を向いて立つので左が奥（上）、E 面は西を向くので左が入口側（下）
    const y = side === "W" ? r.y + i * BAY_W : r.y + r.h - (i + 1) * BAY_W;
    return { x: r.x, y, w: r.w, h: BAY_W };
  }
  // S 面は北を向いて立つので左が西、N 面は南を向くので左が東
  const x = side === "N" ? r.x + r.w - (i + 1) * BAY_W : r.x + i * BAY_W;
  return { x, y: r.y, w: BAY_W, h: r.h };
}

// 棚の列の、面の上の点と、その前（通路の中ほど）に立つ点
function spot(f: Fixture, shelf: Shelf, column: number): { face: Pt; stand: Pt } {
  const r = bayRect(f, shelf.side, shelf.bay);
  const t = (column - 0.5) / shelf.columns;
  switch (shelf.side) {
    case "S": {
      const x = r.x + t * r.w;
      return { face: [x, f.y + f.h], stand: [x, f.y + f.h + 0.8] };
    }
    case "N": {
      const x = r.x + r.w - t * r.w;
      return { face: [x, f.y], stand: [x, f.y - 0.8] };
    }
    case "W": {
      const y = r.y + t * r.h;
      return { face: [f.x, y], stand: [f.x - 0.8, y] };
    }
    case "E": {
      const y = r.y + r.h - t * r.h;
      return { face: [f.x + f.w, y], stand: [f.x + f.w + 0.8, y] };
    }
  }
}

// 現在地から棚の前までの道順。主通路から棚の前の通路に入る
function route(store: MockStore, f: Fixture, stand: Pt): Pt[] {
  const { start, mainAisleX } = store;
  const pts: Pt[] = [[start.x, start.y]];
  if (f.via) pts.push(...f.via);
  else pts.push([mainAisleX, start.y], [mainAisleX, stand[1]]);
  pts.push(stand);
  return pts;
}

// 枠に収まる文字の大きさ
function fit(text: string, length: number, max: number) {
  return Math.min(max, (length * 0.9) / Math.max(text.length, 1));
}

// タップできる矩形
function Tappable({
  rect,
  label,
  fill,
  onSelect,
}: {
  rect: Rect;
  label: string;
  fill: string;
  onSelect: () => void;
}) {
  return (
    <rect
      {...box(rect)}
      role="button"
      tabIndex={0}
      aria-label={label}
      className="cursor-pointer outline-none"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      fill={fill}
      stroke={C.fixture}
      strokeWidth={0.04}
    />
  );
}

function FaceShapes({
  store,
  f,
  face,
  active,
  selectedId,
  onSelect,
  view,
}: {
  store: MockStore;
  f: Fixture;
  face: Face;
  active: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  view: View;
}) {
  if (!face.bays) {
    const area = store.areas.find((a) => a.fixtureId === f.id && a.side === face.side);
    return (
      <Tappable
        rect={faceRect(f, face.side)}
        label={`${face.title}（${ZONE_LABEL[face.zone]}の売場）`}
        fill={area && area.id === selectedId ? C.diff : ZONE_FILL[face.zone]}
        onSelect={() => area && onSelect(area.id)}
      />
    );
  }
  const shelves = store.shelves.filter((s) => s.fixtureId === f.id && s.side === face.side);
  return (
    <>
      {shelves.map((s) => {
        const r = bayRect(f, s.side, s.bay);
        const on = active.has(s.id);
        const cx = r.x + r.w / 2;
        const cy = r.y + r.h / 2;
        return (
          <g key={s.id}>
            <Tappable
              rect={r}
              label={`${s.label} ${s.category}`}
              // 読んだ商品の棚は濃紺、選んでいる棚は黄色
              fill={on ? C.primary : s.id === selectedId ? C.diff : ZONE_FILL.medicine}
              onSelect={() => onSelect(s.id)}
            />
            {view === "zoom" && (
              <text
                x={cx}
                y={cy}
                fontSize={0.38}
                fontWeight={700}
                textAnchor="middle"
                dominantBaseline="central"
                fill={on ? "#ffffff" : C.primary}
                pointerEvents="none"
              >
                {s.bay}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}

// 拡大図：面の前の通路に、面の棚番と売場名を書く（番号の丸と道順の線に重ならない位置）
function FaceTitle({ f, face }: { f: Fixture; face: Face }) {
  const medicine = !!face.bays;
  const text = medicine ? `${face.code}　${face.title}` : face.title;
  if (f.vertical) {
    const x = face.side === "W" ? f.x - 0.55 : f.x + f.w + 0.55;
    const y = f.y + f.h / 2;
    return (
      <text
        x={x}
        y={y}
        fontSize={fit(text, f.h, 0.34)}
        fontWeight={medicine ? 700 : 400}
        textAnchor="middle"
        dominantBaseline="central"
        fill={medicine ? C.primary : C.text}
        transform={`rotate(-90 ${x} ${y})`}
        pointerEvents="none"
      >
        {text}
      </text>
    );
  }
  const y = face.side === "N" ? f.y - 0.55 : f.y + f.h + 0.55;
  return (
    <text
      x={f.x + f.w / 2}
      y={y}
      fontSize={fit(text, f.w, 0.36)}
      fontWeight={medicine ? 700 : 400}
      textAnchor="middle"
      dominantBaseline="central"
      fill={medicine ? C.primary : C.text}
      pointerEvents="none"
    >
      {text}
    </text>
  );
}

function FixtureShapes({
  store,
  f,
  active,
  selectedId,
  onSelect,
  view,
}: {
  store: MockStore;
  f: Fixture;
  active: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  view: View;
}) {
  const e = store.endcapDepth;
  const selShelf = store.shelves.find((s) => s.fixtureId === f.id && s.id === selectedId);
  const selArea = store.areas.find((a) => a.fixtureId === f.id && a.id === selectedId);
  const selRect = selShelf
    ? bayRect(f, selShelf.side, selShelf.bay)
    : selArea
      ? faceRect(f, selArea.side)
      : null;
  return (
    <g>
      {f.faces.map((face) => (
        <FaceShapes
          key={face.side}
          store={store}
          f={f}
          face={face}
          active={active}
          selectedId={selectedId}
          onSelect={onSelect}
          view={view}
        />
      ))}
      <rect {...box(f)} fill="none" stroke={C.line} strokeWidth={0.05} pointerEvents="none" />
      {f.kind === "gondola" && (
        <>
          <line
            x1={f.x}
            x2={f.x + f.w}
            y1={f.y + f.h / 2}
            y2={f.y + f.h / 2}
            stroke={C.line}
            strokeWidth={0.05}
            pointerEvents="none"
          />
          {/* 両端のエンド */}
          {(
            [
              [f.x - e, f.endcaps?.west],
              [f.x + f.w, f.endcaps?.east],
            ] as const
          ).map(([x, label]) => (
            <g key={x} pointerEvents="none">
              <rect
                x={x}
                y={f.y}
                width={e}
                height={f.h}
                fill={C.fixture}
                stroke={C.line}
                strokeWidth={0.05}
              />
              {view === "zoom" && label && (
                <text
                  x={x + e / 2}
                  y={f.y + f.h / 2}
                  fontSize={fit(label, f.h, 0.3)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={C.text}
                  transform={`rotate(-90 ${x + e / 2} ${f.y + f.h / 2})`}
                >
                  {label}
                </text>
              )}
            </g>
          ))}
        </>
      )}
      {view === "zoom" && f.faces.map((face) => <FaceTitle key={face.side} f={f} face={face} />)}
      {/* 選んだ棚の枠（いちばん上に描く） */}
      {selRect && (
        <rect
          {...box(selRect)}
          fill="none"
          stroke={C.diff}
          strokeWidth={0.16}
          pointerEvents="none"
        />
      )}
    </g>
  );
}

function StoreMap({
  store,
  items,
  selectedId,
  onSelect,
  view,
}: {
  store: MockStore;
  items: Numbered[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  view: View;
}) {
  const active = new Set(items.map((i) => i.location.shelfId));
  const { w, h } = store.size;
  const { staffArea, counter, register, entrance, carts, start, medicineZone } = store;
  const vb = view === "zoom" ? store.zoom : { x: 0, y: 0, w, h };
  const zoom = view === "zoom";
  // 拡大図では、列のあいだの通路（ゴンドラのエンドの左）に描く
  const aisleX = zoom ? store.zoom.x + 0.35 : 1.5;
  return (
    <svg
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      role="group"
      aria-label={
        zoom
          ? "医薬品売場の拡大図。棚をタップすると正面図が出ます"
          : "店全体の売場図。棚をタップすると売場がわかります"
      }
      className="w-full rounded-xl border border-border select-none"
      style={{ background: C.floor }}
    >
      {/* 外壁 */}
      <rect x={0} y={0} width={w} height={h} fill="none" stroke={C.text} strokeWidth={0.16} />

      {/* スタッフ側（相談カウンターとレジの内側） */}
      <rect {...box(staffArea)} fill={C.staff} />
      <text
        x={staffArea.x + staffArea.w / 2}
        y={register.y + register.h / 2}
        fontSize={0.38}
        textAnchor="middle"
        dominantBaseline="central"
        fill={C.text}
        transform={`rotate(90 ${staffArea.x + staffArea.w / 2} ${register.y + register.h / 2})`}
      >
        スタッフ側
      </text>
      {(
        [
          [counter, "医薬品の相談"],
          [register, "レジ"],
        ] as const
      ).map(([r, label]) => (
        <g key={label}>
          <rect {...box(r)} fill={C.primary} rx={0.12} />
          <text
            x={r.x + r.w / 2}
            y={r.y + r.h / 2}
            fontSize={fit(label, r.h, 0.5)}
            fontWeight={700}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            letterSpacing={label === "レジ" ? 0.4 : 0}
            transform={`rotate(-90 ${r.x + r.w / 2} ${r.y + r.h / 2})`}
          >
            {label}
          </text>
        </g>
      ))}

      {store.fixtures.map((f) => (
        <FixtureShapes
          key={f.id}
          store={store}
          f={f}
          active={active}
          selectedId={selectedId}
          onSelect={onSelect}
          view={view}
        />
      ))}

      {/* 店全体：売場のまとまり・医薬品売場の枠・平台・カート・入口・縮尺 */}
      {!zoom && (
        <g pointerEvents="none">
          {store.zoneLabels.map((z, i) => (
            <text
              key={i}
              x={z.x}
              y={z.y}
              fontSize={0.8}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="central"
              fill={C.text}
              stroke="#ffffff"
              strokeWidth={0.25}
              paintOrder="stroke"
            >
              {ZONE_LABEL[z.zone]}
            </text>
          ))}
          <rect
            {...box(medicineZone)}
            rx={0.4}
            fill="none"
            stroke={C.primary}
            strokeWidth={0.12}
            strokeDasharray="0.4 0.25"
          />
          <text
            x={medicineZone.x + 0.2}
            y={medicineZone.y - 0.45}
            fontSize={0.7}
            fontWeight={700}
            fill={C.primary}
            stroke="#ffffff"
            strokeWidth={0.22}
            paintOrder="stroke"
          >
            医薬品売場
          </text>
          {store.tables.map((t) => (
            <g key={t.label}>
              <rect {...box(t)} fill={C.fixture} stroke={C.line} strokeWidth={0.05} />
              <text
                x={t.x + t.w / 2}
                y={t.y + t.h / 2}
                fontSize={0.45}
                textAnchor="middle"
                dominantBaseline="central"
                fill={C.text}
              >
                {t.label}
              </text>
            </g>
          ))}
          <rect {...box(carts)} fill={C.fixture} stroke={C.line} strokeWidth={0.05} />
          <text
            x={carts.x + carts.w / 2}
            y={carts.y + carts.h / 2}
            fontSize={0.42}
            textAnchor="middle"
            dominantBaseline="central"
            fill={C.text}
          >
            カゴ・カート
          </text>
          <rect {...box(entrance)} fill={C.floor} />
          <line
            x1={entrance.x}
            x2={entrance.x + entrance.w}
            y1={h - 0.1}
            y2={h - 0.1}
            stroke={C.text}
            strokeWidth={0.12}
            strokeDasharray="0.3 0.2"
          />
          <text
            x={entrance.x + entrance.w / 2}
            y={h - 0.6}
            fontSize={0.5}
            textAnchor="middle"
            fill={C.text}
          >
            ▲ 入口
          </text>
          {/* 縮尺 */}
          <g transform="translate(0.9 26.6)">
            <line x1={0} x2={5} y1={0} y2={0} stroke={C.text} strokeWidth={0.08} />
            <line x1={0} x2={0} y1={-0.2} y2={0.2} stroke={C.text} strokeWidth={0.08} />
            <line x1={5} x2={5} y1={-0.2} y2={0.2} stroke={C.text} strokeWidth={0.08} />
            <text x={2.5} y={-0.35} fontSize={0.45} textAnchor="middle" fill={C.text}>
              5m
            </text>
          </g>
        </g>
      )}

      {/* 通路番号の札 */}
      {store.aisles.map((a) => (
        <g key={a.no} pointerEvents="none">
          <circle cx={aisleX} cy={a.y} r={0.4} fill={C.text} />
          <text
            x={aisleX}
            y={a.y}
            fontSize={0.48}
            fontWeight={700}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
          >
            {a.no}
          </text>
        </g>
      ))}

      {/* 現在地から各棚への道順 */}
      {items.map((item) => {
        const shelf = item.location.shelf;
        const f = store.fixtures.find((x) => x.id === shelf.fixtureId);
        if (!f) return null;
        const { face, stand } = spot(f, shelf, item.location.column);
        return (
          <g key={item.id} pointerEvents="none">
            <polyline
              points={[...route(store, f, stand), face].map((p) => p.join(",")).join(" ")}
              fill="none"
              stroke={C.primary}
              strokeWidth={0.1}
              strokeDasharray="0.28 0.2"
              strokeLinejoin="round"
            />
          </g>
        );
      })}
      {/* 番号の丸は道順の線より上に描く。丸を押してもその棚を選べる */}
      {items.map((item) => {
        const shelf = item.location.shelf;
        const f = store.fixtures.find((x) => x.id === shelf.fixtureId);
        if (!f) return null;
        // 丸は棚の面の上（どの列か）に置く
        const { face } = spot(f, shelf, item.location.column);
        const r = zoom ? 0.36 : 0.5;
        return (
          <g
            key={item.id}
            className="cursor-pointer"
            onClick={() => onSelect(shelf.id)}
            aria-hidden="true"
          >
            <circle
              cx={face[0]}
              cy={face[1]}
              r={r}
              fill={C.diff}
              stroke={C.primary}
              strokeWidth={0.07}
            />
            <text
              x={face[0]}
              y={face[1]}
              fontSize={r * 1.2}
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
      <g pointerEvents="none">
        <circle cx={start.x} cy={start.y} r={0.22} fill={C.primary} />
        <circle
          cx={start.x}
          cy={start.y}
          r={0.42}
          fill="none"
          stroke={C.primary}
          strokeWidth={0.07}
        />
        <text
          x={start.x - 0.5}
          y={start.y + 0.1}
          fontSize={0.42}
          fontWeight={700}
          textAnchor="end"
          dominantBaseline="central"
          fill={C.primary}
          stroke="#ffffff"
          strokeWidth={0.12}
          paintOrder="stroke"
        >
          {start.label}
        </text>
      </g>
    </svg>
  );
}

function MapLegend() {
  return (
    <ul className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
      {(["medicine", "food", "daily", "cosmetics", "health"] as const).map((z) => (
        <li key={z} className="flex items-center gap-1.5">
          <span
            className="inline-block size-3 rounded-[2px] border border-border"
            style={{ background: ZONE_FILL[z] }}
          />
          {ZONE_LABEL[z]}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-[2px] bg-primary" />
        読んだ商品の棚
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-[2px] bg-diff" />
        選んでいる棚
      </li>
      <li className="flex items-center gap-1.5">
        <span className="flex size-3.5 items-center justify-center rounded-full bg-neutral-500 text-[8px] font-bold text-white">
          1
        </span>
        通路番号
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block w-4 border-t-2 border-dashed border-primary" />
        現在地からの道順
      </li>
    </ul>
  );
}

function tierLabel(tier: number, tiers: number): string {
  if (tier === 1) return "最上段";
  if (tier === tiers) return "最下段";
  return `${tier}段目`;
}

function faceTitle(f: Fixture, side: Side): string {
  if (f.kind === "wall") return f.name;
  return `${f.name}の${side === "N" ? "奥側" : "入口側"}の面`;
}

// 医薬品以外の売場：売場名だけ
function AreaPanel({ area, onShowMedicine }: { area: Area; onShowMedicine: () => void }) {
  return (
    <div className="flex flex-col gap-3 pb-6">
      <SheetHeader className="p-0 pr-8">
        <SheetDescription className="text-xs">{area.where}</SheetDescription>
        <SheetTitle className="flex items-center gap-2 text-lg font-bold">
          <span
            className="inline-block size-3.5 rounded-[3px] border border-border"
            style={{ background: ZONE_FILL[area.zone] }}
          />
          {area.name}
          <span className="text-sm font-normal text-muted-foreground">
            （{ZONE_LABEL[area.zone]}）
          </span>
        </SheetTitle>
      </SheetHeader>
      <p className="text-sm text-muted-foreground">
        医薬品以外の売場です。ハコよみでは医薬品の棚だけ中を表示します。
      </p>
      <Button onClick={onShowMedicine} className="h-11">
        医薬品売場を見る
      </Button>
    </div>
  );
}

// 正面図で押した箱
type Box = { tier: number; column: number };

// 選んだ棚：場所の説明・正面図・押した箱の情報。シートの高さに収める
function ShelfPanel({
  store,
  shelf,
  items,
  occupants,
  onOpenProduct,
}: {
  store: MockStore;
  shelf: Shelf;
  items: Numbered[];
  occupants: Occupant[];
  onOpenProduct: (id: string) => void;
}) {
  const [pickedBox, setPickedBox] = useState<Box | null>(null);
  const fixture = store.fixtures.find((f) => f.id === shelf.fixtureId);
  if (!fixture) return null;
  const row = store.shelves
    .filter((s) => s.fixtureId === shelf.fixtureId && s.side === shelf.side)
    .sort((a, b) => a.bay - b.bay);
  const here = occupants.filter((o) => o.shelfId === shelf.id);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <SheetHeader className="shrink-0 gap-0.5 p-0 pr-8">
        <SheetDescription className="text-xs">
          {shelf.where}・{faceTitle(fixture, shelf.side)}
        </SheetDescription>
        <SheetTitle className="flex flex-wrap items-baseline gap-x-2 text-lg font-bold">
          <span className="text-primary">{shelf.label}</span>
          <span>{shelf.category}</span>
          <span className="text-sm font-normal text-muted-foreground">
            左から{shelf.bay}本目／{row.length}本
          </span>
        </SheetTitle>
      </SheetHeader>

      <BayFront
        shelf={shelf}
        items={items.filter((n) => n.location.shelfId === shelf.id)}
        occupants={here}
        picked={pickedBox}
        onPick={setPickedBox}
      />

      {/* 押した箱の情報（シートのいちばん下） */}
      <div className="-mx-4 shrink-0 border-t border-border bg-popover px-4 pt-2.5 pb-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        {pickedBox ? (
          <BoxInfo
            shelf={shelf}
            box={pickedBox}
            occupant={
              here.find((o) => o.tier === pickedBox.tier && o.column === pickedBox.column) ?? null
            }
            others={here}
            onPickBox={setPickedBox}
            onOpenProduct={onOpenProduct}
          />
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            {items.some((n) => n.location.shelfId === shelf.id) && "黄色の枠が読んだ商品の場所。"}
            箱を押すと情報が出ます。写真のない箱はイメージ図（実在の商品ではありません）
          </p>
        )}
      </div>
    </div>
  );
}

// 押した箱：デモ商品なら商品カードへ。イラストならイメージ図であることと、この棚のデモ商品
function BoxInfo({
  shelf,
  box,
  occupant,
  others,
  onPickBox,
  onOpenProduct,
}: {
  shelf: Shelf;
  box: Box;
  occupant: Occupant | null;
  others: Occupant[];
  onPickBox: (box: Box) => void;
  onOpenProduct: (id: string) => void;
}) {
  const section = sectionAt(shelf, box.tier);
  const place = `${shelf.label}・上から${box.tier}段目・左から${box.column}列目`;
  if (occupant)
    return (
      <div className="flex items-center gap-3">
        <ProductImage
          id={occupant.productId}
          kind={occupant.kind}
          name={occupant.name}
          size={56}
          className="size-14 shrink-0 rounded-md bg-muted p-0.5"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{occupant.name}</p>
          <p className="text-xs text-muted-foreground">
            {section.name}・{place}
          </p>
        </div>
        <Button onClick={() => onOpenProduct(occupant.productId)} className="h-11 shrink-0">
          商品を見る
        </Button>
      </div>
    );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- 小さな静的 SVG */}
        <img
          src={illustrationAt(shelf, box.tier, box.column)}
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-md bg-muted p-0.5"
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold">{section.name}のイメージ図</p>
          <p className="text-xs text-muted-foreground">
            実在の商品ではありません（デモに入っていない商品の場所）。{place}
          </p>
        </div>
      </div>
      {others.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">この棚のデモ商品（押すと場所を示します）</p>
          <div className="flex flex-wrap gap-1.5">
            {others.map((o) => (
              <button
                key={o.productId}
                type="button"
                onClick={() => onPickBox({ tier: o.tier, column: o.column })}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm active:bg-accent"
              >
                {o.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const PATTERNS: PackagePattern[] = ["box", "box2", "slim", "square", "carton", "pouch"];

// 同じ棚・段・列なら毎回同じイラストになるよう、位置から決める
function illustrationAt(shelf: Shelf, tier: number, column: number) {
  let h = 0;
  for (const ch of `${shelf.id}:${tier}:${column}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pattern = PATTERNS[h % PATTERNS.length];
  const variant = ((Math.floor(h / 7) % 5) + 1) as IllustrationVariant;
  return illustrationSrc(sectionAt(shelf, tier).kind, pattern, variant);
}

function BayFront({
  shelf,
  items,
  occupants,
  picked,
  onPick,
}: {
  shelf: Shelf;
  items: Numbered[];
  occupants: Occupant[];
  picked: Box | null;
  onPick: (box: Box) => void;
}) {
  // 読んだ商品がある棚では、ほかの箱を薄くして場所を目立たせる
  const dim = items.length > 0;
  const split = shelf.sections.length > 1;
  // 売場の境目（各売場の最初の段）
  const firsts = new Map<number, string>();
  let top = 1;
  for (const s of shelf.sections) {
    firsts.set(top, `${s.name}（${s.tiers}段）`);
    top += s.tiers;
  }
  // 段は残りの高さを等分する（箱は高さに合わせて縮む）
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border-2 border-neutral-400 bg-neutral-100">
        {/* 売場の看板 */}
        <div className="flex shrink-0 items-center justify-between bg-primary px-3 py-1.5 text-primary-foreground">
          <span className="text-sm font-bold">{shelf.category}</span>
          <span className="text-xs">{shelf.id}</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-1 pt-1">
          {Array.from({ length: shelf.tiers }, (_, t) => {
            const tier = t + 1;
            const head = split ? firsts.get(tier) : undefined;
            return (
              <div key={tier} className="flex min-h-0 flex-1 flex-col">
                {head && (
                  <span className="mt-0.5 ml-9 shrink-0 self-start rounded-sm bg-primary/10 px-1.5 text-[11px] font-bold text-primary">
                    ▼ {head}
                  </span>
                )}
                <div className="flex min-h-0 flex-1 items-stretch gap-1">
                  <span className="flex w-8 shrink-0 items-center justify-center text-center text-[10px] leading-tight text-muted-foreground">
                    {tierLabel(tier, shelf.tiers)}
                  </span>
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div
                      className="grid min-h-0 flex-1 gap-0.5 pt-0.5"
                      style={{
                        gridTemplateColumns: `repeat(${shelf.columns}, minmax(0, 1fr))`,
                        gridTemplateRows: "minmax(0, 1fr)",
                      }}
                    >
                      {Array.from({ length: shelf.columns }, (_, c) => {
                        const column = c + 1;
                        const target = items.find(
                          (n) => n.location.tier === tier && n.location.column === column,
                        );
                        const other = occupants.find((o) => o.tier === tier && o.column === column);
                        const on = picked?.tier === tier && picked.column === column;
                        return (
                          <button
                            type="button"
                            key={column}
                            onClick={() => onPick({ tier, column })}
                            aria-pressed={on}
                            className={cn(
                              "relative flex min-h-0 items-end justify-center rounded-sm active:bg-accent",
                              target && "z-10 bg-diff-soft ring-3 ring-diff",
                              on && "z-20 bg-white ring-3 ring-primary",
                            )}
                            aria-label={`${
                              other?.name ?? `${sectionAt(shelf, tier).name}のイメージ図`
                            }：${tierLabel(tier, shelf.tiers)}・左から${column}列目`}
                          >
                            {other ? (
                              <ProductImage
                                id={other.productId}
                                kind={other.kind}
                                name={other.name}
                                size={48}
                                decorative
                                className={cn(
                                  "size-full object-contain",
                                  dim && !target && !on && "opacity-45",
                                )}
                              />
                            ) : (
                              // 写真のない列は、この売場の医薬品のイメージ図（実在の商品ではない）
                              // eslint-disable-next-line @next/next/no-img-element -- 小さな静的 SVG
                              <img
                                src={illustrationAt(shelf, tier, column)}
                                alt=""
                                width={48}
                                height={48}
                                className={cn(
                                  "size-full object-contain",
                                  dim && !on && "opacity-45",
                                )}
                              />
                            )}
                            {target && (
                              <span className="absolute -top-2 -right-1.5">
                                <Marker no={target.no} small />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* 棚板と値札 */}
                    <div className="mt-0.5 flex h-2.5 shrink-0 items-center justify-around rounded-[2px] border-b-2 border-neutral-400 bg-neutral-300">
                      {Array.from({ length: shelf.columns }, (_, c) => (
                        <span key={c} className="h-1.5 w-2.5 rounded-[1px] bg-white" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* 台輪（いちばん下の板） */}
        <div className="mt-1 h-3 shrink-0 bg-neutral-500" />
      </div>
    </div>
  );
}

function Marker({ no, small = false }: { no: number; small?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow",
        small ? "size-5 border border-white text-[11px]" : "size-7 text-sm",
      )}
    >
      {no}
    </span>
  );
}
