// 画面の固定文言はここからだけ使う（rules §4-3）。src 全体の禁止語スキャンの対象
export const UI_COPY = {
  judgeNotice: "判断は販売者が行ってください",
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
  demoData: "デモ・架空データ",
  demoProducts: "表示中の商品は画面確認用の架空品です（実在の商品ではありません）",
  invalidJan: "JANの桁数かチェックデジットが合いません。入力し直してください",
  readError: "読み取れませんでした。もう一度読むか、JANを入力してください",
  cameraUnavailable: "カメラを使えません。JANを入力するか、品名で検索してください",
  addedToCompare: "比べるに追加しました",
  needTwo: "比べるには2品以上を読んでください",
  sortedByName: "品名順に並べています（順位ではありません）",
} as const;

export type UiCopyKey = keyof typeof UI_COPY;
