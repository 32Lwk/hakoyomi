import type { BadgeKind, Condition, NoticeItem } from "@/lib/schema/notice";

type NoticeSection = NoticeItem["section"];

// 添付文書による補正（L-20261103-28）。通知の記載条件と、個別に承認された商品（スイッチOTC など）の添付文書が違うとき、添付文書を優先する。
// 通知の項目は書き換えない。補正で出したバッジは、根拠に「添付文書の記載による補正」と出典を出す。
// 添付文書の本文は持たない。文言は通知の同じ趣旨の項目の文面を使う（bodyFrom に項目 id）。

export type CorrectionTarget =
  // 通知と同じ式で成分を見る
  | { condition: Condition }
  // 有効成分がこれだけの製剤
  | { onlyIngredients: string[] }
  // 同じ成分でも添付文書が違う品（例：アレグラFX とジュニアの年齢）
  | { productIds: string[] };

export type CorrectionSource = { label: string; url: string };

type Base = {
  id: string;
  groupId: string;
  target: CorrectionTarget;
  sources: CorrectionSource[];
  checkedOn: string;
};

export type LabelCorrection = Base &
  (
    | // 通知の項目に当たっても出さない
    { action: "remove"; itemIds: string[] }
    // 通知の記載条件の外でもバッジを出す
    | { action: "add"; badge: BadgeKind; section: NoticeSection; body: string; bodyFrom: string }
    // 通知のバッジの種類で表せない記載がある（例：7才未満）。「該当なし」ではなく「未収録」にする
    | { action: "unrecorded"; kinds: BadgeKind[]; note: string }
    // 通知に項目がない種類（睡眠改善薬など）で、この商品の添付文書を確かめた。確認ポイントは add の補正だけで出し、
    // 出ない種類は「未収録」ではなく「該当なし」にする（L-20261103-36）
    | { action: "labelChecked"; note: string }
  );

const KEGG = (code: string, name: string): CorrectionSource => ({
  label: `KEGG MEDICUS ${name}`,
  url: `https://www.kegg.jp/medicus-bin/japic_otc?japic_code=${code}`,
});

const ALLEGRA_FX = KEGG("J1201000287", "アレグラFX");
const ALLEGRA_JR = KEGG("K1710000019", "アレグラFXジュニア");
const ALESION = KEGG("K1510000018", "アレジオン20");
const STONA_Z = KEGG("K1711000019", "ストナリニZジェル");
const LOXONIN = [
  KEGG("K1101000003", "ロキソニンS"),
  KEGG("J2101000113", "ロキソニンSクイック"),
  KEGG("J1601000006", "ロキソニンSプレミアム"),
];
const MUCODYNE = KEGG("J2401000006", "ムコダイン去たん錠Pro500");
const DREWELL = KEGG("J0601001652", "ドリエル");
const DREWELL_EX = KEGG("K0706000002", "ドリエルEX");
// KEGG にない。製造販売元（小林薬品工業）の添付文書（2026年5月改訂）を MEDLEY が載せている PDF で確認（L-20261103-41）
const DREAMIN_Z: CorrectionSource = {
  label: "ドリーミンZ 添付文書（2026年5月改訂、MEDLEY 掲載の PDF）",
  url: "https://cdn.medley.life/uploads/medicines/otc/pdf/A00400067011_20260831.pdf",
};
const ELPAIN_A = KEGG("J2501000118", "エルペインコーワα");
const LUNA_J = KEGG("J1201000074", "バファリンルナJ");
const NORSHIN_JUNIOR = KEGG("J0601001553", "小中学生用ノーシンピュア");
const RESTAMIN = KEGG("J0601005882", "レスタミンコーワ糖衣錠");
const RESTAMIN_U = KEGG("J0601005881", "レスタミンUコーワ錠");
const RESTAMIN_A = KEGG("K2309000002", "レスタミンコーワα錠");
const CHECKED_ON = "2026-11-03";

// 第2世代の抗ヒスタミン成分の単味製剤。通知（鼻炎用内服薬）の記載条件に名前がない
const SWITCH_ANTIHISTAMINES = ["フェキソフェナジン塩酸塩", "エピナスチン塩酸塩", "セチリジン塩酸塩"];

export const LABEL_CORRECTIONS: LabelCorrection[] = [
  {
    id: "bien-drive-fexofenadine",
    groupId: "bien_naifuku",
    action: "remove",
    itemIds: ["bien_naifuku-ng-3-1", "bien_naifuku-ng-3-2"],
    target: { onlyIngredients: ["フェキソフェナジン塩酸塩"] },
    sources: [ALLEGRA_FX, ALLEGRA_JR],
    checkedOn: CHECKED_ON,
  },
  {
    id: "genetsu-under15-loxoprofen",
    groupId: "genetsu_chintsu",
    action: "add",
    badge: "under15",
    section: "してはいけないこと",
    body: "１５歳未満の小児．",
    bodyFrom: "genetsu_chintsu-ng-1-3",
    target: { condition: { hasIngredient: ["ロキソプロフェンナトリウム水和物"] } },
    sources: LOXONIN,
    checkedOn: CHECKED_ON,
  },
  {
    id: "genetsu-breastfeeding-loxoprofen",
    groupId: "genetsu_chintsu",
    action: "add",
    badge: "breastfeeding",
    section: "相談すること",
    body: "授乳中の人．",
    bodyFrom: "genetsu_chintsu-sd-1-3",
    target: { condition: { hasIngredient: ["ロキソプロフェンナトリウム水和物"] } },
    sources: LOXONIN,
    checkedOn: CHECKED_ON,
  },
  {
    id: "bien-under15-switch",
    groupId: "bien_naifuku",
    action: "add",
    badge: "under15",
    section: "してはいけないこと",
    body: "１５歳未満の小児．",
    bodyFrom: "bien_naifuku-ng-1-2",
    target: { condition: { hasIngredient: ["エピナスチン塩酸塩", "セチリジン塩酸塩"] } },
    sources: [ALESION, STONA_Z],
    checkedOn: CHECKED_ON,
  },
  {
    // ジュニアは 7才未満が服用しない。成分が同じなので商品で分ける
    id: "bien-under15-allegra-fx",
    groupId: "bien_naifuku",
    action: "add",
    badge: "under15",
    section: "してはいけないこと",
    body: "１５歳未満の小児．",
    bodyFrom: "bien_naifuku-ng-1-2",
    target: { productIds: ["allegra-fx"] },
    sources: [ALLEGRA_FX],
    checkedOn: CHECKED_ON,
  },
  {
    id: "bien-age-allegra-junior",
    groupId: "bien_naifuku",
    action: "unrecorded",
    kinds: ["under15"],
    note: "添付文書では7才未満は服用しない。年齢のバッジ（15歳・12歳）では表せない",
    target: { productIds: ["med-05202"] },
    sources: [ALLEGRA_JR],
    checkedOn: CHECKED_ON,
  },
  {
    // 通知の「4.」の（ ）内はロートエキスを含有する製剤だけに記載するので、（ ）の前までを使う
    id: "bien-breastfeeding-switch",
    groupId: "bien_naifuku",
    action: "add",
    badge: "breastfeeding",
    section: "してはいけないこと",
    body: "授乳中の人は本剤を服用しないか，本剤を服用する場合は授乳を避けること",
    bodyFrom: "bien_naifuku-ng-4",
    target: { condition: { hasIngredient: SWITCH_ANTIHISTAMINES } },
    sources: [ALLEGRA_FX, ALLEGRA_JR, ALESION, STONA_Z],
    checkedOn: CHECKED_ON,
  },
  {
    // 鼻炎用内服薬の通知に飲酒の項目はない。文言は解熱鎮痛薬の通知の同じ項目
    id: "bien-alcohol-switch",
    groupId: "bien_naifuku",
    action: "add",
    badge: "alcohol",
    section: "してはいけないこと",
    body: "服用前後は飲酒しないこと",
    bodyFrom: "genetsu_chintsu-ng-4",
    target: { condition: { hasIngredient: SWITCH_ANTIHISTAMINES } },
    sources: [ALLEGRA_FX, ALLEGRA_JR, ALESION, STONA_Z],
    checkedOn: CHECKED_ON,
  },
  {
    // L-カルボシステイン単味。同じ成分のストナ去たんカプセルの添付文書には授乳の記載がないので、商品で当てる（L-20261103-29）
    id: "chinga-breastfeeding-mucodyne",
    groupId: "chinga_kyotan",
    action: "add",
    badge: "breastfeeding",
    section: "相談すること",
    body: "授乳中の人．",
    bodyFrom: "chinga_kyotan-sd-1-3",
    target: { productIds: ["mucodyne-pro500"] },
    sources: [MUCODYNE],
    checkedOn: CHECKED_ON,
  },
  // 睡眠改善薬（ジフェンヒドラミン塩酸塩、L-20261103-36）。通知PDFに項目がないため、添付文書で確かめた品だけ確認ポイントを出す。
  // 文言は他の薬効群の通知の同じ趣旨の項目。ドリーミンZ は添付文書の PDF で確かめた（L-20261103-41）
  {
    id: "suimin-label-checked",
    groupId: "suimin_kaizen",
    action: "labelChecked",
    note: "添付文書の「してはいけないこと」を KEGG MEDICUS（ドリーミンZ は添付文書の PDF）で確認",
    target: { productIds: ["drewell", "drewell-ex", "dreamin-z"] },
    sources: [DREWELL, DREWELL_EX, DREAMIN_Z],
    checkedOn: CHECKED_ON,
  },
  {
    id: "suimin-drive",
    groupId: "suimin_kaizen",
    action: "add",
    badge: "drive",
    section: "してはいけないこと",
    body: "服用後，乗物又は機械類の運転操作をしないこと",
    bodyFrom: "bien_naifuku-ng-3-1",
    target: { productIds: ["drewell", "drewell-ex", "dreamin-z"] },
    sources: [DREWELL, DREWELL_EX, DREAMIN_Z],
    checkedOn: CHECKED_ON,
  },
  {
    id: "suimin-breastfeeding",
    groupId: "suimin_kaizen",
    action: "add",
    badge: "breastfeeding",
    section: "してはいけないこと",
    body: "授乳中の人は本剤を服用しないか，本剤を服用する場合は授乳を避けること",
    bodyFrom: "bien_naifuku-ng-4",
    target: { productIds: ["drewell", "drewell-ex", "dreamin-z"] },
    sources: [DREWELL, DREWELL_EX, DREAMIN_Z],
    checkedOn: CHECKED_ON,
  },
  {
    id: "suimin-under15",
    groupId: "suimin_kaizen",
    action: "add",
    badge: "under15",
    section: "してはいけないこと",
    body: "１５歳未満の小児．",
    bodyFrom: "genetsu_chintsu-ng-1-3",
    target: { productIds: ["drewell", "drewell-ex", "dreamin-z"] },
    sources: [DREWELL, DREWELL_EX, DREAMIN_Z],
    checkedOn: CHECKED_ON,
  },
  {
    id: "suimin-alcohol",
    groupId: "suimin_kaizen",
    action: "add",
    badge: "alcohol",
    section: "してはいけないこと",
    body: "服用前後は飲酒しないこと",
    bodyFrom: "genetsu_chintsu-ng-4",
    target: { productIds: ["drewell", "drewell-ex", "dreamin-z"] },
    sources: [DREWELL, DREWELL_EX, DREAMIN_Z],
    checkedOn: CHECKED_ON,
  },
  // 生理痛にも使う解熱鎮痛薬（L-20261103-40）
  {
    // ブチルスコポラミン臭化物（目のかすみ等）。通知の運転の項目は眠気を起こす成分の記載条件なので、商品で当てる。（ ）の理由は書かない
    id: "genetsu-drive-elpain",
    groupId: "genetsu_chintsu",
    action: "add",
    badge: "drive",
    section: "してはいけないこと",
    body: "服用後，乗物又は機械類の運転操作をしないこと",
    bodyFrom: "genetsu_chintsu-ng-3",
    target: { productIds: ["med-00199"] },
    sources: [ELPAIN_A],
    checkedOn: CHECKED_ON,
  },
  {
    id: "genetsu-age-children",
    groupId: "genetsu_chintsu",
    action: "unrecorded",
    kinds: ["under15"],
    note: "添付文書の用法・用量では7才未満は服用しない。年齢のバッジ（15歳・12歳）では表せない",
    target: { productIds: ["med-00577", "med-00182"] },
    sources: [LUNA_J, NORSHIN_JUNIOR],
    checkedOn: CHECKED_ON,
  },
  // レスタミンコーワの内服（ジフェンヒドラミン塩酸塩、L-20261103-40）。抗ヒスタミン薬主薬製剤の通知を取り込んでいないため、
  // 添付文書で確かめた品だけ確認ポイントを出す（睡眠改善薬と同じ扱い）
  {
    id: "kou-histamine-label-checked",
    groupId: "kou_histamine",
    action: "labelChecked",
    note: "添付文書の「してはいけないこと」を KEGG MEDICUS で確認",
    target: { productIds: ["med-03563", "med-03562", "med-03564"] },
    sources: [RESTAMIN, RESTAMIN_U, RESTAMIN_A],
    checkedOn: CHECKED_ON,
  },
  {
    id: "kou-histamine-drive",
    groupId: "kou_histamine",
    action: "add",
    badge: "drive",
    section: "してはいけないこと",
    body: "服用後，乗物又は機械類の運転操作をしないこと",
    bodyFrom: "bien_naifuku-ng-3-1",
    target: { productIds: ["med-03563", "med-03562", "med-03564"] },
    sources: [RESTAMIN, RESTAMIN_U, RESTAMIN_A],
    checkedOn: CHECKED_ON,
  },
  {
    id: "kou-histamine-breastfeeding",
    groupId: "kou_histamine",
    action: "add",
    badge: "breastfeeding",
    section: "してはいけないこと",
    body: "授乳中の人は本剤を服用しないか，本剤を服用する場合は授乳を避けること",
    bodyFrom: "bien_naifuku-ng-4",
    target: { productIds: ["med-03563", "med-03562", "med-03564"] },
    sources: [RESTAMIN, RESTAMIN_U, RESTAMIN_A],
    checkedOn: CHECKED_ON,
  },
  {
    id: "kou-histamine-alcohol",
    groupId: "kou_histamine",
    action: "add",
    badge: "alcohol",
    section: "してはいけないこと",
    body: "服用前後は飲酒しないこと",
    bodyFrom: "genetsu_chintsu-ng-4",
    target: { productIds: ["med-03563", "med-03562", "med-03564"] },
    sources: [RESTAMIN, RESTAMIN_U, RESTAMIN_A],
    checkedOn: CHECKED_ON,
  },
  {
    id: "kou-histamine-under15-alpha",
    groupId: "kou_histamine",
    action: "add",
    badge: "under15",
    section: "してはいけないこと",
    body: "１５歳未満の小児．",
    bodyFrom: "genetsu_chintsu-ng-1-3",
    target: { productIds: ["med-03564"] },
    sources: [RESTAMIN_A],
    checkedOn: CHECKED_ON,
  },
  {
    // 糖衣錠・U錠は 5才から（用法・用量）
    id: "kou-histamine-age",
    groupId: "kou_histamine",
    action: "unrecorded",
    kinds: ["under15"],
    note: "添付文書の用法・用量では5才未満は服用しない。年齢のバッジ（15歳・12歳）では表せない",
    target: { productIds: ["med-03563", "med-03562"] },
    sources: [RESTAMIN, RESTAMIN_U],
    checkedOn: CHECKED_ON,
  },
];
