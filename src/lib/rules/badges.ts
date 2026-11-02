import { ABUSE_SOURCE } from "@/data/abuse_ingredients";
import { DOPING_SOURCE } from "@/data/doping_list";
import { checkAbuse } from "@/lib/rules/abuse";
import { checkDoping } from "@/lib/rules/doping";
import { normalizeName } from "@/lib/rules/normalize";
import { applicableItems, convertedMg } from "@/lib/rules/noticeRules";
import type { DemoSku } from "@/lib/schema/demoSku";
import type { BadgeKind, NoticeItem } from "@/lib/schema/notice";
import type { Product } from "@/lib/schema/product";

// バッジの種類ごとの見た目（design.md §3）。良し悪しの色は使わない
export type BadgeTone = "system" | "notice" | "ingredient";

export type Evidence =
  | {
      kind: "notice";
      groupId: string;
      section: NoticeItem["section"];
      itemNo: string;
      body: string;
      conditionText: string | null;
      matched: string[];
    }
  | { kind: "fact"; ingredient: string; amountMg: number; per: "1回" | "1日" }
  | { kind: "list"; list: "abuse" | "doping"; ingredient: string; listed: string; source: string };

export type Badge = {
  kind: BadgeKind;
  tone: BadgeTone;
  label: string;
  evidence: Evidence[];
};

const NOTICE_LABELS: Partial<Record<BadgeKind, Record<NoticeItem["section"], string>>> = {
  drive: { してはいけないこと: "運転注意", 相談すること: "運転注意", その他: "運転注意" },
  breastfeeding: {
    してはいけないこと: "授乳中は服用しない",
    相談すること: "授乳中は相談",
    その他: "授乳",
  },
  under15: {
    してはいけないこと: "15歳未満 服用しない",
    相談すること: "15歳未満 相談",
    その他: "15歳未満",
  },
  under12: {
    してはいけないこと: "12歳未満 服用しない",
    相談すること: "12歳未満 相談",
    その他: "12歳未満",
  },
  alcohol: { してはいけないこと: "飲酒しない", 相談すること: "飲酒", その他: "飲酒" },
};

// 並び順（制度 → 通知の注意 → 成分）。量や優劣の順ではない
const ORDER: BadgeKind[] = [
  "abuse",
  "drive",
  "breastfeeding",
  "under15",
  "under12",
  "alcohol",
  "caffeine",
  "doping",
];

export function deriveBadges(product: Product, items: NoticeItem[]): Badge[] {
  const badges: Badge[] = [];

  const abuse = checkAbuse(product);
  if (abuse.target) {
    badges.push({
      kind: "abuse",
      tone: "system",
      label: abuse.large ? "濫用防止 対象・大容量" : "濫用防止 対象",
      evidence: abuse.hits.map((h) => ({
        kind: "list",
        list: "abuse",
        ingredient: h.ingredient,
        listed: h.listed,
        source: ABUSE_SOURCE.ingredients,
      })),
    });
  }

  // 同じ種類のバッジは1つにまとめ、根拠を並べる。「してはいけないこと」があればその表記を使う
  const byKind = new Map<BadgeKind, Badge>();
  for (const { item, matched } of applicableItems(product, items)) {
    if (!item.badge || item.badge === "abuse" || item.badge === "caffeine") continue;
    const evidence: Evidence = {
      kind: "notice",
      groupId: item.groupId,
      section: item.section,
      itemNo: item.itemNo,
      body: item.body,
      conditionText: item.conditionText,
      matched,
    };
    const label = NOTICE_LABELS[item.badge]?.[item.section] ?? item.body;
    const existing = byKind.get(item.badge);
    if (!existing) {
      byKind.set(item.badge, { kind: item.badge, tone: "notice", label, evidence: [evidence] });
    } else {
      existing.evidence.push(evidence);
      if (item.section === "してはいけないこと") existing.label = label;
    }
  }
  badges.push(...byKind.values());

  const caffeine = product.facts.filter(
    (f) => !f.uncertain && normalizeName(f.ingredient).includes(normalizeName("カフェイン")),
  );
  const caffeineMg = convertedMg(product, caffeine, "無水カフェイン", "1回");
  if (caffeineMg !== null) {
    const rounded = Math.round(caffeineMg * 10) / 10;
    badges.push({
      kind: "caffeine",
      tone: "ingredient",
      label: `カフェイン 1回${rounded}mg`,
      evidence: [
        {
          kind: "fact",
          ingredient: caffeine.map((f) => f.ingredient).join("・"),
          amountMg: rounded,
          per: "1回",
        },
      ],
    });
  }

  const doping = checkDoping(product);
  if (doping.length) {
    badges.push({
      kind: "doping",
      tone: "ingredient",
      label: DOPING_SOURCE.verified ? "禁止表成分" : "禁止表成分（年版確認中）",
      evidence: doping.map((d) => ({
        kind: "list",
        list: "doping",
        ingredient: d.ingredient,
        listed: `${d.entry.name}（${d.entry.category}・${d.entry.timing}）`,
        source: DOPING_SOURCE.list,
      })),
    });
  }

  return badges.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
}

export const LEGACY_DOPING_SOURCE = "既存データ（Medicine Recommend System）の禁止表区分・年版不明";

// デモSKUは、成分照合ではなく既存データの「禁止物質あり」「競技会区分」を出す（L-40 ④）。
// 照合で当たった成分があれば根拠に添え、なければ商品全体の区分として出す
export function dopingBadgeFromSku(badges: Badge[], product: Product, sku: DemoSku): Badge[] {
  const rest = badges.filter((b) => b.kind !== "doping");
  if (!sku.flags.dopingRelated) return rest;
  const listed = sku.flags.dopingClass ?? "区分不明";
  const hits = checkDoping(product);
  const ingredients = hits.length ? hits.map((h) => h.ingredient) : ["（成分の特定なし）"];
  const badge: Badge = {
    kind: "doping",
    tone: "ingredient",
    label: "禁止表成分（年版確認中）",
    evidence: ingredients.map((ingredient) => ({
      kind: "list",
      list: "doping",
      ingredient,
      listed,
      source: LEGACY_DOPING_SOURCE,
    })),
  };
  return [...rest, badge].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
}
