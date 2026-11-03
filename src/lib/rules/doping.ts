import {
  DOPING_ENTRIES,
  DOPING_MONITORING,
  DOPING_SOURCE,
  type DopingEntry,
} from "@/data/doping_list";
import { normalizeName } from "@/lib/rules/normalize";
import type { Product } from "@/lib/schema/product";

// 商品の使い方（経路）。禁止表は経路で禁止かどうかが変わる成分がある（L-20261104-18）。
// 商品の種類と品名・薬効群からコードで決める。肛門の周りにも中にも使う痔の薬は「unclear」（Global DRO で確認）
export type UseRoute = "oral" | "oromucosal" | "rectal" | "skin" | "nasal" | "eye" | "unclear";

export function routeOf(product: Product): UseRoute {
  if (product.route === "internal") return "oral";
  if (product.kind === "eye") return "eye";
  if (product.kind === "nasal") return "nasal";
  if (/坐剤|坐薬/.test(product.name)) return "rectal";
  if (/口内炎|トラフル|のど|口腔|トローチ/.test(product.name)) return "oromucosal";
  if (product.noticeGroupId === "gaiyo_jishitsu") return "unclear";
  return "skin";
}

// prohibited：この使い方で禁止表の禁止に当たる／local：禁止表の成分だが、この使い方は禁止の対象外と禁止表にある／
// unclear：使い方で変わり、商品からは決められない
export type DopingStatus = "prohibited" | "local" | "unclear";

export type DopingHit = { ingredient: string; entry: DopingEntry; status: DopingStatus };

const LOCAL: UseRoute[] = ["skin", "nasal", "eye"];

function statusOf(entry: DopingEntry, route: UseRoute): DopingStatus {
  if (entry.route === "any") return "prohibited";
  if (route === "unclear") return "unclear";
  if (entry.route === "systemic") return LOCAL.includes(route) ? "local" : "prohibited";
  // notLocal（イミダゾリン）：皮膚・鼻・目・耳だけが除外
  return LOCAL.includes(route) ? "local" : "prohibited";
}

// 禁止表に載る成分を含むかの照合だけを行う。使ってよいかは判定しない（rules §4.5-3）
export function checkDoping(product: Product): DopingHit[] {
  const route = routeOf(product);
  const hits: DopingHit[] = [];
  for (const fact of product.facts) {
    const name = normalizeName(fact.ingredient);
    const entries = DOPING_ENTRIES.filter((e) => name.includes(normalizeName(e.name)));
    if (!entries.length) continue;
    const entry = entries.reduce((a, b) => (b.name.length > a.name.length ? b : a));
    hits.push({ ingredient: fact.ingredient, entry, status: statusOf(entry, route) });
  }
  return hits;
}

// 監視プログラムの成分（禁止ではない）
export function dopingMonitoring(product: Product): string[] {
  return product.facts
    .map((f) => f.ingredient)
    .filter((n) => DOPING_MONITORING.some((m) => normalizeName(n).includes(normalizeName(m))));
}

// 年版がまだ有効か。2027-01-01 を過ぎたら「年版確認中」に戻す
export function dopingListCurrent(today = new Date()): boolean {
  return DOPING_SOURCE.verified && today.toISOString().slice(0, 10) <= DOPING_SOURCE.validUntil;
}
