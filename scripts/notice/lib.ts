import { z } from "zod";
import { BadgeKind, Condition, NoticeItem, NoticeSection } from "@/lib/schema/notice";

// 通知PDF（厚労省「かぜ薬等の添付文書等に記載する使用上の注意について」）から構造化する範囲。
// 「添付文書等に記載すべき事項」だけを対象にし、「外部の容器又は外部の被包に記載すべき事項」は除く。
export const NOTICE_PDF = {
  file: "001742612",
  url: "https://www.mhlw.go.jp/content/001742612.pdf",
};

// 一般用漢方製剤は 36薬効群の通知に項がなく、別の通知で処方ごとに定められている（L-20261104-09）。
// 平成23年10月14日 薬食審査発1014第8号・薬食安発1014第7号の別添（令和3年5月13日一部改正までの統合版）
export const KAMPO_PDF = {
  file: "000240698",
  url: "https://www.pmda.go.jp/files/000240698.pdf",
};

type Section = z.infer<typeof NoticeSection>;

export type NoticeSource = {
  id: string;
  name: string;
  // 取り出す通知PDF。省略時は NOTICE_PDF
  pdf?: { file: string; url: string };
  // PDF のページ番号（1始まり、両端を含む）
  pages: [number, number];
  // 範囲の始まりを示す見出し（この行から）
  start: string;
  // 範囲の終わりを示す見出し（この行の手前まで）
  end: string;
  // 統合版より後の一部改正。切り出した原文の行を改正後の文面に置き換える
  amendments?: Amendment[];
};

export type Amendment = {
  // 改正通知（番号・日付・URL）
  notice: string;
  // 置き換える行（前後の空白を除いて一致する行が、範囲内にちょうど1つあること）
  before: string;
  // 改正後の行（複数行可）
  after: string[];
};

const KAMPO_AMENDMENT_R8 =
  "令和8年8月25日 医薬薬審発0825第5号・医薬安発0825第4号 https://www.mhlw.go.jp/content/001742613.pdf";

// デモSKUの漢方製剤の項。番号は通知の処方番号、頁は統合版 PDF の頁
const KAMPO_FORMULAS: [number, string, number, number, Amendment[]?][] = [
  // 胃腸薬・便秘薬のうち漢方処方のもの（L-20261104-16）
  [2, "安中散加茯苓", 10, 11],
  [20, "黄連解毒湯", 53, 54],
  [33, "葛根湯加川芎辛夷", 88, 89],
  [51, "桔梗湯", 136, 137],
  [76, "桂枝湯", 204, 205],
  [80, "桂枝茯苓丸", 215, 216],
  [107, "柴胡加竜骨牡蛎湯", 282, 284],
  [110, "柴胡桂枝湯", 291, 292],
  [144, "十味敗毒湯", 377, 378],
  [149, "小柴胡湯", 391, 392],
  [152, "小青竜湯", 399, 400],
  [189, "大黄甘草湯", 496, 497],
  [208, "釣藤散", 539, 540],
  [209, "猪苓湯", 542, 543],
  [235, "麦門冬湯", 608, 609],
  [
    262,
    "防風通聖散",
    674,
    675,
    [
      {
        notice: KAMPO_AMENDMENT_R8,
        before: "消化器 胃部不快感、はげしい腹痛を伴う下痢、腹痛",
        after: [
          "消化器 吐き気・嘔吐、食欲不振、胃部不快感、腹部膨満、はげしい腹痛を伴う下痢、腹痛",
          "精神神経系 めまい",
          "その他 発汗、動悸、むくみ、頭痛",
        ],
      },
      { notice: KAMPO_AMENDMENT_R8, before: "下痢", after: ["下痢、便秘"] },
    ],
  ],
  [264, "補中益気湯", 679, 680],
  [269, "麻黄湯", 691, 692],
  [270, "麻黄附子細辛湯", 694, 695],
  [271, "麻杏甘石湯", 696, 697],
  [273, "麻子仁丸", 702, 703],
  [289, "苓桂朮甘湯", 742, 743],
];

export function kampoGroupId(no: number): string {
  return `kampo_${String(no).padStart(3, "0")}`;
}

const KAMPO_SOURCES: NoticeSource[] = KAMPO_FORMULAS.map(([no, name, from, to, amendments]) => ({
  id: kampoGroupId(no),
  name: `一般用漢方製剤 ${no}．${name}`,
  pdf: KAMPO_PDF,
  pages: [from, to],
  // 見出しは全角数字（例「３３．葛根湯加川芎辛夷」）
  start: `${String(no).replace(/\d/g, (d) => String.fromCharCode(0xff10 + Number(d)))}．${name}`,
  end: "【外部の容器又は外部の被包に記載すべき事項】",
  amendments,
}));

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
  // デモSKUの残りの薬効群（L-20261104-16）
  {
    id: "ichoyaku_seisan",
    name: "胃腸薬（制酸薬を主体とする製剤）",
    pages: [29, 32],
    start: "Ⅰ．制酸薬を主体とする製剤",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "ichoyaku_kenni",
    name: "胃腸薬（健胃薬を主体とする製剤）",
    pages: [34, 37],
    start: "Ⅱ．健胃薬を主体とする製剤",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "ichoyaku_shisha",
    name: "胃腸薬（止瀉薬を主体とする製剤）",
    pages: [48, 52],
    start: "Ⅴ．止瀉薬を主体とする製剤",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "chinun",
    name: "鎮暈薬",
    pages: [68, 71],
    start: "６．鎮暈薬",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "ganka_ippan",
    name: "眼科用薬（一般点眼薬）",
    pages: [73, 74],
    start: "Ⅰ．一般点眼薬",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "ganka_kokin",
    name: "眼科用薬（抗菌性点眼薬）",
    pages: [75, 76],
    start: "Ⅱ．抗菌性点眼薬",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "ganka_jinko",
    name: "眼科用薬（人工涙液）",
    pages: [77, 78],
    start: "Ⅲ．人工涙液",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "ganka_sengan",
    name: "眼科用薬（洗眼薬）",
    pages: [81, 82],
    start: "Ⅴ．洗眼薬",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "vitamin_b1",
    name: "ビタミンＢ１主薬製剤",
    pages: [89, 90],
    start: "Ⅳ．ビタミンＢ１主薬製剤",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "vitamin_b2",
    name: "ビタミンＢ２主薬製剤",
    pages: [92, 93],
    start: "Ⅴ．ビタミンＢ２主薬製剤",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "vitamin_c",
    name: "ビタミンＣ主薬製剤",
    pages: [96, 97],
    start: "Ⅶ．ビタミンＣ主薬製剤",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "vitamin_b2b6",
    name: "ビタミンＢ２Ｂ６主薬製剤",
    pages: [100, 101],
    start: "Ⅸ．ビタミンＢ２Ｂ６主薬製剤",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "tenbi",
    name: "鼻炎用点鼻薬",
    pages: [118, 119],
    start: "１１．鼻炎用点鼻薬",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "gaiyo_jishitsu",
    name: "外用痔疾用薬",
    pages: [126, 129],
    start: "１３．外用痔疾用薬",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "mizumushi",
    name: "みずむし・たむし用薬",
    pages: [132, 133],
    start: "１４．みずむし･たむし用薬",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "chinyou_shoen",
    name: "鎮痒消炎薬",
    pages: [135, 136],
    start: "１５．鎮痒消炎薬",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "gaiyo_chintsu",
    name: "外用鎮痛消炎薬",
    pages: [138, 140],
    start: "１６．外用鎮痛消炎薬",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "allergy",
    name: "アレルギー用薬",
    pages: [158, 160],
    start: "８．アレルギー用薬",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "kanou_hifu",
    name: "化膿性皮膚疾患用薬（液剤，軟膏剤）",
    pages: [181, 182],
    start: "１４．化膿性皮膚疾患用薬（液剤，軟膏剤）",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "shimoyake",
    name: "しもやけ・あかぎれ用薬（軟膏剤，硬膏剤）",
    pages: [183, 184],
    start: "１５．しもやけ・あかぎれ用薬（軟膏剤，硬膏剤）",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  {
    id: "vitamin_hoken",
    name: "ビタミン含有保健薬（Ａ・Ｄ含有製剤を除く）",
    pages: [190, 190],
    start: "１８．ビタミン含有保健薬（Ａ・Ｄ含有製剤を除く）",
    end: "【外部の容器又は外部の被包に記載すべき事項】",
  },
  ...KAMPO_SOURCES,
];

export function sourcePdf(source: NoticeSource): { file: string; url: string } {
  return source.pdf ?? NOTICE_PDF;
}

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
  return applyAmendments(lines.slice(startAt, endAt < 0 ? undefined : endAt), source).join("\n");
}

function applyAmendments(lines: string[], source: NoticeSource): string[] {
  let out = lines;
  for (const a of source.amendments ?? []) {
    const at = out.flatMap((line, i) => (line.trim() === a.before ? [i] : []));
    if (at.length !== 1)
      throw new Error(`${source.id}: 改正前の行「${a.before}」が ${at.length} 行あります`);
    out = [...out.slice(0, at[0]), ...a.after, ...out.slice(at[0] + 1)];
  }
  return out;
}

// 抜き出しの照合用。PDF 抽出で入る空白・改行と全角半角の違い、語に付いた注番号（「高血圧１）」の「１）」）を無視する
export function compact(text: string): string {
  return text.normalize("NFKC").replace(/\s+/g, "").replace(/\d\)/g, "");
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
  // 漢方製剤の「血の道症とは…」の注記（L-20261104-09）
  効能又は効果に関連する注意: "kouno",
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

// 表の行で語ごとに記載条件が違うとき（「熱感１）２），疼痛１）」）は、その語だけを並べた本文になる。
// 語（読点・空白で区切る）が原文に順に出てくれば、原文から拾った語とみなす（L-20261104-16）
export function verbatimWords(text: string, source: string): boolean {
  const src = compact(source);
  let from = 0;
  for (const word of text.split(/[\s，,、]+/).map(compact).filter(Boolean)) {
    const at = src.indexOf(word, from);
    if (at < 0) return false;
    from = at + word.length;
  }
  return true;
}

function checkVerbatim(id: string, label: string, text: string, source: string, issues: Issue[]) {
  const fragments = verbatimFragments(text, source);
  if (!fragments && verbatimWords(text, source))
    issues.push({ id, problem: `${label}は原文の語を拾って並べている` });
  else if (!fragments) issues.push({ id, problem: `${label}が原文と一致しない` });
  else if (fragments.length > 1)
    issues.push({ id, problem: `${label}は原文の${fragments.length}箇所をつないでいる` });
}
