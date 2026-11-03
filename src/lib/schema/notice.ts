import { z } from "zod";

// 厚労省通知「使用上の注意」の項目（prd §5 の層②）。本文は通知の文面のみ。

export const BadgeKind = z.enum([
  "abuse",
  "drive",
  "breastfeeding",
  "under15",
  "under12",
  "alcohol",
  "caffeine",
  "doping",
]);
export type BadgeKind = z.infer<typeof BadgeKind>;

// 商品の確認ポイントの種類。通知の項目に付く BadgeKind に、添加物から出す「ハラール関連の成分」を足したもの（L-20261104-18）。
// halal は通知の項目には付かないので、DB の notice_items.badge の値（BadgeKind）には入れない
export type ProductBadgeKind = BadgeKind | "halal";

// 記載条件「〔○○を含有する製剤に記載すること〕」を表す式
export type Condition =
  | { always: true }
  | { hasIngredient: string[] }
  | { hasClass: string[] }
  | {
      amountAtLeast: {
        ingredients: string[];
        // 換算先（例：無水カフェインとして）。省略時は換算しない
        as?: string;
        value: number;
        unit: "mg" | "g";
        per: "1回" | "1日";
      };
    }
  // 剤形（例：錠剤・丸剤）。src/data/product_usage の値で判定する（L-20261104-12）
  | { dosageForm: string[] }
  // この月齢未満の用法がある（例：生後３ヵ月未満 → 3、小児（15歳未満）→ 180）
  | { usageUnderMonths: number }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

export const Condition: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ always: z.literal(true) }),
    z.object({ hasIngredient: z.array(z.string()).min(1) }),
    z.object({ hasClass: z.array(z.string()).min(1) }),
    z.object({
      amountAtLeast: z.object({
        ingredients: z.array(z.string()).min(1),
        as: z.string().optional(),
        value: z.number().positive(),
        unit: z.enum(["mg", "g"]),
        per: z.enum(["1回", "1日"]),
      }),
    }),
    z.object({ dosageForm: z.array(z.string()).min(1) }),
    z.object({ usageUnderMonths: z.number().int().positive() }),
    z.object({ all: z.array(Condition).min(1) }),
    z.object({ any: z.array(Condition).min(1) }),
    z.object({ not: Condition }),
  ]),
);

export const NoticeSection = z.enum(["してはいけないこと", "相談すること", "その他"]);

export const NoticeItem = z.object({
  id: z.string().min(1),
  groupId: z.string().min(1),
  section: NoticeSection,
  itemNo: z.string().min(1),
  body: z.string().min(1),
  condition: Condition,
  // 記載条件の原文。根拠として画面に出す
  conditionText: z.string().nullable(),
  // 「ただし、○○を記載した製剤にあっては記載しない」の○○（項目 id）
  excludedBy: z.array(z.string()).default([]),
  badge: BadgeKind.optional(),
  // 条件式で表しきれない但し書きがあり、人の確認が要る
  needsReview: z.boolean().default(false),
});
export type NoticeItem = z.infer<typeof NoticeItem>;

export const NoticeGroup = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sourceUrl: z.string().url(),
  sourcePage: z.number().int().positive().nullable(),
  fetchedOn: z.string(),
});
export type NoticeGroup = z.infer<typeof NoticeGroup>;
