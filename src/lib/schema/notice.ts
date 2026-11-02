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
