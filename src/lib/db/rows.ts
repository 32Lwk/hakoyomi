import { NoticeGroup, NoticeItem } from "@/lib/schema/notice";
import { Product, ProductFact } from "@/lib/schema/product";

// Supabase の行（supabase/migrations）と zod の型の相互変換。読むときは必ず zod で検証する。

export type ShelfLocationRow = {
  product_id: string;
  store_id: string;
  shelf_id: string;
  tier: number;
  column: number;
};

type ProductFactRow = {
  product_id: string;
  ingredient: string;
  ingredient_classes: string[];
  amount_per_day: number | null;
  unit: string | null;
  uncertain: boolean;
  position: number;
};

export type ProductRow = {
  id: string;
  jan: string;
  name: string;
  maker: string;
  risk_class: string;
  kind: string;
  notice_group_id: string;
  efficacy_groups: string[];
  route: string;
  crude_drug_main: boolean;
  daily_max_units: number;
  times_per_day: number;
  content_qty: number;
  content_unit: string;
  pmda_url: string | null;
  doc_revised_on: string | null;
  entered_by: string;
  verified_on: string | null;
  product_facts?: ProductFactRow[];
};

export type NoticeGroupRow = {
  id: string;
  name: string;
  source_url: string;
  source_page: number | null;
  fetched_on: string;
};

export type NoticeItemRow = {
  id: string;
  group_id: string;
  section: string;
  item_no: string;
  body: string;
  condition: unknown;
  condition_text: string | null;
  excluded_by: string[];
  badge: string | null;
  needs_review: boolean;
  position: number;
};

export function productToRows(product: Product): { product: ProductRow; facts: ProductFactRow[] } {
  return {
    product: {
      id: product.id,
      jan: product.jan,
      name: product.name,
      maker: product.maker,
      risk_class: product.riskClass,
      kind: product.kind,
      notice_group_id: product.noticeGroupId,
      efficacy_groups: product.efficacyGroups,
      route: product.route,
      crude_drug_main: product.crudeDrugMain,
      daily_max_units: product.dailyMaxUnits,
      times_per_day: product.timesPerDay,
      content_qty: product.contentQty,
      content_unit: product.contentUnit,
      pmda_url: product.pmdaUrl,
      doc_revised_on: product.docRevisedOn,
      entered_by: product.enteredBy,
      verified_on: product.verifiedOn,
    },
    facts: product.facts.map((fact, position) => ({
      product_id: product.id,
      ingredient: fact.ingredient,
      ingredient_classes: fact.ingredientClasses,
      amount_per_day: fact.amountPerDay,
      unit: fact.unit,
      uncertain: fact.uncertain,
      position,
    })),
  };
}

// product_facts を埋め込んだ行（select("*, product_facts(*)")）から
export function productFromRow(row: ProductRow): Product {
  const facts = [...(row.product_facts ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((fact) =>
      ProductFact.parse({
        ingredient: fact.ingredient,
        ingredientClasses: fact.ingredient_classes,
        amountPerDay: fact.amount_per_day,
        unit: fact.unit,
        uncertain: fact.uncertain,
      }),
    );
  return Product.parse({
    id: row.id,
    jan: row.jan,
    name: row.name,
    maker: row.maker,
    riskClass: row.risk_class,
    kind: row.kind,
    noticeGroupId: row.notice_group_id,
    efficacyGroups: row.efficacy_groups,
    route: row.route,
    crudeDrugMain: row.crude_drug_main,
    dailyMaxUnits: row.daily_max_units,
    timesPerDay: row.times_per_day,
    contentQty: row.content_qty,
    contentUnit: row.content_unit,
    facts,
    pmdaUrl: row.pmda_url,
    docRevisedOn: row.doc_revised_on,
    enteredBy: row.entered_by,
    verifiedOn: row.verified_on,
  });
}

export function noticeGroupToRow(group: NoticeGroup): NoticeGroupRow {
  return {
    id: group.id,
    name: group.name,
    source_url: group.sourceUrl,
    source_page: group.sourcePage,
    fetched_on: group.fetchedOn,
  };
}

export function noticeGroupFromRow(row: NoticeGroupRow): NoticeGroup {
  return NoticeGroup.parse({
    id: row.id,
    name: row.name,
    sourceUrl: row.source_url,
    sourcePage: row.source_page,
    fetchedOn: row.fetched_on,
  });
}

export function noticeItemToRow(item: NoticeItem, position: number): NoticeItemRow {
  return {
    id: item.id,
    group_id: item.groupId,
    section: item.section,
    item_no: item.itemNo,
    body: item.body,
    condition: item.condition,
    condition_text: item.conditionText,
    excluded_by: item.excludedBy,
    badge: item.badge ?? null,
    needs_review: item.needsReview,
    position,
  };
}

export function noticeItemFromRow(row: NoticeItemRow): NoticeItem {
  return NoticeItem.parse({
    id: row.id,
    groupId: row.group_id,
    section: row.section,
    itemNo: row.item_no,
    body: row.body,
    condition: row.condition,
    conditionText: row.condition_text,
    excludedBy: row.excluded_by,
    badge: row.badge ?? undefined,
    needsReview: row.needs_review,
  });
}
