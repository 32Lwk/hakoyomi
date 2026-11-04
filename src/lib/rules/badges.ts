import { ABUSE_NOTICE_GROUP, ABUSE_NOTICE_ITEM, ABUSE_SOURCE } from "@/data/abuse_ingredients";
import { halalFacts } from "@/data/additives";
import { DOPING_SOURCE } from "@/data/doping_list";
import { checkAbuse } from "@/lib/rules/abuse";
import { checkDoping, dopingListCurrent } from "@/lib/rules/doping";
import { normalizeName } from "@/lib/rules/normalize";
import type { CorrectionSource } from "@/data/label_corrections";
import { correctionsFor } from "@/lib/rules/labelCorrections";
import { applicableItems, convertedMg } from "@/lib/rules/noticeRules";
import type { BadgeKind, NoticeGroup, NoticeItem, ProductBadgeKind } from "@/lib/schema/notice";
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
      sourceGroup?: NoticeGroup;
    }
  // 添付文書による補正（L-20261103-28）。通知の記載条件の外で、添付文書に同じ趣旨の記載がある
  | {
      kind: "label";
      section: NoticeItem["section"];
      body: string;
      matched: string[];
      sources: CorrectionSource[];
      checkedOn: string;
      // 通知に項目がない種類で、添付文書だけから出した（L-20261103-36）
      labelOnly: boolean;
    }
  | { kind: "fact"; ingredient: string; amountMg: number; per: "1回" | "1日" }
  | {
      kind: "abuse_quantity";
      days: number;
      limitDays: number;
      large: boolean;
      contentQty: number;
      contentUnit: string;
      dailyMaxUnits: number;
      source: string;
    }
  | {
      kind: "list";
      list: "abuse" | "doping" | "halal";
      ingredient: string;
      listed: string;
      source: string;
    };

export type { ProductBadgeKind } from "@/lib/schema/notice";

export type Badge = {
  kind: ProductBadgeKind;
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
  // 年齢は「何歳から」で書く（L-20261103-12）。「15歳未満の小児は服用しないこと」→「15歳から」
  under15: {
    してはいけないこと: "年齢 15歳から",
    相談すること: "年齢 15歳未満は相談",
    その他: "年齢 15歳未満の記載",
  },
  under12: {
    してはいけないこと: "年齢 12歳から",
    相談すること: "年齢 12歳未満は相談",
    その他: "年齢 12歳未満の記載",
  },
  alcohol: { してはいけないこと: "飲酒しない", 相談すること: "飲酒", その他: "飲酒" },
};

// 厚労省通知「使用上の注意」から出す種類。薬効群の通知を取り込んでいない商品では、出ないことが「該当なし」を意味しない
export const NOTICE_BADGE_KINDS: readonly BadgeKind[] = [
  "drive",
  "breastfeeding",
  "under15",
  "under12",
  "alcohol",
];

// 「未収録」と出す通知由来の種類。通知を取り込んでいない薬効群は全部、取り込み済みでも補正で表せない種類（L-20261103-28）
// 添加物を調べられなかった商品は、ハラール関連も「該当なし」ではなく「未収録」（L-20261104-18）
export function unrecordedKinds(product: Product, noticeLoaded: boolean): ProductBadgeKind[] {
  const halal: ProductBadgeKind[] = halalFacts(product).checked ? [] : ["halal"];
  if (!noticeLoaded && !labelChecked(product)) return [...NOTICE_BADGE_KINDS, ...halal];
  return [
    ...correctionsFor(product).flatMap(({ correction }) =>
      correction.action === "unrecorded" ? correction.kinds : [],
    ),
    ...halal,
  ];
}

// 通知に項目がない種類で、添付文書を確かめた商品（L-20261103-36）
function labelChecked(product: Product): boolean {
  return correctionsFor(product).some(({ correction }) => correction.action === "labelChecked");
}

// 並び順（制度 → 通知の注意 → 成分）。量や優劣の順ではない
const ORDER: ProductBadgeKind[] = [
  "abuse",
  "drive",
  "breastfeeding",
  "under15",
  "under12",
  "alcohol",
  "caffeine",
  "doping",
  "halal",
];

export function deriveBadges(product: Product, items: NoticeItem[]): Badge[] {
  const badges: Badge[] = [];

  const abuse = checkAbuse(product);
  if (abuse.target && product.dailyMaxUnits !== null) {
    badges.push({
      kind: "abuse",
      tone: "system",
      label: abuse.large ? "濫用防止 対象・大容量" : "濫用防止 対象",
      evidence: [
        ...abuse.hits.map((h) => ({
          kind: "list" as const,
          list: "abuse" as const,
          ingredient: h.ingredient,
          listed: h.listed,
          source: ABUSE_SOURCE.ingredients,
        })),
        {
          kind: "abuse_quantity",
          days: Math.round(abuse.days * 10) / 10,
          limitDays: abuse.limitDays,
          large: abuse.large,
          contentQty: product.contentQty,
          contentUnit: product.contentUnit,
          dailyMaxUnits: product.dailyMaxUnits,
          source: ABUSE_SOURCE.quantity,
        },
        {
          kind: "notice",
          groupId: ABUSE_NOTICE_GROUP.id,
          section: ABUSE_NOTICE_ITEM.section,
          itemNo: ABUSE_NOTICE_ITEM.itemNo,
          body: ABUSE_NOTICE_ITEM.body,
          conditionText: ABUSE_NOTICE_ITEM.conditionText,
          matched: abuse.hits.map((h) => h.ingredient),
          sourceGroup: ABUSE_NOTICE_GROUP,
        },
      ],
    });
  }

  // 同じ種類のバッジは1つにまとめ、根拠を並べる。「してはいけないこと」があればその表記を使う
  const byKind = new Map<BadgeKind, Badge>();
  const put = (
    kind: BadgeKind,
    section: NoticeItem["section"],
    body: string,
    evidence: Evidence,
  ) => {
    const label = NOTICE_LABELS[kind]?.[section] ?? body;
    const existing = byKind.get(kind);
    if (!existing) {
      byKind.set(kind, { kind, tone: "notice", label, evidence: [evidence] });
    } else {
      existing.evidence.push(evidence);
      if (section === "してはいけないこと") existing.label = label;
    }
  };

  // 添付文書による補正は、薬効群の通知を取り込んだ商品だけに当てる（取り込む前は全部「未収録」）
  const loaded = items.some((i) => i.groupId === product.noticeGroupId);
  const corrections = loaded || labelChecked(product) ? correctionsFor(product) : [];
  const removed = new Set(
    corrections.flatMap(({ correction: c }) => (c.action === "remove" ? c.itemIds : [])),
  );
  for (const { item, matched } of applicableItems(product, items)) {
    if (!item.badge || item.badge === "abuse" || item.badge === "caffeine") continue;
    if (removed.has(item.id)) continue;
    put(item.badge, item.section, item.body, {
      kind: "notice",
      groupId: item.groupId,
      section: item.section,
      itemNo: item.itemNo,
      body: item.body,
      conditionText: item.conditionText,
      matched,
    });
  }
  for (const { correction: c, matched } of corrections) {
    if (c.action !== "add") continue;
    put(c.badge, c.section, c.body, {
      kind: "label",
      section: c.section,
      body: c.body,
      matched,
      sources: c.sources,
      checkedOn: c.checkedOn,
      labelOnly: !loaded,
    });
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

  // ドーピング：2026年版の禁止表と照合し、この商品の使い方（経路）で禁止に当たるものだけをバッジにする（L-20261104-18）。
  // 点鼻・点眼・皮膚で対象外の成分はバッジにせず、質問の答えで「対象外と禁止表にある」と伝える
  const doping = checkDoping(product).filter((d) => d.status !== "local");
  if (doping.length) {
    const year = dopingListCurrent() ? `${DOPING_SOURCE.year}年版` : "年版確認中";
    const timings = [
      ...new Set(doping.filter((d) => d.status === "prohibited").map((d) => d.entry.timing)),
    ];
    badges.push({
      kind: "doping",
      tone: "ingredient",
      label: doping.every((d) => d.status === "unclear")
        ? "ドーピング：使い方で異なる"
        : `ドーピング禁止成分（${timings.includes("常時") ? "常時" : "競技会時"}）`,
      evidence: doping.map((d) => ({
        kind: "list",
        list: "doping",
        ingredient: d.ingredient,
        listed: `${d.entry.name}（${d.entry.category}・${d.entry.timing}${d.status === "unclear" ? "・使い方で異なる" : ""}）${d.entry.condition ? `。${d.entry.condition}` : ""}`,
        source: `${DOPING_SOURCE.list}（${year}）`,
      })),
    });
  }

  // ハラール関連の成分：添加物・成分にアルコール（エタノール）、またはゼラチンなど動物・昆虫由来の可能性がある成分。
  // 事実だけを出し、ハラールかどうか・認証の有無は判断しない（メーカーに確認）
  const halal = halalFacts(product);
  if (halal.ethanol.length || halal.animal.length) {
    badges.push({
      kind: "halal",
      tone: "ingredient",
      label: [halal.ethanol.length && "アルコール", halal.animal.length && "ゼラチン等"]
        .filter(Boolean)
        .join("・")
        .concat("を含む"),
      evidence: [
        ...halal.ethanol.map((ingredient) => ({
          kind: "list" as const,
          list: "halal" as const,
          ingredient,
          listed: "アルコール（エタノール）",
          source: "成分・添加物（KEGG MEDICUS ほか）",
        })),
        ...halal.animal.map((ingredient) => ({
          kind: "list" as const,
          list: "halal" as const,
          ingredient,
          listed: "動物・昆虫由来の可能性がある成分（由来は出典に記載なし）",
          source: "添加物（KEGG MEDICUS ほか）",
        })),
      ],
    });
  }

  return badges.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
}
