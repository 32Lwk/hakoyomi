import { connection } from "next/server";
import { Suspense } from "react";
import { SettingsView, type DataStatus } from "@/components/settings-view";
import { ABUSE_SOURCE } from "@/data/abuse_ingredients";
import { DOPING_SOURCE } from "@/data/doping_list";
import { EFFICACY_STANDARDS } from "@/data/efficacy_standards";
import { TEBIKI_SOURCE } from "@/data/ingredient_roles";
import { allProducts, noticeCatalog } from "@/lib/catalog";

// 設定：出典とデータの状態・このアプリについて・文字の大きさ・選んでいる商品を外す（L-20261103-43）
export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="pt-6 text-muted-foreground">…</p>}>
      <Settings />
    </Suspense>
  );
}

// データの状態はリクエストのたびに読む（Supabase の更新を反映するため）
async function Settings() {
  await connection();
  const [products, { groups, items }] = await Promise.all([allProducts(), noticeCatalog()]);
  const status: DataStatus = {
    products: products.length,
    unverified: products.filter((p) => !p.verifiedOn).length,
    notices: groups
      .filter((g) => items.some((i) => i.groupId === g.id))
      .map((g) => ({
        name: g.name,
        url: g.sourceUrl,
        fetchedOn: g.fetchedOn,
        items: items.filter((i) => i.groupId === g.id).length,
      })),
    sources: [
      {
        label: `厚労省「${TEBIKI_SOURCE.title}」第3章（配合目的）`,
        url: TEBIKI_SOURCE.pageUrl,
        state: TEBIKI_SOURCE.verifiedOn ? `照合 ${TEBIKI_SOURCE.verifiedOn}` : "手引きと照合待ち",
      },
      {
        label: `製造販売承認基準の効能・効果（${EFFICACY_STANDARDS.length}基準）`,
        url: EFFICACY_STANDARDS[0]?.sourceUrl ?? null,
        state: `取得 ${EFFICACY_STANDARDS[0]?.fetchedOn ?? "—"}`,
      },
      {
        label: `指定濫用防止医薬品：${ABUSE_SOURCE.ingredients}`,
        url: ABUSE_SOURCE.url,
        state: "",
      },
      {
        label: DOPING_SOURCE.list,
        url: DOPING_SOURCE.url,
        state: DOPING_SOURCE.verified ? `${DOPING_SOURCE.year}年版` : "年版確認中",
      },
    ],
  };
  return <SettingsView status={status} />;
}
