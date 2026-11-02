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
} as const;

export type UiCopyKey = keyof typeof UI_COPY;
