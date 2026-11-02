import { ingredientRole } from "@/lib/ingredientRole";
import type { Badge } from "@/lib/rules/badges";
import { normalizeName } from "@/lib/rules/normalize";
import type { BadgeKind } from "@/lib/schema/notice";
import type { Product } from "@/lib/schema/product";

// 2〜4品を、1日最大量あたりの分量にそろえて並べる。並べ替えはしない（量の順で優劣を示さない）

export type Cell = { kind: "value"; text: string; uncertain: boolean } | { kind: "none" }; // その商品には含まれない

export type CompareRow = {
  key: string;
  label: string;
  cells: Cell[];
  // 違う行だけ強調する。未検証の値がある行は差分に使わない
  diff: boolean;
  uncertain: boolean;
  // 成分行だけ：手引きの成分の分類（解熱鎮痛成分など）。記載がなければ null
  group?: string | null;
};

function amountText(amount: number | null, unit: string | null): string {
  if (amount === null || unit === null) return "不明";
  return `${Number.isInteger(amount) ? amount : amount.toFixed(1)}${unit}`;
}

function rowFromCells(key: string, label: string, cells: Cell[]): CompareRow {
  const uncertain = cells.some((c) => c.kind === "value" && c.uncertain);
  const texts = cells.map((c) => (c.kind === "value" ? c.text : "—"));
  const diff = !uncertain && new Set(texts).size > 1;
  return { key, label, cells, diff, uncertain };
}

export function compareRows(products: Product[]): CompareRow[] {
  // 成分は手引きの分類ごとにまとめる（同じ目的の成分どうしを見比べるため）。
  // 分類の並び・分類の中の並びは、読んだ順の商品で最初に出てきた順。分類のない成分は最後
  const order: { key: string; label: string; group: string | null }[] = [];
  for (const product of products) {
    for (const fact of product.facts) {
      const key = normalizeName(fact.ingredient);
      if (order.some((o) => o.key === key)) continue;
      const group = ingredientRole(product.kind, fact.ingredient)?.group ?? null;
      order.push({ key, label: fact.ingredient, group });
    }
  }
  const groups = [...new Set(order.map((o) => o.group))].sort(
    (a, b) => Number(a === null) - Number(b === null),
  );
  const grouped = groups.flatMap((g) => order.filter((o) => o.group === g));

  const ingredientRows = grouped.map(({ key, label, group }) => ({
    ...rowFromCells(
      key,
      label,
      products.map((p): Cell => {
        const fact = p.facts.find((f) => normalizeName(f.ingredient) === key);
        if (!fact) return { kind: "none" };
        return {
          kind: "value",
          text: amountText(fact.amountPerDay, fact.unit),
          uncertain: fact.uncertain,
        };
      }),
    ),
    group,
  }));

  const meta = [
    rowFromCells(
      "risk",
      "リスク区分",
      products.map((p) => ({ kind: "value", text: p.riskClass, uncertain: false })),
    ),
    rowFromCells(
      "basis",
      "1日最大量",
      products.map((p) => ({
        kind: "value",
        text: `${p.dailyMaxUnits}${p.contentUnit}（${p.timesPerDay}回）`,
        uncertain: false,
      })),
    ),
    rowFromCells(
      "content",
      "内容量",
      products.map((p) => ({
        kind: "value",
        text: `${p.contentQty}${p.contentUnit}`,
        uncertain: false,
      })),
    ),
  ];

  return [...meta, ...ingredientRows];
}

export type BadgeRowCompare = {
  kind: BadgeKind;
  labels: (string | null)[];
  diff: boolean;
};

// 比べるの行。12歳未満と15歳未満は同じ製剤に併記されないので、1行「年齢」にまとめる（L-20261103-12）
export function badgeRowKind(kind: BadgeKind): BadgeKind {
  return kind === "under12" ? "under15" : kind;
}

// バッジの種類ごとに、各商品のラベル（なければ null）を並べる
export function compareBadges(badgeLists: Badge[][]): BadgeRowCompare[] {
  const kinds: BadgeKind[] = [];
  for (const list of badgeLists) {
    for (const b of list) {
      const kind = badgeRowKind(b.kind);
      if (!kinds.includes(kind)) kinds.push(kind);
    }
  }
  return kinds.map((kind) => {
    const labels = badgeLists.map(
      (list) => list.find((b) => badgeRowKind(b.kind) === kind)?.label ?? null,
    );
    return { kind, labels, diff: new Set(labels).size > 1 };
  });
}
