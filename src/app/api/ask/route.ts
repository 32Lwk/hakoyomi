import type { NextRequest } from "next/server";
import {
  answerWithClaude,
  conditionNote,
  interpretWithClaude,
  reviewWithClaude,
} from "@/lib/ask/claude";
import { generalPassages, productPassages } from "@/lib/ask/corpus";
import { expandQuery, fallbackAnswers, retrieve, verifyCitations } from "@/lib/ask/select";
import { checkSummary, type SummaryDraft, type SummarySentence } from "@/lib/ask/summary";
import { allProducts, findById, productViews, type ProductView } from "@/lib/catalog";
import { compareBadges, compareRows } from "@/lib/compare";
import { guardAll } from "@/lib/guard/guard";
import { BADGE_INFO } from "@/lib/guard/uiCopy";
import { encodeEvent, NDJSON, type AskEvent, type AskStage } from "@/lib/ask/stages";
import { normalizeName } from "@/lib/rules/normalize";

// 質問エージェント（T301、L-20261103-43/44）：
// ①解釈（Claude、続きの質問のみ：会話を踏まえた質問と検索語）→ ②検索（コード：BM25＋語の一致）→
// ③照合（Claude：番号・原文の抜き出し・番号つきの説明文）→ ④出典検証（コード）→
// ⑤guard（禁止語・数値の照合・Claude 自己検査）。抜き出し＋出典が主、説明文は従。
// 質問文・会話は保存・ログしない（会話は画面が持ち、毎回送ってくる）
// 比べる質問（違い・比較など）。2品以上なら、比べるの画面と同じ材料で違う行だけの表をコードで作る（L-20261104-09）
// 「何が違う？」（聞けることの一覧・design §2）も比べる質問にする
const COMPARE = /比較|比べ|違い|違う|差|異な|共通|同じ|どっち|どちら/;

function diffTable(views: ProductView[]) {
  const rows = [
    ...compareRows(views.map((v) => v.product)).map((r) => ({
      label: r.label,
      // 分量のない成分は「不明」ではなく「配合」（量は未登録。L-20261104-11）
      cells: r.cells.map((c) =>
        c.kind === "none"
          ? "—"
          : c.uncertain
            ? "添付文書で確認"
            : c.text === "不明"
              ? "配合（量は未登録）"
              : c.text,
      ),
      diff: r.diff,
      // 成分の行（リスク区分・1日最大量・内容量は除く）
      ingredient: !["risk", "basis", "content"].includes(r.key),
    })),
    ...compareBadges(views.map((v) => v.badges)).map((b) => {
      const cells = b.labels.map(
        (label, i) => label ?? (views[i].unrecorded.includes(b.kind) ? "未収録" : "—"),
      );
      return {
        label: BADGE_INFO[b.kind].short ?? BADGE_INFO[b.kind].name,
        cells,
        diff: new Set(cells).size > 1,
        ingredient: false,
      };
    }),
  ];
  return {
    productIds: views.map((v) => v.product.id),
    rows: rows
      .filter((r) => r.diff)
      .map(({ label, cells, ingredient }) => ({
        label,
        cells,
        ingredient,
      })),
    same: rows.filter((r) => !r.diff).map((r) => r.label),
  };
}

// 比べる質問の結論は、表からコードで作る（「〜だけに入っている」は Claude の自己検査では確かめられないため）。
// 片方にだけ入っている成分を先に、ほかに違う項目を後に
function diffConclusion(
  views: ProductView[],
  table: ReturnType<typeof diffTable>,
): SummarySentence {
  if (!table.rows.length) return { text: "比べた項目に違いはありません。", refs: [] };
  const only = views
    .map((v, i) => ({
      name: v.product.name,
      names: table.rows
        .filter((r) => r.ingredient && r.cells[i] !== "—" && r.cells.some((c) => c === "—"))
        .map((r) => r.label),
    }))
    .filter((o) => o.names.length);
  const others = table.rows
    .filter((r) => !only.some((o) => o.names.includes(r.label)))
    .map((r) => r.label);
  // 文が長くなりすぎないよう、並べるのは3つ（ほかの項目は4つ）まで。全部は表で見せる
  const list = (names: string[], max: number) =>
    names.length > max ? `${names.slice(0, max).join("・")}など` : names.join("・");
  const parts = [
    ...only.map((o) => `${o.name}だけに${list(o.names, 3)}が入っています`),
    ...(others.length ? [`${only.length ? "ほかに" : ""}${list(others, 4)}が違います`] : []),
  ];
  return { text: `${parts.join("。")}。`, refs: [] };
}

// 出典名に出てくる項目（通知「使用上の注意」・添付文書による補正）。商品の入力値は「成分・分量」
const SECTIONS = ["してはいけないこと", "相談すること", "その他"] as const;
function sectionsOf(label: string): string[] {
  const hit = SECTIONS.filter((s) => label.includes(s));
  if (hit.length) return hit;
  if (label.includes("入力値")) return ["成分・分量"];
  if (label.includes("効能・効果")) return ["効能・効果"];
  return label.includes("成分の照合") ? ["成分の照合"] : [];
}

// 商品が2つ以上で結論の文が検査を通らなかったとき、検査済みの行から結論をコードで出す（L-20261104-02/04）
function rowsConclusion(
  rows: { name: string; cell: SummarySentence | null }[],
): SummarySentence | null {
  const found = rows.filter((t) => t.cell);
  if (rows.length < 2 || !found.length) return null;
  const missing = rows.filter((t) => !t.cell).map((t) => t.name);
  return {
    text:
      missing.length === 0
        ? `${rows.length}品とも記載があります。`
        : `${found.map((t) => t.name).join("・")}に記載があります（${missing.join("・")}には見つかりません）。`,
    refs: [...new Set(found.flatMap((t) => t.cell?.refs ?? []))].sort((a, b) => a - b),
  };
}

type AskInput = { q?: unknown; ids?: unknown; history?: unknown } | null;
type AskReply = Awaited<ReturnType<typeof answer>>;

// 既定は今までどおり JSON。Accept: application/x-ndjson のときは段階の終わりごとに1行送り、最後に同じ答えを送る（L-20261104-15）
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as AskInput;
  if (!request.headers.get("accept")?.includes(NDJSON)) return Response.json(await answer(body));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 画面を閉じて切れた後は送れないので、送れなくても処理は止めない
      let open = true;
      const send = (event: AskEvent<AskReply>) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(encodeEvent(event)));
        } catch {
          open = false;
        }
      };
      // Safari は最初の約1KBがたまるまで画面に渡さないので、空白の行で埋める（受け手は空白の行を読み飛ばす）
      if (open) controller.enqueue(encoder.encode(`${" ".repeat(1024)}\n`));
      try {
        const reply = await answer(body, (stage) => send({ type: "stage", ...stage }));
        send({ type: "result", reply });
      } catch (error) {
        // 途中で失敗したら error の行で終える（画面は今までの失敗の表示にする）。質問文はログに出さない
        console.error("ask: 途中で失敗", error instanceof Error ? error.message : error);
        send({ type: "error" });
      }
      if (open) controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": `${NDJSON}; charset=utf-8`,
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}

// emit：段階が終わるたびに、その段階の実際の件数を渡す
async function answer(body: AskInput, emit: (stage: AskStage) => void = () => {}) {
  const q = typeof body?.q === "string" ? body.q.trim().slice(0, 200) : "";
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((id): id is string => typeof id === "string").slice(0, 4)
    : [];
  const history = Array.isArray(body?.history)
    ? body.history
        .filter((h): h is string => typeof h === "string")
        .slice(-4)
        .map((h) => h.trim().slice(0, 200))
    : [];
  if (!q)
    return {
      answers: [],
      conclusion: null,
      points: [],
      rows: [],
      table: null,
      followups: [],
      products: [],
      via: "keyword" as "claude" | "keyword",
    };

  // 商品を選ばずに聞いて、質問に品名がそのまま出ているときは、その商品の根拠も足す（2品まで）
  const chosen = (await Promise.all(ids.map(findById))).filter((p) => p !== null);
  const mentioned = chosen.length
    ? []
    : (await allProducts())
        .filter((p) => {
          const name = normalizeName(p.name);
          return name.length >= 3 && normalizeName([...history, q].join("")).includes(name);
        })
        .slice(0, 2);
  const views = await productViews(chosen.length ? chosen : mentioned);
  const products = views.map((v) => v.product.name);

  // 解釈は会話の続きのときだけ（最初の質問は同義語の展開と BM25 で足り、15秒以内に収めるため。prd §7）
  const interpretation = history.length ? await interpretWithClaude(q, history, products) : null;
  const question = interpretation?.question.trim() || q;
  if (history.length)
    emit({ stage: "interpret", ok: interpretation !== null, rewritten: question !== q });
  const query = expandQuery([question, ...(interpretation?.terms ?? [])].join(" "));

  const passages = [
    ...(views.length ? await productPassages(views) : []),
    ...(chosen.length ? [] : await generalPassages()),
  ];
  // 商品の根拠は1品あたり数十件なので、商品ごとはほぼすべて Claude に渡す（比較で取りこぼさない。L-20261104-09）
  const retrieved = retrieve(query, passages, { perProduct: 40 });
  const candidates = retrieved.map((r) => r.passage);
  emit({ stage: "search", candidates: candidates.length });

  const selection = candidates.length
    ? await answerWithClaude(question, candidates, products)
    : null;
  const answers = selection
    ? verifyCitations(selection.citations, candidates)
    : fallbackAnswers(retrieved);
  emit({
    stage: "match",
    via: selection ? "claude" : "keyword",
    selected: selection ? selection.citations.length : answers.length,
  });
  if (selection)
    emit({
      stage: "verify",
      matched: answers.length,
      discarded: selection.citations.length - answers.length,
    });

  // 抜き出しは原文だが、素通しの経路を作らない（rules §4-2）
  const quoteGuard = guardAll(answers.map((a) => a.text));
  const shown = answers.filter((a) => quoteGuard.passed.includes(a.text));

  // 説明文（結論・要点・商品ごと。L-20261104-02）：番号と数値の検査（コード）→ 禁止語 → 自己検査。
  // 自己検査できなければ出さない。商品ごとの文は、その商品の根拠（p{列}-…）だけを指せる
  type Draft = {
    part: "conclusion" | "point" | "product";
    productId: string | null;
  } & SummaryDraft;
  const drafts: Draft[] = selection
    ? [
        ...(selection.conclusion
          ? [{ ...selection.conclusion, part: "conclusion" as const, productId: null }]
          : []),
        // 要点は「詳しく見る」に出す（商品があるときも。L-20261104-18）
        ...selection.points.map((p) => ({
          ...p,
          part: "point" as const,
          productId: null,
        })),
        ...(views.length ? selection.byProduct : []).flatMap((p) => {
          const col = Number(p.product.replace(/^p/, "")) - 1;
          const view = views[col];
          if (!view || !p.ids.every((id) => id.startsWith(`${p.product}-`))) return [];
          return [
            { text: p.text, ids: p.ids, part: "product" as const, productId: view.product.id },
          ];
        }),
      ]
    : [];
  let kept: (Draft & SummarySentence)[] = [];
  // 段階表示の件数（ガード）。根拠が1件も残らなければ説明文は番号の照合で落ちる扱い
  let blockedText = 0;
  let blockedNumbers = shown.length ? 0 : drafts.length;
  let reviewedCount = 0;
  let blockedReview: number | null = 0;
  if (drafts.length && shown.length) {
    const checked = drafts.flatMap((d) =>
      checkSummary([d], shown, candidates).map((c) => ({ ...d, ...c })),
    );
    const textGuard = guardAll(checked.map((s) => s.text));
    const clean = checked.filter((s) => textGuard.passed.includes(s.text));
    const reviewed = await reviewWithClaude(
      clean.map((s) => ({
        text: s.text,
        quotes: s.refs.map((r) => {
          const a = shown[r - 1];
          // 商品の根拠には商品名を添える（「ロキソニンSは〜」の文を検査できるように）
          const name = views.find((v) => v.product.id === a.productId)?.product.name;
          return `${name ? `【${name}】` : ""}${a.text}${conditionNote(a)}（出典：${a.source.label}）`;
        }),
      })),
    );
    kept = reviewed ? clean.filter((_, i) => reviewed.has(i)) : [];
    blockedText = textGuard.blocked.length;
    blockedNumbers = drafts.length - checked.length;
    reviewedCount = clean.length;
    blockedReview = reviewed ? clean.length - kept.length : null;
    const dropped = drafts.length - kept.length;
    if (dropped)
      console.warn(
        `ask: 説明文 ${dropped} 文を差し止め（番号・数値 ${drafts.length - checked.length}・禁止語 ${textGuard.blocked.length}・自己検査 ${reviewed ? clean.length - kept.length : "不可"}）`,
      );
  }
  const sentence = ({ text, refs }: SummarySentence): SummarySentence => ({ text, refs });
  const conclusion: SummarySentence | undefined = kept.find((s) => s.part === "conclusion");
  const points = kept
    .filter((s) => s.part === "point")
    .slice(0, 3)
    .map(sentence);
  // 商品ごとの行（1品でも）。どの項目にあるかのタグは、その商品の根拠の出典名からコードで出す（L-20261104-04）。
  // 根拠のない商品は cell を空にし、画面が「記載が見つかりません」と出す
  const rows = views.map((v) => {
    const cell = kept.find((s) => s.part === "product" && s.productId === v.product.id);
    const own = shown.filter((a) => a.productId === v.product.id);
    return {
      productId: v.product.id,
      name: v.product.name,
      cell: cell ? sentence(cell) : null,
      sections: [...new Set(own.flatMap((a) => sectionsOf(a.source.label)))],
    };
  });
  if (quoteGuard.blocked.length)
    console.warn(`ask: guard で抜き出し ${quoteGuard.blocked.length} 件を差し止め`);

  // 続けて聞ける質問（L-20261104-01）：短いものだけ、禁止語 guard を通す
  const followupGuard = guardAll(
    (selection?.followups ?? []).map((f) => f.trim()).filter((f) => f && f.length <= 40),
  );
  const followups = followupGuard.passed.slice(0, 3);
  emit({
    stage: "guard",
    regex: quoteGuard.blocked.length + blockedText + followupGuard.blocked.length,
    numbers: blockedNumbers,
    reviewed: reviewedCount,
    review: blockedReview,
  });

  const table = views.length > 1 && COMPARE.test(`${q} ${question}`) ? diffTable(views) : null;

  return {
    answers: shown,
    // 1品で結論の文が検査を通らなかったときは、検査済みの商品ごとの文を結論にする（L-20261104-12）
    conclusion: table
      ? diffConclusion(views, table)
      : conclusion
        ? sentence(conclusion)
        : rows.length === 1 && rows[0].cell
          ? rows[0].cell
          : rowsConclusion(rows),
    points,
    table: table && { ...table, rows: table.rows.map(({ label, cells }) => ({ label, cells })) },
    // name は結論を作るためだけ。画面には productId で渡す
    rows: rows.map(({ productId, cell, sections }) => ({ productId, cell, sections })),
    // 会話の続きを直した質問（元の質問と同じなら出さない）
    question: question !== q ? question : null,
    followups,
    // 答えの対象の商品（画面で写真・表の見出しに使う。L-20261104-01/02）
    products: views.map((v) => ({ id: v.product.id, name: v.product.name, kind: v.product.kind })),
    via: (selection ? "claude" : "keyword") as "claude" | "keyword",
  };
}
