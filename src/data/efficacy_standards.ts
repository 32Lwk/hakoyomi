import marks from "@/data/efficacy_marks.json";
import standards from "@/data/efficacy_standards.json";

// 製造販売承認基準の効能・効果（データ層②、L-20261103-41）。厚労省の通知の文面（著作権法13条2号）をそのまま持ち、出典を付ける。
// 逆引き（T302）で選ぶ語は、この原文の一部をそのまま切り出したもの。
// 区分ごとに効能が違う承認基準（眼科用薬・ビタミン主薬製剤・胃腸薬など）は、商品の区分を持っていないため載せない

export type EfficacyTerm = {
  // `${承認基準の id}:${語の名前}`
  id: string;
  // 承認基準の効能・効果の原文の一部（そのまま）
  word: string;
  // 商品の効能・効果との照合に使う語（言い換えを含む。画面には出さない）
  keys: string[];
};

export type EfficacyStandard = {
  id: string;
  // 承認基準の名前（例：解熱鎮痛薬）
  name: string;
  // この承認基準の薬効群に当たる商品（Product.noticeGroupId）
  noticeGroupIds: string[];
  notice: string;
  sourceUrl: string;
  sourcePage: string | null;
  fetchedOn: string;
  // 効能・効果の原文
  text: string;
  // 語の前の前置きの原文（漢方製剤の「比較的体力があるものの次の諸症」。L-20261104-12）
  scope?: string;
  terms: EfficacyTerm[];
  note?: string;
};

export const EFFICACY_STANDARDS: EfficacyStandard[] = standards;

// 商品ごとに、既存データの効能・効果の文面に承認基準の語があったもの（scripts/demo/efficacy_marks.py で作る）。
// スイッチOTC・専用品（例：エルペインコーワα は月経痛だけ）が薬効群の範囲すべてで出ないようにする。文面は持たない
export const EFFICACY_MARKS: Record<string, string[]> = marks;
