import { z } from "zod";
import { BadgeKind, Condition, NoticeItem, NoticeSection } from "@/lib/schema/notice";

// 通知PDF（厚労省「かぜ薬等の添付文書等に記載する使用上の注意について」）から構造化する範囲。
// 「添付文書等に記載すべき事項」だけを対象にし、「外部の容器又は外部の被包に記載すべき事項」は除く。
export const NOTICE_PDF = {
  file: "001742612",
  url: "https://www.mhlw.go.jp/content/001742612.pdf",
};

type Section = z.infer<typeof NoticeSection>;

export type NoticeSource = {
  id: string;
  name: string;
  // PDF のページ番号（1始まり、両端を含む）
  pages: [number, number];
  // 範囲の始まりを示す見出し（この行から）
  start: string;
  // 範囲の終わりを示す見出し（この行の手前まで）
  end: string;
};

export const NOTICE_SOURCES: NoticeSource[] = [
  {
    id: "kaze_1",
    name: "かぜ薬（生薬のみからなる製剤を除く）",
    pages: [5, 10],
    start: "Ⅰ．かぜ薬（生薬のみからなる製剤を除く）",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "genetsu_chintsu",
    name: "解熱鎮痛薬",
    pages: [16, 20],
    start: "２．解熱鎮痛薬",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "chinga_kyotan",
    name: "鎮咳去痰薬",
    pages: [22, 26],
    start: "３．鎮咳去痰薬",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "bien_naifuku",
    name: "鼻炎用内服薬",
    pages: [120, 123],
    start: "１２．鼻炎用内服薬",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "nemuke_boshi",
    name: "眠気防止薬（カフェイン主薬製剤）",
    pages: [146, 147],
    start: "２．眠気防止薬（カフェイン主薬製剤）",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "abuse_prevention",
    name: "指定濫用防止医薬品に係る使用上の注意",
    pages: [195, 195],
    start: "Ⅲ. 指定濫用防止医薬品に係る使用上の注意",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
];

export type PageText = { page: number; text: string };

// ページのテキストから対象範囲を切り出す。ページ番号だけの行は落とす
export function sliceSource(pages: PageText[], source: NoticeSource): string {
  const [from, to] = source.pages;
  const lines = pages
    .filter((p) => p.page >= from && p.page <= to)
    .flatMap((p) => p.text.split("\n"))
    .filter((line) => !/^\s*\d+\s*$/.test(line));
  const startAt = lines.findIndex((line) => line.trim() === source.start);
  if (startAt < 0) throw new Error(`${source.id}: 見出し「${source.start}」が見つかりません`);
  const endAt = lines.findIndex((line, i) => i > startAt && line.trim() === source.end);
  return lines.slice(startAt, endAt < 0 ? undefined : endAt).join("\n");
}

// 抜き出しの照合用。PDF 抽出で入る空白・改行と全角半角の違いを無視する
export function compact(text: string): string {
  return text.normalize("NFKC").replace(/\s+/g, "");
}

export function isVerbatim(text: string, source: string): boolean {
  return compact(source).includes(compact(text));
}

const MIN_FRAGMENT = 4;

// 原文の離れた箇所をつないだ抜き出し（例：見出し＋「２）」の書き分け）を、原文の順に並ぶ断片に分ける。
// 断片が見つからなければ null
export function verbatimFragments(text: string, source: string): string[] | null {
  const src = compact(source);
  const target = compact(text);
  const fragments: string[] = [];
  let from = 0;
  let i = 0;
  while (i < target.length) {
    let length = 0;
    let at = -1;
    while (i + length < target.length) {
      const found = src.indexOf(target.slice(i, i + length + 1), from);
      if (found < 0) break;
      length += 1;
      at = found;
    }
    // 短い断片は、言い換えた文が偶然あちこちの字に当たっているだけなので一致とみなさない
    if (length < MIN_FRAGMENT && i + length < target.length) return null;
    if (length === 0) return null;
    fragments.push(target.slice(i, i + length));
    from = at + length;
    i += length;
  }
  return fragments;
}

// その他の小見出しは項目 id で使えるよう短い英字にする
const SUBHEADING_CODE: Record<string, string> = {
  用法及び用量に関連する注意: "youho",
  成分及び分量に関連する注意: "seibun",
  保管及び取扱い上の注意: "hokan",
  その他の注意: "sonota",
  // 指定濫用防止の注意は「注意事項の最後に，続き番号として記載」（通知 Ⅲ）
  続き番号: "last",
};

const SECTION_CODE: Record<Section, string> = {
  してはいけないこと: "ng",
  相談すること: "sd",
  その他: "etc",
};

// 項目 id：薬効群-区分-項目番号（例：kaze_1-ng-1-3）。fixtures の既存 id と同じ形
export function itemId(groupId: string, section: Section, itemNo: string): string {
  const coded = Object.entries(SUBHEADING_CODE).reduce(
    (no, [heading, code]) => no.replaceAll(heading, `${code}-`),
    itemNo.normalize("NFKC"),
  );
  const slug = coded.replace(/[^0-9A-Za-z']+/g, "-").replace(/^-+|-+$/g, "");
  return `${groupId}-${SECTION_CODE[section]}-${slug}`;
}

// 小見出しの置き換え後に英数字・記号以外が残る項目番号は、id にすると情報が落ちる
function itemIdIsExact(itemNo: string): boolean {
  const coded = Object.keys(SUBHEADING_CODE).reduce(
    (no, heading) => no.replaceAll(heading, ""),
    itemNo.normalize("NFKC"),
  );
  return !/[^\x00-\x7F]/.test(coded);
}

// Claude に返させる形。Condition は再帰型なので JSON 文字列で受け取り、コード側で検証する
export const DraftItem = z.object({
  section: NoticeSection,
  itemNo: z.string(),
  body: z.string(),
  conditionText: z.string().nullable(),
  conditionJson: z.string(),
  excludedBy: z.array(z.object({ section: NoticeSection, itemNo: z.string() })),
  badge: BadgeKind.nullable(),
  needsReview: z.boolean(),
  reviewNote: z.string().nullable(),
});
export type DraftItem = z.infer<typeof DraftItem>;

export const DraftOutput = z.object({ items: z.array(DraftItem) });

export type Issue = { id: string; problem: string };

// Claude の下書きを NoticeItem にする。照合で落ちた点は issues に積み、ゆうの検証（T102）で見る
export function toNoticeItems(
  groupId: string,
  drafts: DraftItem[],
  source: string,
): { items: NoticeItem[]; issues: Issue[] } {
  const issues: Issue[] = [];
  const items: NoticeItem[] = [];
  const seen = new Set<string>();

  for (const draft of drafts) {
    const id = itemId(groupId, draft.section, draft.itemNo);
    if (seen.has(id)) issues.push({ id, problem: "項目 id が重複" });
    seen.add(id);

    // 記載条件の注記だけの見出し（例「小児の用法がある場合，…そのいずれかを記載すること」）は項目にしない
    if (!draft.body.trim()) {
      issues.push({
        id,
        problem: `本文がない（記載条件のみ）ため項目にしない：${draft.conditionText ?? ""}`,
      });
      continue;
    }

    if (!itemIdIsExact(draft.itemNo))
      issues.push({ id, problem: `項目番号を id にできない：${draft.itemNo}` });
    checkVerbatim(id, "本文", draft.body, source, issues);
    if (draft.conditionText) checkVerbatim(id, "記載条件", draft.conditionText, source, issues);

    let condition: Condition = { always: true };
    try {
      condition = Condition.parse(JSON.parse(draft.conditionJson));
    } catch {
      issues.push({ id, problem: `条件式が不正：${draft.conditionJson}` });
    }

    const excludedBy = draft.excludedBy.map((ref) => itemId(groupId, ref.section, ref.itemNo));
    items.push(
      NoticeItem.parse({
        id,
        groupId,
        section: draft.section,
        itemNo: draft.itemNo,
        body: draft.body,
        condition,
        conditionText: draft.conditionText,
        excludedBy,
        badge: draft.badge ?? undefined,
        needsReview: draft.needsReview,
      }),
    );
    if (draft.needsReview)
      issues.push({ id, problem: `要確認：${draft.reviewNote ?? "（理由なし）"}` });
  }

  for (const item of items) {
    for (const ref of item.excludedBy)
      if (!seen.has(ref)) issues.push({ id: item.id, problem: `除外先 ${ref} が存在しない` });
  }
  return { items, issues };
}

function checkVerbatim(id: string, label: string, text: string, source: string, issues: Issue[]) {
  const fragments = verbatimFragments(text, source);
  if (!fragments) issues.push({ id, problem: `${label}が原文と一致しない` });
  else if (fragments.length > 1)
    issues.push({ id, problem: `${label}は原文の${fragments.length}箇所をつないでいる` });
}
