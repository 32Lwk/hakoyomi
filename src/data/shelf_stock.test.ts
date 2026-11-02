import { describe, expect, test } from "vitest";
import { DEMO_PRODUCTS } from "@/data/demo_products";
import { BAY_W, MOCK_STORE, sectionAt, type Shelf } from "@/data/mock_store";
import { brandOf, SHELF_LOCATIONS, targetOf, tierOrder } from "@/data/shelf_stock";

const products = new Map(DEMO_PRODUCTS.map((p) => [p.id, p]));
const shelfOf = (id: string) => MOCK_STORE.shelves.find((s) => s.id === id)!;

// 棚の正面の両端から、相談カウンター（情報提供の場所）までの近いほうではなく遠いほうの距離
function farFromCounter(shelf: Shelf): number {
  const f = MOCK_STORE.fixtures.find((x) => x.id === shelf.fixtureId)!;
  const c = MOCK_STORE.counter;
  const dist = (x: number, y: number) =>
    Math.hypot(x - Math.min(Math.max(x, c.x), c.x + c.w), y - Math.min(Math.max(y, c.y), c.y + c.h));
  const i = shelf.bay - 1;
  const x = shelf.side === "N" ? f.x + f.w - (i + 1) * BAY_W : f.x + i * BAY_W;
  const y = shelf.side === "N" ? f.y : f.y + f.h;
  return Math.max(dist(x, y), dist(x + BAY_W, y));
}

describe("棚割り（L-20261103-37・-38）", () => {
  test("デモ商品はすべて1か所ずつ、重ならずに置かれる", () => {
    expect(new Set(SHELF_LOCATIONS.map((l) => l.productId)).size).toBe(DEMO_PRODUCTS.length);
    const slots = SHELF_LOCATIONS.map((l) => `${l.shelfId}:${l.tier}:${l.column}`);
    expect(new Set(slots).size).toBe(slots.length);
  });

  test("商品の種類と段の売場の種類が合う", () => {
    for (const l of SHELF_LOCATIONS)
      expect(sectionAt(shelfOf(l.shelfId), l.tier).kind, l.productId).toBe(
        products.get(l.productId)!.kind,
      );
  });

  test("段は真ん中から埋め、次に上、次に下", () => {
    expect(tierOrder([1, 2, 3, 4, 5, 6])).toEqual([3, 4, 2, 1, 5, 6]);
    expect(tierOrder([4, 5, 6])).toEqual([5, 4, 6]);
    expect(tierOrder([1, 2])).toEqual([1, 2]);
    // 商品がある本の売場では、真ん中の段に必ず商品がある
    const used = new Set(SHELF_LOCATIONS.map((l) => `${l.shelfId}:${l.tier}`));
    for (const l of SHELF_LOCATIONS) {
      const shelf = shelfOf(l.shelfId);
      const section = sectionAt(shelf, l.tier);
      const tiers = Array.from({ length: shelf.tiers }, (_, i) => i + 1).filter(
        (t) => sectionAt(shelf, t) === section,
      );
      expect(used.has(`${shelf.id}:${tierOrder(tiers)[0]}`), `${shelf.id} ${section.name}`).toBe(true);
    }
  });

  test("同じ対象・同じブランドの品は1つの段に隣り合って並ぶ", () => {
    const groups = new Map<string, typeof SHELF_LOCATIONS>();
    for (const l of SHELF_LOCATIONS) {
      const name = products.get(l.productId)!.name;
      const key = `${sectionAt(shelfOf(l.shelfId), l.tier).name}:${targetOf(name)}:${brandOf(name)}`;
      groups.set(key, [...(groups.get(key) ?? []), l]);
    }
    for (const [key, list] of groups) {
      if (list.length > 8) continue;
      expect(new Set(list.map((l) => `${l.shelfId}:${l.tier}`)).size, key).toBe(1);
      const cols = list.map((l) => l.column).sort((x, y) => x - y);
      expect(cols.at(-1)! - cols[0] + 1, key).toBe(cols.length);
    }
  });

  test("指定第2類は相談カウンターから7m以内の棚に置く", () => {
    for (const l of SHELF_LOCATIONS) {
      if (products.get(l.productId)!.riskClass !== "指定第2類") continue;
      expect(farFromCounter(shelfOf(l.shelfId)), l.productId).toBeLessThanOrEqual(7);
    }
  });
});
