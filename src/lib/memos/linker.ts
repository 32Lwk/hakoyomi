// メモ本文のキーワードから、関連する公的通知（禁忌・併用・小児・運転等）をマッピングする簡易照合ロジック
// （高速かつ安全に、ベテランの言葉を公的根拠と結びつける）

export type MatchedNoticeLink = {
  label: string;
  category: "してはいけないこと" | "相談すること" | "用法用量";
  sourceText: string;
};

export function matchOfficialNoticesForMemo(memoBody: string): MatchedNoticeLink[] {
  const matches: MatchedNoticeLink[] = [];

  if (/15歳|小児|子ども|子供|年齢/i.test(memoBody)) {
    matches.push({
      label: "15歳未満服用禁止 / 年齢制限",
      category: "してはいけないこと",
      sourceText: "公的通知：小児・年齢制限の記載事項",
    });
  }

  if (/眠気|運転|機械/i.test(memoBody)) {
    matches.push({
      label: "乗物又は機械類の運転操作の禁止",
      category: "してはいけないこと",
      sourceText: "公的通知：運転注意成分（抗ヒスタミン等）",
    });
  }

  if (/胃|潰瘍|胃腸|空腹/i.test(memoBody)) {
    matches.push({
      label: "胃・十二指腸潰瘍の病歴",
      category: "してはいけないこと",
      sourceText: "公的通知：消化器系の禁忌・注意",
    });
  }

  if (/併用|重複|他の薬|かぜ薬|鎮痛/i.test(memoBody)) {
    matches.push({
      label: "他の解熱鎮痛薬・かぜ薬等との併用回避",
      category: "してはいけないこと",
      sourceText: "公的通知：同種成分の重複防止",
    });
  }

  if (/授乳|妊婦|妊娠/i.test(memoBody)) {
    matches.push({
      label: "授乳中・妊娠中の服用前相談",
      category: "相談すること",
      sourceText: "公的通知：妊婦・授乳婦の配慮事項",
    });
  }

  if (/アレルギー|ぜんそく|喘息/i.test(memoBody)) {
    matches.push({
      label: "アレルギー歴・ぜんそくの既往歴",
      category: "してはいけないこと",
      sourceText: "公的通知：アスピリン喘息等の禁忌",
    });
  }

  return matches;
}
