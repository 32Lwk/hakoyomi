import type { Product } from "@/lib/schema/product";

// 1日の最大量・回数の表示。外用で上限がない品は数値を作らず、添付文書の表記（「適量」「1日数回」）をそのまま出す（L-20261103-25）

export function dailyMaxLabel(p: Product): string {
  return p.dailyMaxUnits === null ? (p.dailyMaxText ?? "") : `${p.dailyMaxUnits}${p.contentUnit}`;
}

export function timesPerDayLabel(p: Product): string {
  return p.timesPerDay === null ? (p.timesPerDayText ?? "") : `${p.timesPerDay}回`;
}
