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

// 通知に項がない薬効群の品（L-20261104-20）。[商品 id, KEGG の japic_code, 品名]
const CHECKED_ON_20 = "2026-11-04";
const KOUKUU_SPRAY: [string, string, string][] = [
  ["med-02933", "J1001000400", "トラフル クイックショット"],
  ["med-02953", "K1608000014", "チョコラBB口内炎リペアショット"],
  ["med-02924", "K2102000022", "のどぬーるナイテクト"],
  ["med-02948", "K2607000009", "コフジスACのどスプレー"],
  ["med-02927", "J1201000288", "ストナのどスプレー"],
  ["med-02934", "J1201000252", "ルルのどスプレー"],
  ["med-02991", "K2312000004", "ムヒののどスプレー"],
  ["med-02969", "J0901000069", "浅田飴AZのどスプレーS"],
  ["med-02925", "K2202000008", "ハレナーススプレー"],
];
const KOUNAIEN: [string, string, string][] = [
  ["med-01540", "J1401000446", "口内炎軟膏大正クイックケア"],
  ["med-01536", "K1907000009", "トラフルダイレクトa"],
  ["med-01555", "K1608000008", "トラフル軟膏PROクイック"],
  ["med-03011", "K1404000001", "トラフル軟膏"],
  ["med-01541", "K1403000013", "口内炎パッチ大正クイックケア"],
];
const HYTHIOL_2 = KEGG("K2003000001", "ハイチオールCプラス2");
const HYTHIOL_EX = KEGG("K2503000003", "ハイチオールCプラスEX");
const TAISHO_K = KEGG("J0601002830", "大正胃腸薬K");
const TAISHO_KAMPO = KEGG("J0601002833", "大正漢方胃腸薬〈錠剤〉");

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
  // 添付文書で確かめた品だけ確認ポイントを出す（睡眠改善薬と同じ扱い）。L-20261104-16 で薬効群を allergy に付け替えた
  {
    id: "kou-histamine-label-checked",
    groupId: "allergy",
    action: "labelChecked",
    note: "添付文書の「してはいけないこと」を KEGG MEDICUS で確認",
    target: { productIds: ["med-03563", "med-03562", "med-03564"] },
    sources: [RESTAMIN, RESTAMIN_U, RESTAMIN_A],
    checkedOn: CHECKED_ON,
  },
  {
    id: "kou-histamine-drive",
    groupId: "allergy",
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
    groupId: "allergy",
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
    groupId: "allergy",
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
    groupId: "allergy",
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
    groupId: "allergy",
    action: "unrecorded",
    kinds: ["under15"],
    note: "添付文書の用法・用量では5才未満は服用しない。年齢のバッジ（15歳・12歳）では表せない",
    target: { productIds: ["med-03563", "med-03562"] },
    sources: [RESTAMIN, RESTAMIN_U],
    checkedOn: CHECKED_ON,
  },
  {
    // 外用鎮痛消炎薬の通知は、インドメタシンの塗布剤（と膏体あたりの量が少ないテープ剤・パップ剤）で「１５歳未満」を
    // 「１１歳未満」に置き換える。置き換えた文は通知の原文にないので出さず、年齢は「未収録」にする（L-20261104-20）
    id: "gaiyo-chintsu-age-indomethacin",
    groupId: "gaiyo_chintsu",
    action: "unrecorded",
    kinds: ["under15"],
    note: "通知ではインドメタシンの塗布剤等は「１１歳未満の小児」に置き換える。年齢のバッジ（15歳・12歳）では表せない",
    target: { condition: { hasIngredient: ["インドメタシン"] } },
    sources: [{ label: "厚労省通知「使用上の注意」外用鎮痛消炎薬", url: "https://www.mhlw.go.jp/content/001742612.pdf" }],
    checkedOn: CHECKED_ON_20,
  },
  // 通知に項がない薬効群（L-20261104-16）の残り18品。KEGG MEDICUS で添付文書を確かめた（L-20261104-20）。
  // 運転・授乳・15歳未満・12歳未満・飲酒のうち、記載があるものだけ add で出し、ほかは「該当なし」にする
  {
    // のどスプレー9品。5つの確認ポイントはどれも記載がない。用法に年齢の区分はない（小児は保護者の指導監督のもとで使用）。
    // エタノール配合の品の「使用後しばらく呼気からアルコールが検出されることがある」は眠気の運転注意ではないため、運転のバッジにしない
    id: "koukuu-spray-label-checked",
    groupId: "koukuu_spray",
    action: "labelChecked",
    note: "添付文書の使用上の注意を KEGG MEDICUS で確認。運転・授乳・年齢・飲酒の記載はない",
    target: { productIds: KOUKUU_SPRAY.map(([id]) => id) },
    sources: KOUKUU_SPRAY.map(([, code, name]) => KEGG(code, name)),
    checkedOn: CHECKED_ON_20,
  },
  {
    id: "kounaien-label-checked",
    groupId: "kounaien",
    action: "labelChecked",
    note: "添付文書の使用上の注意を KEGG MEDICUS で確認",
    target: { productIds: KOUNAIEN.map(([id]) => id) },
    sources: KOUNAIEN.map(([, code, name]) => KEGG(code, name)),
    checkedOn: CHECKED_ON_20,
  },
  {
    // トリアムシノロンアセトニドの4品は「相談すること」に授乳中の人。アズレン等のトラフル軟膏にはない
    id: "kounaien-breastfeeding-steroid",
    groupId: "kounaien",
    action: "add",
    badge: "breastfeeding",
    section: "相談すること",
    body: "授乳中の人．",
    bodyFrom: "chinga_kyotan-sd-1-3",
    target: { onlyIngredients: ["トリアムシノロンアセトニド"] },
    sources: KOUNAIEN.filter(([id]) => id !== "med-03011").map(([, code, name]) => KEGG(code, name)),
    checkedOn: CHECKED_ON_20,
  },
  {
    // 貼付剤の2品は「5歳未満は使用しない」
    id: "kounaien-age-patch",
    groupId: "kounaien",
    action: "unrecorded",
    kinds: ["under15"],
    note: "添付文書の用法・用量では5才未満は使用しない。年齢のバッジ（15歳・12歳）では表せない",
    target: { productIds: ["med-01536", "med-01541"] },
    sources: [KEGG("K1907000009", "トラフルダイレクトa"), KEGG("K1403000013", "口内炎パッチ大正クイックケア")],
    checkedOn: CHECKED_ON_20,
  },
  {
    id: "l-cysteine-label-checked",
    groupId: "l_cysteine",
    action: "labelChecked",
    note: "添付文書の使用上の注意を KEGG MEDICUS で確認。運転・授乳・飲酒の記載はない",
    target: { productIds: ["med-04595", "med-04596"] },
    sources: [HYTHIOL_2, HYTHIOL_EX],
    checkedOn: CHECKED_ON_20,
  },
  {
    id: "l-cysteine-age",
    groupId: "l_cysteine",
    action: "unrecorded",
    kinds: ["under15"],
    note: "添付文書の用法・用量では7才未満は服用しない。年齢のバッジ（15歳・12歳）では表せない",
    target: { productIds: ["med-04595", "med-04596"] },
    sources: [HYTHIOL_2, HYTHIOL_EX],
    checkedOn: CHECKED_ON_20,
  },
  {
    // 安中散と芍薬甘草湯の配合（大正）。カンゾウの注意（高齢者・むくみ等）は漢方製剤の通知の項目と同じ趣旨だが、
    // バッジの種類ではないため補正にしない。大正漢方胃腸薬〈錠剤〉は1日のカンゾウが1g未満で、その注意自体がない
    id: "kampo-mix-label-checked",
    groupId: "kampo_mix",
    action: "labelChecked",
    note: "添付文書の使用上の注意を KEGG MEDICUS で確認。運転・授乳・飲酒の記載はない",
    target: { productIds: ["med-00102", "med-00104"] },
    sources: [TAISHO_K, TAISHO_KAMPO],
    checkedOn: CHECKED_ON_20,
  },
  {
    id: "kampo-mix-age",
    groupId: "kampo_mix",
    action: "unrecorded",
    kinds: ["under15"],
    note: "添付文書の用法・用量では5才未満は服用しない。年齢のバッジ（15歳・12歳）では表せない",
    target: { productIds: ["med-00102", "med-00104"] },
    sources: [TAISHO_K, TAISHO_KAMPO],
    checkedOn: CHECKED_ON_20,
  },
];
