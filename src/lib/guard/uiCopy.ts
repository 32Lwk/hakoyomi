import type { BadgeKind } from "@/lib/schema/notice";

// 画面の固定文言はここからだけ使う（rules §4-3）。src 全体の禁止語スキャンの対象
export const UI_COPY = {
  chooseNotice: "この中から選ぶのは販売者です",
  noticeDerived:
    "この商品の成分から導いた通知上の記載事項です。実際の添付文書は PMDA で確認してください",
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
    "この薬効群の使用上の注意（厚労省通知）は、まだアプリに取り込んでいません。添付文書（PMDA）で確認してください",
  badgeRowHint: "タップで説明・根拠",
  badgeUnloadedShort: "未収録（通知を未取り込み）",
  addToCompare: "比べるに追加",
  compareFull: "比べられるのは4品までです。外してから追加してください",
  findPlaceholder: "品名・メーカー・JANで探す",
  demoList: "デモ商品",
  readList: "読んだ商品",
  readMark: "読んだ",
  backToList: "商品一覧",
  openShelf: "棚で見る",
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
