import { z } from "zod";

// 商品の事実データ（prd §5 の層①）。添付文書の本文は持たない。推薦・順位の欄は作らない（rules §4-1）。

export const RiskClass = z.enum(["要指導", "第1類", "指定第2類", "第2類", "第3類"]);

// 薬の種類。画面のイメージ図（public/illustrations/{kind}-*.svg、L-33）の選択に使う
export const MedicineKind = z.enum([
  "cold",
  "fever",
  "cough",
  "rhinitis",
  "nasal",
  "stomach",
  "eye",
  "topical",
  "vitamin",
  "sleep",
  "kampo",
  "motion",
]);
export type MedicineKind = z.infer<typeof MedicineKind>;

// 内服か外用か。指定濫用防止医薬品は外用剤を除く（告示第32号）
export const DosageRoute = z.enum(["internal", "external"]);

export const ProductFact = z.object({
  ingredient: z.string().min(1),
  // 「抗ヒスタミン剤」など、通知の記載条件が成分群で書かれているときに使う。ゆうが入力する
  ingredientClasses: z.array(z.string()).default([]),
  // 1日最大量あたりの分量。生薬は原生薬換算で入れる
  amountPerDay: z.number().nonnegative().nullable(),
  unit: z.enum(["mg", "g", "mL", "µg"]).nullable(),
  uncertain: z.boolean().default(false),
  // 以下は分量の調査結果（src/data/ingredient_amounts.json、L-20261104-13）で補ったときだけ入る
  // 「0.9mL以下」「原生薬として相当」など、出典の書き方の添え
  qualifier: z.enum(["以下", "相当"]).nullable().optional(),
  // 目薬・点鼻・外用の濃度（100mL中 30mg、0.03% など）。出典の基準のまま持ち、換算しない
  concentration: z
    .object({ amount: z.number().nonnegative(), unit: z.string().min(1), basis: z.string().min(1) })
    .nullable()
    .optional(),
  source: z
    .object({
      kind: z.string(),
      url: z.string().nullable(),
      checkedOn: z.string(),
      note: z.string().nullable(),
    })
    .nullable()
    .optional(),
});
export type ProductFact = z.infer<typeof ProductFact>;

export const Product = z
  .object({
    id: z.string().min(1),
    jan: z.string().regex(/^\d{8}$|^\d{13}$/),
    name: z.string().min(1),
    maker: z.string().min(1),
    riskClass: RiskClass,
    kind: MedicineKind,
    // 通知「使用上の注意」の薬効群 ID（notice.ts の NoticeGroupId）
    noticeGroupId: z.string().min(1),
    // 効能・効果に含まれる薬効群。指定濫用防止の数量基準（5日分／7日分）の判定に使う
    efficacyGroups: z.array(z.string()).default([]),
    route: DosageRoute,
    // 生薬を主たる有効成分とする製剤か（指定濫用防止の対象外の判定。ゆうが判定）
    crudeDrugMain: z.boolean().default(false),
    // 1日最大の服用単位数と回数（例：1回3錠×3回 → 9 と 3）。年齢で違う場合は最大の年齢の値。
    // 外用で上限がない品（「1日数回」「適量」）は null にし、添付文書の表記を …Text に入れる（L-20261103-25）
    dailyMaxUnits: z.number().positive().nullable(),
    timesPerDay: z.number().int().positive().nullable(),
    timesPerDayText: z.string().min(1).nullable().default(null),
    dailyMaxText: z.string().min(1).nullable().default(null),
    contentQty: z.number().positive(),
    contentUnit: z.string().min(1),
    facts: z.array(ProductFact).min(1),
    pmdaUrl: z.string().url().nullable(),
    docRevisedOn: z.string().nullable(),
    enteredBy: z.string().min(1),
    verifiedOn: z.string().nullable(),
  })
  .superRefine((p, ctx) => {
    // 数値を null にできるのは外用だけ。null のときは表記がいる（数値を推測で入れない）
    const pairs = [
      ["timesPerDay", p.timesPerDay, p.timesPerDayText],
      ["dailyMaxUnits", p.dailyMaxUnits, p.dailyMaxText],
    ] as const;
    for (const [key, value, text] of pairs) {
      if (value !== null) continue;
      if (p.route !== "external" || !text)
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "外用で用法の表記があるときだけ null にできる",
        });
    }
  });
export type Product = z.infer<typeof Product>;
