import {
  EFFICACY_MARKS,
  EFFICACY_STANDARDS,
  type EfficacyStandard,
} from "@/data/efficacy_standards";
import { normalizeName } from "@/lib/rules/normalize";
import type { BadgeKind } from "@/lib/schema/notice";

// 逆引き（T302、L-20261103-41）。自由入力を「承認基準の効能・効果の語」と「含まない条件」に対応づけ、
// 薬効群の承認基準の範囲に入る商品をコードで絞る。順位は付けない（rules §4-7）

export type EfficacyTerm = { id: string; word: string; standardId: string };

// 逆引きで「含まない」に使える条件（さがす画面の「含まない」と同じ）
export const REVERSE_EXCLUDE = [
  "drive",
  "caffeine",
  "abuse",
  "doping",
] as const satisfies readonly BadgeKind[];
export type ReverseExclude = (typeof REVERSE_EXCLUDE)[number];

export type ReverseSelection = { termIds: string[]; exclude: ReverseExclude[] };

// 対応づけの結果（画面に返すもの）。文は Claude が書かず、こちらの一覧から選んだものだけ
export type ReverseResult = {
  terms: (EfficacyTerm & { standard: string })[];
  exclude: ReverseExclude[];
  // claude：Claude の対応づけ／keyword：Claude を使わない語の一致（API キーがない・失敗したとき）
  via: "claude" | "keyword";
};

export function allTerms(standards: EfficacyStandard[] = EFFICACY_STANDARDS): EfficacyTerm[] {
  return standards.flatMap((s) =>
    s.terms.map((t) => ({ id: t.id, word: t.word, standardId: s.id })),
  );
}

export function standardOf(id: string): EfficacyStandard | undefined {
  return EFFICACY_STANDARDS.find((s) => s.id === id);
}

// 一覧にない id・条件は捨てる（Claude の出力をそのまま信じない）
export function resolve(selection: ReverseSelection, via: ReverseResult["via"]): ReverseResult {
  const byId = new Map(allTerms().map((t) => [t.id, t]));
  const terms = [...new Set(selection.termIds)].flatMap((id) => {
    const term = byId.get(id);
    const standard = term && standardOf(term.standardId);
    return term && standard ? [{ ...term, standard: standard.name }] : [];
  });
  const exclude = [...new Set(selection.exclude)].filter((k): k is ReverseExclude =>
    (REVERSE_EXCLUDE as readonly string[]).includes(k),
  );
  return { terms, exclude, via };
}

// Claude を使わない対応づけ：入力と語（または照合の語）の一方がもう一方を含むとき（例：「生理痛」→「月経痛（生理痛）」）
export function keywordSelection(query: string): ReverseSelection {
  const q = normalizeName(query);
  if (!q) return { termIds: [], exclude: [] };
  const termIds = EFFICACY_STANDARDS.flatMap((s) => s.terms)
    .filter((t) =>
      [t.word, ...t.keys].some((k) => {
        const w = normalizeName(k);
        return w.includes(q) || (w.length >= 2 && q.includes(w));
      }),
    )
    .map((t) => t.id);
  return { termIds, exclude: [] };
}

// 商品が選んだ語に当たるか。薬効群がその承認基準の対象で、かつ商品の効能・効果にも同じ語がある（EFFICACY_MARKS）とき
export function matchedTerms(
  product: { id: string; noticeGroupId: string },
  terms: ReverseResult["terms"],
): ReverseResult["terms"] {
  const marked = EFFICACY_MARKS[product.id] ?? [];
  return terms.filter(
    (t) =>
      standardOf(t.standardId)?.noticeGroupIds.includes(product.noticeGroupId) &&
      marked.includes(t.id),
  );
}
