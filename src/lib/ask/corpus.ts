import "server-only";
import { ABUSE_INGREDIENTS, ABUSE_SOURCE } from "@/data/abuse_ingredients";
import { DOPING_ENTRIES, DOPING_SOURCE } from "@/data/doping_list";
import { EFFICACY_STANDARDS } from "@/data/efficacy_standards";
import { INGREDIENT_ROLES, TEBIKI_SOURCE, type IngredientRole } from "@/data/ingredient_roles";
import { noticeCatalog, type ProductView } from "@/lib/catalog";
import { amountText } from "@/lib/compare";
import { dailyMaxLabel, timesPerDayLabel } from "@/lib/dosage";
import { ingredientRole } from "@/lib/ingredientRole";
import { applicableItems } from "@/lib/rules/noticeRules";
import type { BadgeKind, NoticeGroup, NoticeItem } from "@/lib/schema/notice";

// 質問エージェント（L-20261103-43）の根拠。コードが集め、Claude は番号を選んで原文を抜き出すだけ。
// text は原文（通知・手引き・承認基準）か、この商品の入力値をコードで整えた文
export type Passage = {
  id: string;
  text: string;
  source: { label: string; url: string | null };
  // 商品について集めた根拠ならその商品。全体から集めたものは null
  productId: string | null;
  // 語の一致で探すときに使う（Claude が使えないとき）
  kinds: BadgeKind[];
  ingredients: string[];
};

type Draft = Omit<Passage, "id" | "productId">;

function noticePassage(item: NoticeItem, group: NoticeGroup | undefined): Draft {
  return {
    text: item.body,
    source: {
      label: `厚労省通知「使用上の注意」${group?.name ?? item.groupId} ${item.section} ${item.itemNo}`,
      url: group?.sourceUrl ?? null,
    },
    kinds: item.badge ? [item.badge] : [],
    ingredients: [],
  };
}

function rolePassage(role: IngredientRole, ingredients: string[]): Draft {
  return {
    text: role.quote,
    source: {
      label: `厚労省「${TEBIKI_SOURCE.title}」第3章 ${role.section}（${role.page}頁）`,
      url: TEBIKI_SOURCE.pageUrl,
    },
    kinds: [],
    ingredients,
  };
}

// 選んだ商品ごとの根拠。番号は「p{列の番号}-{連番}」
export async function productPassages(views: ProductView[]): Promise<Passage[]> {
  const { groups, items } = await noticeCatalog();
  return views.flatMap((view, col) => {
    const { product } = view;
    const own: Draft[] = [];
    const facts = "この商品の成分・分量（入力値）";
    own.push({
      text: `${product.name}（${product.maker}）：${product.riskClass}・1日最大 ${dailyMaxLabel(product)}（${timesPerDayLabel(product)}）・内容量 ${product.contentQty}${product.contentUnit}`,
      source: { label: "この商品の基本情報（入力値）", url: null },
      kinds: [],
      ingredients: [],
    });
    for (const f of product.facts) {
      own.push({
        text: `${f.ingredient}：1日最大量あたり ${f.uncertain ? "（添付文書で確認）" : amountText(f.amountPerDay, f.unit)}`,
        source: { label: facts, url: null },
        kinds: [],
        ingredients: [f.ingredient],
      });
      const role = ingredientRole(product.kind, f.ingredient);
      if (role) own.push(rolePassage(role, [f.ingredient]));
    }
    for (const { item } of applicableItems(product, items)) {
      own.push(
        noticePassage(
          item,
          groups.find((g) => g.id === item.groupId),
        ),
      );
    }
    for (const badge of view.badges) {
      for (const e of badge.evidence) {
        if (e.kind === "label") {
          own.push({
            text: e.body,
            source: {
              label: `添付文書による補正（${e.section}・確認 ${e.checkedOn}）`,
              url: e.sources[0]?.url ?? null,
            },
            kinds: [badge.kind],
            ingredients: e.matched,
          });
        } else if (e.kind === "fact") {
          own.push({
            text: `${e.ingredient}：無水カフェイン換算で${e.per} ${e.amountMg}mg`,
            source: { label: facts, url: null },
            kinds: [badge.kind],
            ingredients: [e.ingredient],
          });
        } else if (e.kind === "list") {
          own.push({
            text:
              e.list === "abuse"
                ? `${e.ingredient}：指定濫用防止医薬品の成分（${e.listed}）`
                : `${e.ingredient}：WADA禁止表（${e.listed}）${DOPING_SOURCE.verified ? "" : "・年版確認中"}`,
            source: {
              label: e.source,
              url: e.list === "abuse" ? ABUSE_SOURCE.url : DOPING_SOURCE.url,
            },
            kinds: [badge.kind],
            ingredients: [e.ingredient],
          });
        }
      }
    }
    for (const s of EFFICACY_STANDARDS.filter((s) =>
      s.noticeGroupIds.includes(product.noticeGroupId),
    )) {
      own.push({
        text: s.text,
        source: { label: `${s.notice}（承認基準の効能・効果：${s.name}）`, url: s.sourceUrl },
        kinds: [],
        ingredients: [],
      });
    }
    return own.map((d, i) => ({ ...d, id: `p${col + 1}-${i + 1}`, productId: product.id }));
  });
}

// 商品を選ばないときの根拠：取り込んだ通知の全項目・手引きの配合目的・承認基準・指定濫用防止・禁止表
export async function generalPassages(): Promise<Passage[]> {
  const { groups, items } = await noticeCatalog();
  const drafts: Draft[] = [
    ...items.map((item) =>
      noticePassage(
        item,
        groups.find((g) => g.id === item.groupId),
      ),
    ),
    ...INGREDIENT_ROLES.map((role) => rolePassage(role, role.members)),
    ...EFFICACY_STANDARDS.map((s) => ({
      text: s.text,
      source: { label: `${s.notice}（承認基準の効能・効果：${s.name}）`, url: s.sourceUrl },
      kinds: [],
      ingredients: [],
    })),
    {
      text: `指定濫用防止医薬品の成分：${ABUSE_INGREDIENTS.map((a) => a.name).join("、")}`,
      source: { label: ABUSE_SOURCE.ingredients, url: ABUSE_SOURCE.url },
      kinds: ["abuse"],
      ingredients: ABUSE_INGREDIENTS.map((a) => a.name),
    },
    ...DOPING_ENTRIES.map((d) => ({
      text: `${d.name}：${d.category}（${d.timing}）`,
      source: {
        label: `${DOPING_SOURCE.list}${DOPING_SOURCE.verified ? ` ${DOPING_SOURCE.year}年版` : "（年版確認中）"}`,
        url: DOPING_SOURCE.url,
      },
      kinds: ["doping" as const],
      ingredients: [d.name],
    })),
  ];
  return drafts.map((d, i) => ({ ...d, id: `g${i + 1}`, productId: null }));
}
