import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { findById } from "@/lib/catalog";
import {
  BLOCK_REASONS,
  localMemoCheck,
  memoFromRow,
  memosForProduct,
  type BlockReason,
  type Memo,
  type MemoInput,
  type MemoRow,
} from "@/lib/memos/memo";
import { reviewMemoWithClaude } from "@/lib/memos/review";

// 説明メモの読み書き（Supabase の memos 表、service role はサーバーだけ）。
// Supabase がなければ、読みは空・書きは not_configured を返す

function db(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export function memosConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export type ProductMemos = { productId: string; memos: Memo[] };

// 商品ごとのメモ（商品に付いたもの＋その商品の成分に付いたもの、新しい順）
export async function memosForProducts(productIds: string[]): Promise<ProductMemos[]> {
  const products = (await Promise.all(productIds.map(findById))).filter((p) => p !== null);
  const client = db();
  if (!client || !products.length) return products.map((p) => ({ productId: p.id, memos: [] }));
  const ingredients = [...new Set(products.flatMap((p) => p.facts.map((f) => f.ingredient)))];
  const [byProduct, byIngredient] = await Promise.all([
    client
      .from("memos")
      .select("*")
      .in(
        "product_id",
        products.map((p) => p.id),
      ),
    ingredients.length
      ? client.from("memos").select("*").in("ingredient", ingredients)
      : Promise.resolve({ data: [], error: null }),
  ]);
  for (const result of [byProduct, byIngredient])
    if (result.error) throw new Error(`memos の読み出しに失敗：${result.error.message}`);
  const all = [...(byProduct.data as MemoRow[]), ...(byIngredient.data as MemoRow[])]
    .map(memoFromRow)
    .filter((m) => m !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return products.map((p) => ({
    productId: p.id,
    memos: memosForProduct(all, { id: p.id, ingredients: p.facts.map((f) => f.ingredient) }),
  }));
}

export type CreateResult =
  | { ok: true; memo: Memo }
  | { ok: false; error: "blocked"; reasons: BlockReason[]; messages: string[] }
  | { ok: false; error: "not_configured" | "unknown_target" };

// 保存の前に guard（禁止語 regex ＋ 連絡先の形 → Claude 自己検査）を通す。止めた本文はログにも残さない
export async function createMemo(input: MemoInput): Promise<CreateResult> {
  const client = db();
  if (!client) return { ok: false, error: "not_configured" };

  // 付ける先が実在するか（成分は、その成分を含む商品から書く）
  const product = await findById(input.productId);
  if (!product) return { ok: false, error: "unknown_target" };
  if (input.ingredient && !product.facts.some((f) => f.ingredient === input.ingredient))
    return { ok: false, error: "unknown_target" };

  const local = localMemoCheck(input.body);
  const reasons = local.length ? local : await reviewMemoWithClaude(input.body);
  const blocked: BlockReason[] = reasons === null ? ["unavailable"] : reasons;
  if (blocked.length) {
    console.info("memo: 保存前の検査で差し止め", blocked.join(","));
    return {
      ok: false,
      error: "blocked",
      reasons: blocked,
      messages: blocked.map((r) => BLOCK_REASONS[r]),
    };
  }

  const { data, error } = await client
    .from("memos")
    .insert({
      product_id: input.ingredient ? null : product.id,
      ingredient: input.ingredient ?? null,
      body: input.body,
      author_alias: input.authorAlias,
    })
    .select()
    .single();
  if (error) throw new Error(`memos の保存に失敗：${error.message}`);
  const memo = memoFromRow(data as MemoRow);
  if (!memo) throw new Error("memos の保存結果が読めません");
  return { ok: true, memo };
}

export async function deleteMemo(id: string): Promise<"deleted" | "not_found" | "not_configured"> {
  const client = db();
  if (!client) return "not_configured";
  const { data, error } = await client.from("memos").delete().eq("id", id).select("id");
  if (error) throw new Error(`memos の削除に失敗：${error.message}`);
  return data.length ? "deleted" : "not_found";
}
