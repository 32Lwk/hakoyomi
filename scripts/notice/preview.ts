// 通知の下書き（T101 の data/notices/out/{group}.json）をデモ商品に当てたとき、画面に何が出るかを書き出す（L-20261103-26、開発時のみ）。
// ゆうが T102 で原文と照らすときの手がかり。下書きは未検証なので、画面・seed には入れない。
//
// 使い方：
//   npm run notice:preview                     # 解熱鎮痛薬・鼻炎用内服薬
//   npm run notice:preview -- chinga_kyotan    # 指定した薬効群だけ
import { readFileSync, writeFileSync } from "node:fs";
import { DEMO_PRODUCTS } from "@/data/demo_products";
import { deriveBadges, NOTICE_BADGE_KINDS } from "@/lib/rules/badges";
import { applicableItems } from "@/lib/rules/noticeRules";
import { NoticeItem } from "@/lib/schema/notice";

const OUT_DIR = "data/notices/out";
const DEFAULT_GROUPS = ["genetsu_chintsu", "bien_naifuku"];

type Draft = {
  group: { id: string; name: string };
  items: unknown[];
  issues: { id: string; problem: string }[];
};

function preview(groupId: string): string {
  const draft = JSON.parse(readFileSync(`${OUT_DIR}/${groupId}.json`, "utf8")) as Draft;
  const items = draft.items.map((item) => NoticeItem.parse(item));
  const byId = new Map(items.map((item) => [item.id, item]));
  const products = DEMO_PRODUCTS.filter((p) => p.noticeGroupId === groupId);
  const lines = [
    `# ${draft.group.name}（${groupId}）下書きの当てはめ`,
    "",
    `下書きは未検証（T102 前）。商品 ${products.length}品、項目 ${items.length}件、要確認 ${items.filter((i) => i.needsReview).length}件。`,
    "成分の分量が未確認（uncertain）の品は、量の条件が当たらないことがある。",
    "",
    "## バッジの出かた",
    "",
    `| 商品 | ${NOTICE_BADGE_KINDS.join(" | ")} |`,
    `|---|${NOTICE_BADGE_KINDS.map(() => "---").join("|")}|`,
  ];
  const detail: string[] = [];
  for (const product of products) {
    const badges = deriveBadges(product, items);
    const cells = NOTICE_BADGE_KINDS.map(
      (kind) => badges.find((b) => b.kind === kind)?.label ?? "",
    );
    lines.push(`| ${product.name} | ${cells.join(" | ")} |`);

    const applied = applicableItems(product, items);
    detail.push(`### ${product.name}`, "");
    for (const { item, matched } of applied) {
      const flags = [item.badge && `バッジ ${item.badge}`, item.needsReview && "要確認"].filter(
        Boolean,
      );
      const by = matched.length ? `（${matched.join("・")}）` : "";
      detail.push(
        `- ${item.section} ${item.itemNo}${by}${flags.length ? ` 【${flags.join("・")}】` : ""}：${item.body}`,
      );
    }
    detail.push("");
  }
  lines.push("", "## 商品ごとの当たる項目", "", ...detail, "## 下書きの指摘（T101）", "");
  for (const issue of draft.issues) {
    const item = byId.get(issue.id);
    lines.push(`- ${item ? `${item.section} ${item.itemNo}` : issue.id}：${issue.problem}`);
  }
  return `${lines.join("\n")}\n`;
}

const groups = process.argv.slice(2).filter((a) => !a.startsWith("-"));
for (const groupId of groups.length ? groups : DEFAULT_GROUPS) {
  const path = `${OUT_DIR}/${groupId}.preview.md`;
  writeFileSync(path, preview(groupId));
  console.log(`${path} を書き出しました`);
}
