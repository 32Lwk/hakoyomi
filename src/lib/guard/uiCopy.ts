import type { BadgeKind } from "@/lib/schema/notice";

// 画面の固定文言はここからだけ使う（rules §4-3）。src 全体の禁止語スキャンの対象
export const UI_COPY = {
  chooseNotice: "この中から選ぶのは販売者です",
  noticeDerived:
    "この商品の成分から導いた通知上の記載事項です。実際の添付文書は PMDA で確認してください",
  labelCorrected:
    "通知の記載条件には当たらないが、この商品の添付文書に同じ趣旨の記載があるため表示（添付文書による補正）",
  labelOnly:
    "この種類は厚労省通知に項目がないため、この商品の添付文書の記載から表示（添付文書で確認）",
  noEvidence: "該当する記載が見つかりません。添付文書（PMDA）で確認してください",
  blocked: "表示できない表現が含まれたため省略しました",
  uncertain: "添付文書で確認",
  emptyRead: "JANを読むか、品名で検索してください",
  scanning: "JANを枠に合わせてください",
  unknownJan: "このJANはデモデータにありません。品名で検索するか、入力し直してください",
  diffRow: "この行の分量が異なります",
  dopingCheck: "最終確認は Global DRO 等で行ってください",
  mockNotice: "担当者・手順書・店舗・棚は模擬データです",
  demoData: "デモ（商品は実在・店舗は架空）",
  demoShort: "デモ・店舗は架空",
  demoProducts: "この商品の添付文書へのリンクがありません。PMDA で品名から確認してください",
  linkOutText: "この商品の文面はアプリに載せていません。添付文書（PMDA）で確認してください",
  researchedFacts:
    "分量・内容量は公開情報から入れた未確認の値です。実物の箱で確認してください。参照",
  drowsyIngredient:
    "眠気の注意につながる成分を含みます（抗ヒスタミン剤・鎮静成分・コデイン類など）。記載は添付文書（PMDA）で確認してください",
  invalidJan: "JANの桁数かチェックデジットが合いません。入力し直してください",
  readError: "読み取れませんでした。もう一度読むか、JANを入力してください",
  cameraUnavailable: "カメラを使えません。JANを入力するか、品名で検索してください",
  addedToCompare: "比べるに追加しました",
  needTwo: "比べるには2品以上を読んでください",
  sortedByName: "品名順に並べています（順位ではありません）",
  illustration: "イメージ図",
  badgeHint: "タップで根拠を表示",
  badgeNone: "該当なし",
  badgeNoneNote:
    "この商品の成分は、通知・リストの記載条件に当たりません。添付文書の記載は PMDA で確認してください",
  badgeUnloaded: "未収録",
  badgeUnloadedNote:
    "厚労省通知「使用上の注意」からは確かめられない項目です（通知に項がない薬効群の商品、通知と添付文書の書き方が違う記載）。添付文書（PMDA）で確認してください",
  badgeRowHint: "タップで説明・根拠",
  badgeUnloadedShort: "未収録（通知から確かめられない）",
  addToCompare: "比べるに追加",
  compareFull: "比べられるのは4品までです。外してから追加してください",
  findPlaceholder: "品名・メーカー・JANで探す",
  searchPlaceholder: "品名・メーカー・成分名で探す",
  clearFilters: "すべて外す",
  ingredientSuggest: "成分の条件にする",
  ingredientFilterNote: "選んだ成分をすべて含む商品に絞ります（数字は品数）",
  excludeFilterNote:
    "通知・リストに当たる成分を含む商品を除きます。通知を未取り込みの種類の商品も除きます",
  ingredientNoGroup: "手引きの分類なし",
  readJan: "JANを読む",
  readJanHint: "箱のバーコードをカメラで読みます",
  clearProducts: "すべて外す",
  askAbout: "この商品について質問",
  askPlaceholder: "例：何歳から？",
  askNote:
    "Claude が根拠の記載をまとめたものです。判断は販売者が行い、添付文書（PMDA）で確認してください",
  askKeyword: "Claude を使えないため、検索（BM25）で見つかった記載だけを出しています",
  askGeneralSource: "全体から",
  askNewChat: "新しい会話をはじめる",
  askError: "質問を送れませんでした。もう一度送ってください",
  askTitle: "医薬品について質問",
  askPlaceholderGeneral: "質問か品名を入力",
  askTopics: "話題の商品",
  askMatched: "品名が合う商品",
  askStacked: "選んでいる商品",
  askPlaceholderNext: "続けて質問できます",
  askPickProduct: "商品から選ぶ",
  askMore: "詳しく見る",
  askSortedByName: "品名順",
  askDiffNote: "違う項目だけを並べています（分量は1日最大量あたり。—＝含まない・該当なし）",
  askNoDiff: "比べた項目に違いはありません",
  askNoMatch: "品名の合う商品がありません。このまま送ると、通知・手引き全体から答えます",
  askNoConclusion: "該当しそうな記載を抜き出しました。下の根拠の記載を確認してください",
  askNotFound: "記載が見つかりません",
  askLoading: "記載を探しています",
  askEvidence: "出典",
  clearProductsDone: "選んでいる商品を外しました",
  noticeOthers:
    "通知に項がない薬効群（睡眠改善薬・のどスプレー・口内炎用薬など）の商品は、確認ポイントに「未収録」と出ます",
  readList: "読んだ商品",
  readMark: "読んだ",
  kindsTitle: "種類から探す",
  sortedShort: "品名順（順位ではありません）",
  backToList: "商品一覧",
  openShelf: "棚で見る",
  reverseAction: "効能・効果の語で探す",
  reverseTitle: "承認基準の効能・効果の語",
  reverseClear: "品名の検索に戻す",
  reverseNone:
    "承認基準の効能・効果に当たる語が見つかりません。言い方を変えるか、種類・成分で探してください",
  reverseNote:
    "薬効群の承認基準の効能・効果にこの語があり、商品の効能・効果にも同じ語がある商品です。商品の効能・効果は添付文書（PMDA）で確認してください。対象はかぜ薬・解熱鎮痛薬・せき止め・鼻炎薬（内服・点鼻）・乗り物酔い薬で、目薬・胃腸薬・ビタミン剤・外用薬・漢方薬・睡眠改善薬など承認基準の区分を持たない種類は含みません",
  reverseMatched: "効能の語",
  reverseKeyword: "語の一致で対応づけました（Claude を使っていません）",
  readAnother: "比べる商品を読む",
  noMatch: "該当する商品がありません",
  showAll: "すべて",
  showDiff: "違いだけ",
  purposeTitle: "配合目的",
  purposeHint: "成分名をタップで配合目的を表示",
  tebikiPending: "手引きと照合待ち",
  tebikiMissing:
    "手引きのこの薬効群の項に、この成分の記載が見つかりません。添付文書（PMDA）で確認してください",
} as const;

export type UiCopyKey = keyof typeof UI_COPY;

// 設定の「このアプリについて」（L-20261103-43）
export const ABOUT_LINES = [
  "登録販売者が店頭で説明するときに、医薬品の記載と出典を手元に出すためのツールです",
  "推奨や順位は出しません。並びは品名順です",
  "商品を選ぶこと・説明すること・販売の判断は販売者が行います",
  "質問や検索に入れた言葉、お客様の情報は保存しません",
  "商品は実在の医薬品、店舗・棚・担当者は架空のデモデータです",
] as const;

// バッジの種類ごとの名前と「何のバッジか」の1行（L-20261103-10）。根拠シートの先頭と比べるの行見出しで使う。
// short は比べるの行見出し用（なければ name）
export const BADGE_INFO: Record<BadgeKind, { name: string; short?: string; about: string }> = {
  abuse: {
    name: "指定濫用防止医薬品",
    short: "濫用防止",
    about: "告示で指定された成分を含む医薬品です。販売の際に確認する事項が決められています",
  },
  drive: {
    name: "運転",
    about: "厚労省通知の使用上の注意に、服用後の乗物・機械類の運転操作についての記載があります",
  },
  breastfeeding: {
    name: "授乳",
    about: "厚労省通知の使用上の注意に、授乳中の人についての記載があります",
  },
  // 15歳未満と12歳未満は同じ製剤に併記されない（通知の但し書き）ので、画面では1つの「年齢」として扱う
  under15: {
    name: "年齢",
    about:
      "厚労省通知の使用上の注意に、年齢についての記載があります。「15歳から」は「15歳未満の小児は服用しないこと」の記載に当たることを示します。用法・用量で決まっている年齢は添付文書（PMDA）で確認してください",
  },
  under12: {
    name: "年齢",
    about:
      "厚労省通知の使用上の注意に、年齢についての記載があります。「15歳から」は「15歳未満の小児は服用しないこと」の記載に当たることを示します。用法・用量で決まっている年齢は添付文書（PMDA）で確認してください",
  },
  alcohol: {
    name: "飲酒",
    about: "厚労省通知の使用上の注意に、服用前後の飲酒についての記載があります",
  },
  caffeine: {
    name: "カフェイン",
    about: "カフェイン類を含みます。量は1回あたりを無水カフェインに換算した値です",
  },
  doping: {
    name: "ドーピング",
    about:
      "WADA（世界アンチ・ドーピング機構）の禁止表に載っている成分を含みます。競技に出る人に説明するときの材料です",
  },
};
