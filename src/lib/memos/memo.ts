import { z } from "zod";
import { findBanwords } from "@/lib/guard/banwords";

// 店内の説明メモ（T403、L-20261104-15）。画面とサーバーの両方で使う型・入力の検査。
// メモは公的な出典ではないので、質問の回答・根拠には使わない（回答の下に別枠で添えるだけ）。

// 書いた人は役割名だけ。自由入力の氏名は持たない
export const AUTHOR_ALIASES = ["ベテラン（模擬）", "新人（模擬）", "店長（模擬）"] as const;
export type AuthorAlias = (typeof AUTHOR_ALIASES)[number];

export const MEMO_MAX_LENGTH = 200;

export type MemoTarget =
  { kind: "product"; productId: string } | { kind: "ingredient"; ingredient: string };

export type Memo = {
  id: string;
  target: MemoTarget;
  body: string;
  authorAlias: string;
  createdAt: string;
};

// productId は書いた商品。ingredient があればその成分に付け（その成分を含む全商品に出る）、なければ商品に付ける
export const MemoInput = z.object({
  body: z.string().trim().min(1).max(MEMO_MAX_LENGTH),
  authorAlias: z.enum(AUTHOR_ALIASES),
  productId: z.string().min(1).max(64),
  ingredient: z.string().trim().min(1).max(80).optional(),
});
export type MemoInput = z.infer<typeof MemoInput>;

export type MemoRow = {
  id: string;
  product_id: string | null;
  ingredient: string | null;
  group_id: string | null;
  body: string;
  author_alias: string;
  created_at: string;
};

export function memoFromRow(row: MemoRow): Memo | null {
  const target: MemoTarget | null = row.product_id
    ? { kind: "product", productId: row.product_id }
    : row.ingredient
      ? { kind: "ingredient", ingredient: row.ingredient }
      : null; // 薬効群のメモはいまは扱わない
  return target
    ? {
        id: row.id,
        target,
        body: row.body,
        authorAlias: row.author_alias,
        createdAt: row.created_at,
      }
    : null;
}

// 止めた理由。画面にそのまま出す
export const BLOCK_REASONS = {
  banword: "推奨・効果の言い切りや、販売・服用の可否を言う語が入っています",
  recommendation: "商品を勧める・比べて優劣をつける書き方になっています",
  efficacy: "効果を言い切る書き方になっています",
  individual: "特定の人が使えるか・受診が要るかを判断する書き方になっています",
  customer: "お客様の情報（症状・氏名・連絡先など）が入っています",
  offTopic: "商品の説明の仕方と関係のない内容です",
  unavailable: "自己検査ができなかったため保存しませんでした。時間をおいてもう一度お試しください",
} as const;
export type BlockReason = keyof typeof BLOCK_REASONS;

// 連絡先・個人の名前の形。メモは役割名で書くので、名前に敬称がつく形は止める
const CONTACT_PATTERNS: readonly RegExp[] = [
  /[0０][0-9０-９]{1,4}[-ー－‐(（)）\s]?[0-9０-９]{1,4}[-ー－‐)）\s]?[0-9０-９]{3,4}/, // 電話番号
  /[\w.+-]+@[\w-]+\.[\w.-]+/, // メールアドレス
  /〒|[0-9０-９]{3}[-ー－][0-9０-９]{4}/, // 郵便番号
];
const GENERIC_HONORIFIC =
  /(お客|皆|患者|お子|ご家族|ご本人|店長|先輩|薬剤師|登録販売者)(さん|様|さま)/g;
const NAMED_HONORIFIC = /[一-龠々ァ-ヶー]{1,6}(さん|様|さま|氏|くん|ちゃん)/;

// コードで分かる範囲の検査（禁止語 regex ＋ 連絡先・敬称つきの名前）。Claude の自己検査の前に必ず通す
export function localMemoCheck(body: string): BlockReason[] {
  const reasons: BlockReason[] = [];
  if (findBanwords(body).length) reasons.push("banword");
  const rest = body.replace(GENERIC_HONORIFIC, "　");
  if (CONTACT_PATTERNS.some((p) => p.test(body)) || NAMED_HONORIFIC.test(rest))
    reasons.push("customer");
  return reasons;
}

// 成分のメモはその成分を含む商品すべてに出す
export function memosForProduct(
  memos: Memo[],
  product: { id: string; ingredients: string[] },
): Memo[] {
  const ingredients = new Set(product.ingredients);
  return memos.filter((m) =>
    m.target.kind === "product"
      ? m.target.productId === product.id
      : ingredients.has(m.target.ingredient),
  );
}
