// src/data の静的データを Supabase に入れる（T003、開発時のみ）。何度流しても同じ状態になる。
// いまはデモSKU（実商品、L-40）・通知かぜ薬Ⅰの抜粋・架空店舗の棚位置。T102（検証済みの通知）で入れ替える。
//
// 使い方：npm run db:seed（.env.local の SUPABASE_URL・SUPABASE_SERVICE_ROLE_KEY を使う）
import { createClient } from "@supabase/supabase-js";
import { DEMO_PRODUCTS } from "@/data/demo_products";
import { MOCK_STORE } from "@/data/mock_store";
import { KAZE_GROUP, KAZE_ITEMS } from "@/data/notice_kaze";
import { noticeGroupToRow, noticeItemToRow, productToRows } from "@/lib/db/rows";
import { NOTICE_PDF, NOTICE_SOURCES } from "../notice/lib";

const EXTRA_GROUP_NAMES: Record<string, string> = { suimin_kaizen: "催眠鎮静薬" };

async function main() {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // .env.local がなければ環境変数をそのまま使う
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL・SUPABASE_SERVICE_ROLE_KEY がありません");
  const db = createClient(url, key, { auth: { persistSession: false } });

  const check = <T extends { error: { message: string } | null }>(label: string, result: T) => {
    if (result.error) throw new Error(`${label}：${result.error.message}`);
    return result;
  };

  // 薬効群は T101 の構造化対象の6群（出典・頁）。項目の本文はまだかぜ薬Ⅰの抜粋だけ
  const groups = NOTICE_SOURCES.map((source) =>
    noticeGroupToRow({
      id: source.id,
      name: source.name,
      sourceUrl: NOTICE_PDF.url,
      sourcePage: source.pages[0],
      fetchedOn: KAZE_GROUP.fetchedOn,
    }),
  );
  // デモSKUの薬効群のうち通知の構造化対象外のもの（例：催眠鎮静薬）。項目は持たず、外部キーのためだけに置く
  const known = new Set(groups.map((g) => g.id));
  const extraGroups = [...new Set(DEMO_PRODUCTS.map((p) => p.noticeGroupId))]
    .filter((id) => !known.has(id))
    .map((id) =>
      noticeGroupToRow({
        id,
        name: `${EXTRA_GROUP_NAMES[id] ?? id}（通知の構造化対象外）`,
        sourceUrl: NOTICE_PDF.url,
        sourcePage: null,
        fetchedOn: KAZE_GROUP.fetchedOn,
      }),
    );
  check("notice_groups", await db.from("notice_groups").upsert([...groups, ...extraGroups]));
  check(
    "notice_items",
    await db.from("notice_items").upsert(KAZE_ITEMS.map((item, i) => noticeItemToRow(item, i))),
  );

  // T003 で入れた架空のデモ品（demo-a〜h）を消す。成分・棚位置は外部キーの cascade で消える
  check("products（架空品の削除）", await db.from("products").delete().like("id", "demo-%"));

  const rows = DEMO_PRODUCTS.map(productToRows);
  check("products", await db.from("products").upsert(rows.map((r) => r.product)));
  // 成分は id を持たないので、商品ごとに入れ直す
  const ids = DEMO_PRODUCTS.map((p) => p.id);
  check("product_facts（削除）", await db.from("product_facts").delete().in("product_id", ids));
  check("product_facts", await db.from("product_facts").insert(rows.flatMap((r) => r.facts)));

  // JAN が確かめられず demoSkus.json から外した商品の棚位置は入れない
  const locations = MOCK_STORE.locations.filter((l) => ids.includes(l.productId));
  check(
    "shelf_locations",
    await db.from("shelf_locations").upsert(
      locations.map((l) => ({
        product_id: l.productId,
        store_id: MOCK_STORE.id,
        shelf_id: l.shelfId,
        tier: l.tier,
        column: l.column,
      })),
      { onConflict: "store_id,product_id" },
    ),
  );

  console.log(
    `seed 完了：薬効群 ${groups.length + extraGroups.length}、通知項目 ${KAZE_ITEMS.length}、商品 ${DEMO_PRODUCTS.length}、成分 ${rows.flatMap((r) => r.facts).length}、棚位置 ${locations.length}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
