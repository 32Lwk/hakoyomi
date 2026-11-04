import { z } from "zod";
import {
  ABUSE_CHECK_CODES,
  ABUSE_CHECK_ITEMS,
  ABUSE_SOURCE,
  type AbuseCheckCode,
} from "@/data/abuse_ingredients";
import { guard } from "@/lib/guard/guard";
import { AUTHOR_ALIASES, localMemoCheck } from "@/lib/memos/memo";
import type { AbuseHit, AbuseOverlap } from "@/lib/rules/abuse";

// 指定濫用防止医薬品の確認・記録（T401、L-20261104-25）。
// お客様の氏名・症状などの個人情報は入力・保存せず、販売や服用の可否の判定も持たない。

export const RecordInput = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(10),
  checkedItems: z
    .array(z.enum(ABUSE_CHECK_CODES))
    .min(1)
    .max(ABUSE_CHECK_CODES.length)
    .transform((items) => [...new Set(items)]),
  staffAlias: z.enum(AUTHOR_ALIASES),
  otherProductIds: z.array(z.string().min(1).max(64)).max(3).default([]),
});
export type RecordInput = z.infer<typeof RecordInput>;

export type RecordDraftContext = {
  productName: string;
  quantity: number;
  days: number;
  limitDays: number;
  large: boolean;
  multiple: boolean;
  overlaps: AbuseOverlap[];
  hits: AbuseHit[];
  checkedItems: AbuseCheckCode[];
  staffAlias: string;
  timeLabel: string;
};

// 通知（医薬発1226第16号 第4-1(4)）の順に確認項目を並べる
export function orderCheckedItems(
  codes: AbuseCheckCode[],
): { code: AbuseCheckCode; label: string }[] {
  const set = new Set(codes);
  return ABUSE_CHECK_ITEMS.filter((item) => set.has(item.code)).map(({ code, label }) => ({
    code,
    label,
  }));
}

// コードで組み立てる定型の下書き文（Claude が使えないとき・ガードで差し止めたときのフォールバック）
export function formatRecordDraft(ctx: RecordDraftContext): string {
  const ordered = orderCheckedItems(ctx.checkedItems);
  const checkedText = ordered.map((i) => `${i.code}（${i.label}）`).join("・");
  const ingredients = ctx.hits.map((h) => `${h.listed}［${h.ingredient}］`).join("、");
  const roundedDays = Math.round(ctx.days * 10) / 10;
  const statusParts = [
    `${ctx.quantity}個`,
    `${roundedDays}日分（基準上限${ctx.limitDays}日分・${ctx.large ? "大容量製品" : "通常容量"}）`,
    ctx.multiple ? "複数個に該当" : "単数",
  ];
  const overlapLine =
    ctx.overlaps.length > 0
      ? `重複指定成分：${ctx.overlaps.map((o) => `${o.listed}（${o.productNames.join("／")}・計${o.count}個）`).join("、")}\n`
      : "";
  return [
    `【指定濫用防止医薬品 確認記録】${ctx.timeLabel}　担当：${ctx.staffAlias}`,
    `対象商品：${ctx.productName}（${statusParts.join("／")}）`,
    `対象成分：${ingredients}`,
    overlapLine ? overlapLine.trimEnd() : null,
    `確認済み項目（${ABUSE_SOURCE.sales} 第4-1(4)）：${checkedText}`,
    "※お客様の氏名・症状等の個人情報は記録していません。販売の判断は登録販売者が店頭で行いました。",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

// 生成された下書き文を禁止語ガードと個人情報パターン（電話番号・敬称つき氏名など）で検査する
export function verifyRecordDraft(
  draft: string,
): { ok: true; text: string } | { ok: false; reasons: string[] } {
  const trimmed = draft.trim();
  if (!trimmed) return { ok: false, reasons: ["empty"] };
  const g = guard(trimmed);
  const memoReasons = localMemoCheck(trimmed);
  const reasons: string[] = [];
  if (!g.ok) reasons.push(...g.hits);
  if (memoReasons.length) reasons.push(...memoReasons);
  return reasons.length ? { ok: false, reasons } : { ok: true, text: trimmed };
}
