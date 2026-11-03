import "server-only";
import { ABUSE_INGREDIENTS, ABUSE_SOURCE } from "@/data/abuse_ingredients";
import { additivesOf, halalFacts } from "@/data/additives";
import { DOPING_ENTRIES, DOPING_SOURCE } from "@/data/doping_list";
import { EFFICACY_STANDARDS } from "@/data/efficacy_standards";
import { NO_NOTICE_GROUPS } from "@/data/notices";
import { INGREDIENT_ROLES, TEBIKI_SOURCE, type IngredientRole } from "@/data/ingredient_roles";
import { noticeCatalog, type ProductView } from "@/lib/catalog";
import { factAmountText } from "@/lib/compare";
import { dailyMaxLabel, timesPerDayLabel } from "@/lib/dosage";
import { ingredientRole } from "@/lib/ingredientRole";
import { checkDoping, dopingListCurrent, dopingMonitoring, routeOf } from "@/lib/rules/doping";
import { applicableItems } from "@/lib/rules/noticeRules";
import { BADGE_INFO } from "@/lib/guard/uiCopy";
import type { Condition, NoticeGroup, NoticeItem, ProductBadgeKind } from "@/lib/schema/notice";

// 質問エージェント（L-20261103-43）の根拠。コードが集め、Claude は番号を選んで原文を抜き出すだけ。
// text は原文（通知・手引き・承認基準）か、この商品の入力値をコードで整えた文
export type Passage = {
  id: string;
  text: string;
  source: { label: string; url: string | null };
  // 通知の記載条件の原文（「〔○○を含有する製剤に記載すること〕」）。通知の項目だけ（L-20261103-44）
  condition: string | null;
  // 商品について集めた根拠ならその商品。全体から集めたものは null
  productId: string | null;
  // 語の一致で探すときに使う（Claude が使えないとき）
  kinds: ProductBadgeKind[];
  ingredients: string[];
};

type Draft = Omit<Passage, "id" | "productId" | "condition"> & { condition?: string | null };

// 記載条件に出てくる成分名（質問に成分名があるときの語の一致に使う）
function conditionIngredients(c: Condition): string[] {
  if ("hasIngredient" in c) return c.hasIngredient;
  if ("amountAtLeast" in c) return c.amountAtLeast.ingredients;
  if ("all" in c) return c.all.flatMap(conditionIngredients);
  if ("any" in c) return c.any.flatMap(conditionIngredients);
  return [];
}

function noticePassage(item: NoticeItem, group: NoticeGroup | undefined): Draft {
  return {
    text: item.body,
    source: {
      label: `厚労省通知「使用上の注意」${group?.name ?? item.groupId} ${item.section} ${item.itemNo}`,
      url: group?.sourceUrl ?? null,
    },
    condition: item.conditionText,
    kinds: item.badge ? [item.badge] : [],
    ingredients: [...new Set(conditionIngredients(item.condition))],
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

// 「含まない」「まだ取り込んでいない」もコードで確かめた事実として根拠にする（L-20261104-09）。
// これがないと「指定濫用防止の対象？」に「記載が見つかりません」と答え、含まないのか調べていないのかがわからない
function absenceFacts(view: ProductView): Draft[] {
  const { product } = view;
  const out: Draft[] = [];
  const checked = "この商品の成分の照合（コード）";
  if (!view.abuse.target && view.abuse.reason === "no_ingredient") {
    out.push({
      text: `指定濫用防止医薬品の対象成分（${ABUSE_INGREDIENTS.map((a) => a.name).join("、")}）は、この商品の成分に含まれていません`,
      source: { label: `${checked}・${ABUSE_SOURCE.ingredients}`, url: ABUSE_SOURCE.url },
      kinds: ["abuse"],
      ingredients: [],
    });
  } else if (!view.abuse.target && view.abuse.reason === "external") {
    out.push({
      text: "指定濫用防止医薬品は外用剤を除きます。この商品は外用剤です",
      source: { label: `${checked}・${ABUSE_SOURCE.ingredients}`, url: ABUSE_SOURCE.url },
      kinds: ["abuse"],
      ingredients: [],
    });
  }
  // ドーピング：2026年版との照合と、この商品の使い方での扱い（L-20261104-18）
  const dopingSource = {
    label: `${checked}・${DOPING_SOURCE.list}`,
    url: DOPING_SOURCE.url,
  };
  const year = dopingListCurrent() ? `${DOPING_SOURCE.year}年版` : "年版確認中";
  const dopingHits = checkDoping(product);
  if (!dopingHits.length) {
    out.push({
      text: `WADA 禁止表（${year}）に掲載の成分は、この商品の成分に含まれていません`,
      source: dopingSource,
      kinds: ["doping"],
      ingredients: [],
    });
  }
  const ROUTE: Record<string, string> = {
    oral: "内服",
    oromucosal: "口の中に使う",
    rectal: "肛門から使う",
    skin: "皮膚に使う",
    nasal: "鼻に使う",
    eye: "目に使う",
    unclear: "使い方が商品からは決まらない",
  };
  for (const h of dopingHits) {
    const where = `この商品は${ROUTE[routeOf(product)]}製剤`;
    const tail =
      h.status === "prohibited"
        ? `この使い方では禁止に当たる（${h.entry.timing}）`
        : h.status === "local"
          ? "この使い方は禁止の対象外と禁止表にある"
          : "使い方で変わるため Global DRO で確認";
    out.push({
      text: `${h.ingredient}：WADA 禁止表（${year}）の${h.entry.category}に掲載。${h.entry.condition ? `${h.entry.condition}。` : ""}${where}で、${tail}`,
      source: dopingSource,
      kinds: ["doping"],
      ingredients: [h.ingredient],
    });
  }
  for (const name of dopingMonitoring(product)) {
    out.push({
      text: `${name}：WADA の監視プログラムの成分で、禁止ではありません`,
      source: dopingSource,
      kinds: ["doping"],
      ingredients: [name],
    });
  }

  // ハラール関連の成分：添加物の事実だけ。ハラールかどうか・認証の有無は判断しない（L-20261104-18）
  const halal = halalFacts(product);
  const record = additivesOf(product.id);
  const halalSource = record
    ? {
        label: `添加物（${record.source.kind}、${record.source.checkedOn} 確認）`,
        url: record.source.url,
      }
    : { label: "ハコよみの収録状況", url: null };
  if (!halal.checked) {
    out.push({
      text: "この商品の添加物は、まだ収録していません。アルコール・ゼラチン等の有無とハラール認証は、メーカーに確認してください",
      source: { label: "ハコよみの収録状況", url: null },
      kinds: ["halal"],
      ingredients: [],
    });
  } else {
    if (halal.ethanol.length)
      out.push({
        text: `成分・添加物に、アルコール（エタノール）を含みます（${halal.ethanol.join("、")}）`,
        source: halalSource,
        kinds: ["halal"],
        ingredients: halal.ethanol,
      });
    if (halal.animal.length)
      out.push({
        text: `添加物に、動物・昆虫由来の可能性がある成分を含みます（${halal.animal.join("、")}）。由来は出典に書かれていないため、メーカーに確認してください`,
        source: halalSource,
        kinds: ["halal"],
        ingredients: halal.animal,
      });
    if (halal.either.length)
      out.push({
        text: `${halal.either.join("、")}は、植物由来も動物由来もある成分です（この商品の由来は出典に書かれていません）`,
        source: halalSource,
        kinds: ["halal"],
        ingredients: halal.either,
      });
    if (!halal.ethanol.length && !halal.animal.length)
      out.push({
        text: "成分・添加物の一覧に、アルコール（エタノール）やゼラチン等の動物・昆虫由来の可能性がある成分は見当たりません",
        source: halalSource,
        kinds: ["halal"],
        ingredients: [],
      });
    out.push({
      text: "ハラール認証の有無は、このアプリでは扱っていません。メーカーに確認してください",
      source: { label: "ハコよみの扱い", url: null },
      kinds: ["halal"],
      ingredients: [],
    });
  }
  if (!product.facts.some((f) => f.ingredient.includes("カフェイン"))) {
    out.push({
      text: "カフェインを含む成分は、この商品の成分に入っていません",
      source: { label: checked, url: null },
      kinds: ["caffeine"],
      ingredients: [],
    });
  }
  if (!view.noticeLoaded) {
    const absent = NO_NOTICE_GROUPS[product.noticeGroupId];
    out.push({
      text: absent
        ? `この商品の薬効群（${absent}）は、厚労省通知「使用上の注意」に項がありません。使用上の注意は添付文書（PMDA）で確認してください`
        : "この商品の薬効群の通知「使用上の注意」は、まだ取り込んでいません。使用上の注意は添付文書（PMDA）で確認してください",
      source: { label: "ハコよみの取り込み状況", url: null },
      kinds: ["drive", "breastfeeding", "under15", "under12", "alcohol"],
      ingredients: [],
    });
  }
  return out;
}

// 成分の根拠の文。分量がない成分も「配合」と出して、回答から落とさない・「不明」と誤解させない（L-20261104-11）。
// 目薬・点鼻・外用は濃度で表示する製剤で、1日量の分量を持たない作り
export function factText(
  product: ProductView["product"],
  f: ProductView["product"]["facts"][number],
) {
  if (f.uncertain) return `${f.ingredient}：配合（分量は添付文書で確認）`;
  if (f.concentration) return `${f.ingredient}：${factAmountText(f)}（濃度）`;
  if (f.amountPerDay === null || f.unit === null)
    return product.route === "external"
      ? `${f.ingredient}：配合（濃度で表示する製剤のため、分量はこのアプリに未登録。添付文書で確認）`
      : `${f.ingredient}：配合（分量は未登録。添付文書で確認）`;
  return `${f.ingredient}：1日最大量あたり ${factAmountText(f)}`;
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
        text: factText(product, f),
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
      // 確認ポイント（バッジ）の見出しもコードで出した事実として根拠にする。「何歳から？」に「15歳から」と答えられるように（L-20261104-12）
      own.push({
        text: `確認ポイント「${BADGE_INFO[badge.kind].name}」：${badge.label}`,
        source: {
          label: "この商品の確認ポイント（成分と通知の記載条件からコードで判定）",
          url: null,
        },
        kinds: [badge.kind],
        ingredients: [],
      });
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
    own.push(...absenceFacts(view));
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
    return own.map((d, i) => ({
      ...d,
      condition: d.condition ?? null,
      id: `p${col + 1}-${i + 1}`,
      productId: product.id,
    }));
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
  return drafts.map((d, i) => ({
    ...d,
    condition: d.condition ?? null,
    id: `g${i + 1}`,
    productId: null,
  }));
}
