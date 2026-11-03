import additives from "@/data/additives.json";
import type { Product } from "@/lib/schema/product";

// 商品の添加物（L-20261104-18）。ハラールに関わる事実（アルコール・ゼラチン等）を出すためだけに使う。
// 名前は出典のとおり（KEGG MEDICUS 2026/10/21版・メーカー公式）で、由来は出典に書かれていないので持たない。
// 作り方：scripts/research/build_additives.py（調査は data/research/、公開リポの外）
export type AdditiveRecord = {
  productId: string;
  additives: string[];
  capsule: boolean;
  source: { kind: string; url: string; checkedOn: string; note: string | null };
};

const RECORDS = new Map((additives as AdditiveRecord[]).map((r) => [r.productId, r]));

export function additivesOf(productId: string): AdditiveRecord | null {
  return RECORDS.get(productId) ?? null;
}

// 飲用のアルコール（エタノール）だけを拾う。ステアリルアルコール・ベンジルアルコール・ポリビニルアルコールなど
// 名前に「アルコール」を含む別の物質は拾わない（語の一致ではなく、名前の頭で決める）
const ETHANOL = /^(無水|消毒用)?エタノール$|^アルコール(\d|（|\(|$)/;
// 動物・昆虫由来の可能性がある成分（ゆうの選択、L-20261104-18）。由来は出典にないので「可能性」として出す
const ANIMAL = ["ゼラチン", "セラック", "カルミン", "コチニール", "ミツロウ"];
// 植物由来も動物由来もある成分。バッジにはせず、質問の「詳しく見る」でだけ添える
const EITHER = ["グリセリン", "ステアリン酸", "硬化油"];

export type HalalFacts = {
  ethanol: string[];
  animal: string[];
  either: string[];
  // 添加物を調べられたか（調べられなければ「含まない」とは言わない）
  checked: boolean;
};

export function halalFacts(product: Product): HalalFacts {
  const record = additivesOf(product.id);
  const names = record?.additives ?? [];
  // 有効成分のアルコール（ドリンク剤の「アルコール」など）も含める
  const ethanol = [
    ...product.facts.map((f) => f.ingredient).filter((n) => ETHANOL.test(n)),
    ...names.filter((n) => ETHANOL.test(n)),
  ];
  return {
    ethanol: [...new Set(ethanol)],
    animal: [...new Set(names.filter((n) => ANIMAL.some((k) => n.includes(k))))],
    either: [...new Set(names.filter((n) => EITHER.some((k) => n.includes(k))))],
    checked: record !== null,
  };
}
