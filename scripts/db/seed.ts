// src/data の静的データを Supabase に入れる（T003、開発時のみ）。何度流しても同じ状態になる。
// いまはデモSKU（実商品、L-40）・通知（かぜ薬Ⅰの抜粋・解熱鎮痛薬・鼻炎用内服薬）・架空店舗の棚位置。
//
// 使い方：npm run db:seed（.env.local の SUPABASE_URL・SUPABASE_SERVICE_ROLE_KEY を使う）
import { createClient } from "@supabase/supabase-js";
import { DEMO_MEMOS } from "@/data/demo_memos";
import { DEMO_PRODUCTS } from "@/data/demo_products";
import { MOCK_STORE } from "@/data/mock_store";
import { SHELF_LOCATIONS } from "@/data/shelf_stock";
import { KAZE_GROUP } from "@/data/notice_kaze";
import { NO_NOTICE_GROUPS, NOTICE_GROUPS, NOTICE_ITEMS } from "@/data/notices";
import { noticeGroupToRow, noticeItemToRow, productToRows } from "@/lib/db/rows";
import { NOTICE_PDF, NOTICE_SOURCES, sourcePdf } from "../notice/lib";

// 販売終了でデモデータから外した品の id（新コッコアポA錠・スパークユンケル、L-20261103-35）。外すときはここに足す
const REMOVED_IDS = ["med-04160", "med-00708"];

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

  // 薬効群は T101 の構造化対象の6群（出典・頁）。項目はかぜ薬Ⅰの抜粋と解熱鎮痛薬・鼻炎用内服薬（L-20261103-28）
  // 取り込んだ薬効群（src/data/notices）はその出典・取得日、まだの群は構造化対象として置く
  const groups = NOTICE_SOURCES.map((source) =>
    noticeGroupToRow(
      NOTICE_GROUPS.find((g) => g.id === source.id) ?? {
        id: source.id,
        name: source.name,
        sourceUrl: sourcePdf(source).url,
        sourcePage: source.pages[0],
        fetchedOn: KAZE_GROUP.fetchedOn,
      },
    ),
  );
  // デモSKUの薬効群のうち通知の構造化対象外のもの（例：催眠鎮静薬）。項目は持たず、外部キーのためだけに置く
  const known = new Set(groups.map((g) => g.id));
  const extraGroups = [...new Set(DEMO_PRODUCTS.map((p) => p.noticeGroupId))]
    .filter((id) => !known.has(id))
    .map((id) =>
      noticeGroupToRow({
        id,
        name: `${NO_NOTICE_GROUPS[id] ?? id}（通知に項なし）`,
        sourceUrl: NOTICE_PDF.url,
        sourcePage: null,
        fetchedOn: KAZE_GROUP.fetchedOn,
      }),
    );
  check("notice_groups", await db.from("notice_groups").upsert([...groups, ...extraGroups]));
  check(
    "notice_items",
    await db.from("notice_items").upsert(NOTICE_ITEMS.map((item, i) => noticeItemToRow(item, i))),
  );

  // T003 で入れた架空のデモ品（demo-a〜h）を消す。成分・棚位置は外部キーの cascade で消える
  check("products（架空品の削除）", await db.from("products").delete().like("id", "demo-%"));

  // 販売終了でデモデータから外した品（L-20261103-35）を消す。成分・棚位置は外部キーの cascade で消える
  check("products（外した品の削除）", await db.from("products").delete().in("id", REMOVED_IDS));

  const rows = DEMO_PRODUCTS.map(productToRows);
  check("products", await db.from("products").upsert(rows.map((r) => r.product)));
  // 成分は id を持たないので、商品ごとに入れ直す
  const ids = DEMO_PRODUCTS.map((p) => p.id);
  check("product_facts（削除）", await db.from("product_facts").delete().in("product_id", ids));
  check("product_facts", await db.from("product_facts").insert(rows.flatMap((r) => r.facts)));

  // JAN が確かめられず demoSkus.json から外した商品の棚位置は入れない
  const locations = SHELF_LOCATIONS.filter((l) => ids.includes(l.productId));
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

  // デモの説明メモ（T403）。id 固定なので何度流しても同じ。本文は src/data/demo_memos.test.ts で禁止語・連絡先の形を検査済み
  check(
    "memos",
    await db.from("memos").upsert(
      DEMO_MEMOS.map((m) => ({
        id: m.id,
        product_id: m.productId ?? null,
        ingredient: m.ingredient ?? null,
        body: m.body,
        author_alias: m.authorAlias,
      })),
    ),
  );

  console.log(
    `seed 完了：薬効群 ${groups.length + extraGroups.length}、通知項目 ${NOTICE_ITEMS.length}、商品 ${DEMO_PRODUCTS.length}、成分 ${rows.flatMap((r) => r.facts).length}、棚位置 ${locations.length}、説明メモ ${DEMO_MEMOS.length}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
