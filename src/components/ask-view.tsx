"use client";

import {
  Check,
  ChevronRight,
  ExternalLink,
  Loader2,
  RotateCcw,
  ScanBarcode,
  Send,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HEADER_ACTION_ID } from "@/components/app-header";
import { MemoList, type MemoListResponse } from "@/components/memo-section";
import type { Memo } from "@/lib/memos/memo";
import { ProductImage } from "@/components/product-image";
import { useStack } from "@/components/stack-provider";
import type { Answer } from "@/lib/ask/select";
import {
  NDJSON,
  nextStage,
  splitEvents,
  STAGE_LABEL,
  STAGE_RUNNING,
  stageDetail,
  type AskStage,
} from "@/lib/ask/stages";
import type { SummarySentence } from "@/lib/ask/summary";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { cn } from "@/lib/utils";
import { normalizeName } from "@/lib/rules/normalize";
import type { MedicineKind } from "@/lib/schema/product";

// よく聞かれることの入口。答えは記載からだけ（判断はしない）
const PRODUCT_QUESTIONS = [
  "運転について書いてある？",
  "授乳中について書いてある？",
  "何歳から？",
  "カフェインは入っている？",
  "指定濫用防止の対象？",
  "成分は何のために入っている？",
];
const GENERAL_QUESTIONS = [
  "イブプロフェンは何のための成分？",
  "15歳未満について書いてある記載は？",
  "指定濫用防止医薬品の成分は？",
  "ドーピングの禁止成分は？",
];
// 聞けること（L-20261104-15）：今の根拠（通知・商品の事実・手引きの配合目的・照合リスト）で答えられる種類だけ。
// need：押せるのに要る商品の数
const ASKABLE: { title: string; need: number; texts: string[] }[] = [
  {
    title: "商品について",
    need: 1,
    texts: [
      "運転について書いてある？",
      "授乳中について書いてある？",
      "何歳から？",
      "カフェインは入っている？",
      "指定濫用防止の対象？",
      "成分は何のために入っている？",
    ],
  },
  { title: "比べる", need: 2, texts: ["何が違う？"] },
  {
    title: "成分・制度",
    need: 0,
    texts: [
      "ドーピングの禁止成分は？",
      "指定濫用防止医薬品の成分は？",
      "イブプロフェンは何のための成分？",
      "15歳未満について書いてある記載は？",
    ],
  },
];
const MAX_TOPICS = 4;
// 下に固定の入力欄。下部の列にくっつける：main の下の余白（9rem）のうち下部の列（4rem）を超える分を詰める。
// 中央の探すの丸は下部の列から上にはみ出るので、その分だけ下をあける（pb-8）
const COMPOSER_BAR =
  "sticky bottom-[calc(4rem+1px+env(safe-area-inset-bottom))] z-10 -mx-4 mt-auto -mb-20 flex flex-col gap-1.5 border-t border-border bg-background/95 px-4 pt-2 pb-8 backdrop-blur";

type Item = { id: string; name: string; kind: MedicineKind };
type Reply = {
  answers: Answer[];
  conclusion: SummarySentence | null;
  points: SummarySentence[];
  rows: { productId: string; cell: SummarySentence | null; sections: string[] }[];
  // 比べる質問のとき、違う行だけの表（コードで作る）
  table: {
    productIds: string[];
    rows: { label: string; cells: string[] }[];
    same: string[];
  } | null;
  followups: string[];
  question: string | null;
  products: Item[];
  via: "claude" | "keyword";
};
// stages：実際に終わった段階（/api/ask が送ってきた順）。followup：解釈の段階が動く（会話の続き）
type Turn = {
  question: string;
  topics: Item[];
  reply: Reply | null;
  failed: boolean;
  stages: AskStage[];
  followup: boolean;
};

// 打った語が品名に含まれる商品か、品名が質問に出てくる商品
function matchProducts(all: Item[], text: string, limit = 12): Item[] {
  const q = normalizeName(text);
  if (!q) return [];
  return all
    .filter((p) => {
      const name = normalizeName(p.name);
      return name.includes(q) || (name.length >= 3 && q.includes(name));
    })
    .slice(0, limit);
}

// 質問（T301、L-20261103-43/44・L-20261104-01/02）。チャット：上にやりとり、下に入力欄。
// 入力欄の枠の中に話題の商品（画像つきバッジ）、左に JAN、上に品名の合う商品・選んでいる商品。
// 話題がなければ通知・手引き全体から答える。やりとりは画面の中だけで持ち、保存しない
export function AskView() {
  const initialId = useSearchParams().get("id");
  const { ids, setScannerOpen, setScanHandler } = useStack();
  const [all, setAll] = useState<Item[]>([]);
  const [topicIds, setTopicIds] = useState<string[]>(initialId ? [initialId] : []);
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const loading = turns.some((t) => !t.reply && !t.failed);
  const lastTurnRef = useRef<HTMLLIElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((res) => res.json() as Promise<{ results: Item[] }>)
      .then((data) => {
        if (!cancelled) setAll(data.results);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // JAN で読めた商品は、この画面にいる間は話題に足す（L-20261104-02）
  useEffect(() => {
    setScanHandler((id) =>
      setTopicIds((prev) =>
        prev.includes(id) || prev.length >= MAX_TOPICS ? prev : [...prev, id],
      ),
    );
    return () => setScanHandler(null);
  }, [setScanHandler]);

  // 質問を送ったら、その質問をヘッダーのすぐ下に出し、答えはその下に出す（答えが来ても動かさない。L-20261104-15）。
  // 最後まで動かすと長い答えの終わりから見え、最初の画面からの切り替えではページの先頭に飛んでいた
  const turnCount = turns.length;
  useEffect(() => {
    if (!turnCount) return;
    // 前のやりとりの高さが変わったあとの配置で測る（同じ描画の中で測るとずれる）
    const id = requestAnimationFrame(() => {
      const el = lastTurnRef.current;
      if (!el) return;
      const header = 56;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - header });
    });
    return () => cancelAnimationFrame(id);
  }, [turnCount]);

  // 入力欄は1行から、打った分だけ伸ばす（5行まで）
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [q]);

  const byId = useMemo(() => new Map(all.map((p) => [p.id, p])), [all]);
  const topics = topicIds.map((id) => byId.get(id)).filter((p) => p !== undefined);
  const shelf = (
    q.trim() ? matchProducts(all, q) : ids.map((id) => byId.get(id)).filter((p) => p !== undefined)
  ).filter((p) => !topicIds.includes(p.id));

  // focus：入力欄の上の列から選んだときだけ入力欄に移る（一覧から何品か選ぶときにキーボードを出さない）
  function pick(p: Item, focus = true) {
    if (topicIds.length >= MAX_TOPICS) return;
    setTopicIds([...topicIds, p.id]);
    // 品名を打って探していたときは、その語を消して質問を打てるようにする
    if (q && normalizeName(p.name).includes(normalizeName(q))) setQ("");
    // 最初の画面からチャットの形に切り替わると入力欄が作り直されるので、描いた後に合わせる
    if (focus) requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function ask(question: string) {
    const text = question.trim();
    if (!text || loading) return;
    // 会話の続きに使うのは前の質問だけ（直した質問があればそれ）
    const history = turns
      .filter((t) => t.reply)
      .map((t) => t.reply?.question ?? t.question)
      .slice(-4);
    const index = turns.length;
    setTurns((list) => [
      ...list,
      {
        question: text,
        topics,
        reply: null,
        failed: false,
        stages: [],
        followup: history.length > 0,
      },
    ]);
    setQ("");
    const update = (fn: (t: Turn) => Turn) =>
      setTurns((list) => list.map((t, i) => (i === index ? fn(t) : t)));
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json", accept: NDJSON },
        body: JSON.stringify({ q: text, ids: topicIds, history }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      // 段階の終わりごとに1行届く。答え（result）が届かずに終わったら失敗にする
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      let reply: Reply | null = null;
      for (;;) {
        const { value, done } = await reader.read();
        if (value) buffer += value;
        const { events, rest } = splitEvents<Reply>(done ? `${buffer}\n` : buffer);
        buffer = rest;
        for (const e of events) {
          if (e.type === "error") throw new Error("stream");
          if (e.type === "result") reply = e.reply;
          else update((t) => ({ ...t, stages: [...t.stages, e] }));
        }
        if (done) break;
      }
      if (!reply) throw new Error("no result");
      const result = reply;
      update((t) => ({ ...t, reply: result }));
    } catch {
      update((t) => ({ ...t, failed: true }));
    }
  }

  const composer = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void ask(q);
      }}
      className="flex items-end gap-1.5"
    >
      <button
        type="button"
        onClick={() => setScannerOpen(true)}
        aria-label={UI_COPY.readJan}
        className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-input text-primary"
      >
        <ScanBarcode className="size-5" aria-hidden="true" />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-xl border border-input bg-background px-1.5 py-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        {topics.length > 0 && (
          <ul className="flex flex-wrap gap-1" aria-label={UI_COPY.askTopics}>
            {topics.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setTopicIds(topicIds.filter((id) => id !== p.id))}
                  aria-label={`${p.name}を話題から外す`}
                >
                  <ProductBadge item={p} size="sm" selected removable />
                </button>
              </li>
            ))}
          </ul>
        )}
        <label htmlFor="ask-q" className="sr-only">
          質問
        </label>
        <textarea
          id="ask-q"
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void ask(q);
            }
          }}
          placeholder={
            topics.length
              ? UI_COPY.askPlaceholder
              : turns.length
                ? UI_COPY.askPlaceholderNext
                : UI_COPY.askPlaceholderGeneral
          }
          rows={1}
          maxLength={200}
          className="block min-h-8 w-full resize-none bg-transparent px-1.5 py-1 text-base outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !q.trim()}
        aria-label="質問する"
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-5" aria-hidden="true" />
        )}
      </button>
    </form>
  );

  // 最初の画面（まだ質問していない）：上に見出しと「商品から選ぶ」、入力欄はチャットと同じく下に固定。
  // 商品を選んでも一覧は残し（選んだ商品は枠を太く、もう一度押すと外す）、最初の質問を送るとチャットの形にする（L-20261104-05/06/14）
  if (turns.length === 0) {
    const grid = q.trim() ? matchProducts(all, q, all.length) : all;
    return (
      <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4">
        <h1 id="ask-title" className="text-base font-bold">
          {UI_COPY.askTitle}
        </h1>

        {/* 聞けること：種類別に、押すとそのまま質問する。商品の格子を下に押し出さないよう畳んでおく（L-20261104-15） */}
        <details className="group/how rounded-xl border border-border px-3 py-2">
          <summary className="flex min-h-7 cursor-pointer list-none items-center gap-1 text-sm font-bold [&::-webkit-details-marker]:hidden">
            <ChevronRight
              className="size-4 text-primary transition-transform group-open/how:rotate-90"
              aria-hidden="true"
            />
            聞けること
          </summary>
          <div className="mt-2 flex flex-col gap-2.5">
            {ASKABLE.map((g) => (
              <section key={g.title} className="flex flex-col gap-1.5">
                <h2 className="flex items-baseline gap-2 text-xs font-bold">
                  {g.title}
                  {topicIds.length < g.need && (
                    <span className="font-normal text-muted-foreground">
                      {g.need === 1
                        ? "下の一覧から商品を選ぶと押せます"
                        : "下の一覧から2品以上選ぶと押せます"}
                    </span>
                  )}
                </h2>
                <Chips
                  texts={g.texts}
                  disabled={loading || topicIds.length < g.need}
                  onPick={(t) => void ask(t)}
                />
              </section>
            ))}
          </div>
        </details>

        <section aria-labelledby="ask-products" className="flex flex-col gap-2">
          <h2 id="ask-products" className="flex items-baseline gap-2 text-sm font-bold">
            {UI_COPY.askPickProduct}
            <span className="text-xs font-normal text-muted-foreground">
              {grid.length}品・{UI_COPY.askSortedByName}
            </span>
          </h2>
          {grid.length === 0 ? (
            <p className="rounded-lg bg-muted p-3 text-sm">{UI_COPY.askNoMatch}</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {grid.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() =>
                      topicIds.includes(p.id)
                        ? setTopicIds(topicIds.filter((id) => id !== p.id))
                        : pick(p, false)
                    }
                    aria-pressed={topicIds.includes(p.id)}
                    disabled={!topicIds.includes(p.id) && topicIds.length >= MAX_TOPICS}
                    aria-label={`${p.name}を話題に足す`}
                    className={
                      "flex h-full w-full flex-col items-center gap-1 rounded-xl border p-2 text-center active:translate-y-px disabled:opacity-50 " +
                      (topicIds.includes(p.id)
                        ? "border-2 border-primary bg-primary/8 font-bold"
                        : "border-border")
                    }
                  >
                    <ProductImage
                      id={p.id}
                      kind={p.kind}
                      name={p.name}
                      size={64}
                      decorative
                      className="size-16 rounded bg-white object-contain"
                    />
                    <span className="line-clamp-2 text-xs leading-tight">{p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className={COMPOSER_BAR}>
          {/* よくある質問は入力欄のすぐ上に1行で横に流す（L-20261104-07） */}
          <Chips
            texts={topicIds.length ? PRODUCT_QUESTIONS : GENERAL_QUESTIONS}
            disabled={loading}
            onPick={(t) => void ask(t)}
            oneLine
          />
          {composer}
        </div>
      </div>
    );
  }

  return (
    // 会話が短くても入力欄が下に来るよう、画面の高さ（見出し・下部の余白を除く）まで伸ばす
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4">
      <ol className="flex flex-col gap-4" aria-label="やりとり" aria-live="polite">
        {turns.map((turn, i) => (
          <li
            key={i}
            ref={i === turns.length - 1 ? lastTurnRef : undefined}
            // 最新のやりとりは画面の高さぶん取り、短い答えでも質問をヘッダーの下まで上げられるようにする
            className={cn(
              "flex flex-col gap-2",
              i === turns.length - 1 && "min-h-[calc(100dvh-15rem)]",
            )}
          >
            <div className="flex max-w-[85%] flex-col items-end gap-1 self-end">
              {turn.topics.length > 0 && (
                <ul className="flex flex-wrap justify-end gap-1">
                  {turn.topics.map((t) => (
                    <li key={t.id}>
                      <ProductBadge item={t} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
              <p className="rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-[15px] text-primary-foreground">
                {turn.question}
              </p>
            </div>
            {turn.failed ? (
              <p className="rounded-lg bg-muted p-3 text-sm">{UI_COPY.askError}</p>
            ) : !turn.reply ? (
              <div className="flex max-w-[95%] flex-col gap-1.5">
                <p className="text-sm text-muted-foreground">{UI_COPY.askLoading}</p>
                <StageList stages={turn.stages} running={nextStage(turn.stages, turn.followup)} />
              </div>
            ) : (
              <ReplyView
                turn={turn}
                reply={turn.reply}
                // 続けて聞ける質問は最新の答えだけに出す
                onFollowup={i === turns.length - 1 && !loading ? (t) => void ask(t) : null}
              />
            )}
          </li>
        ))}
      </ol>
      {/* 新しい会話はヘッダーの右上に（L-20261104-09）。やりとりがあるときだけ出すので、最初の描画（ハイドレーション）には入らない */}
      {turns.length > 0 &&
        typeof document !== "undefined" &&
        document.getElementById(HEADER_ACTION_ID) &&
        createPortal(
          <button
            type="button"
            onClick={() => setTurns([])}
            disabled={loading}
            className="flex min-h-8 items-center gap-1 rounded-full border border-border px-2.5 text-xs disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {UI_COPY.askNewChat}
          </button>,
          document.getElementById(HEADER_ACTION_ID) as HTMLElement,
        )}

      <div className={COMPOSER_BAR}>
        {/* 商品を選んだが、まだ質問していないとき：その商品向けのよくある質問を入力欄のすぐ上に（L-20261104-08）。
            品名を打っている間は、ここに合う商品の列を出す */}
        {turns.length === 0 && !q.trim() && (
          <Chips texts={PRODUCT_QUESTIONS} disabled={loading} onPick={(t) => void ask(t)} oneLine />
        )}
        {shelf.length > 0 && (
          <ul
            className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]"
            aria-label={q.trim() ? UI_COPY.askMatched : UI_COPY.askStacked}
          >
            {shelf.map((p) => (
              <li key={p.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => pick(p)}
                  disabled={topicIds.length >= MAX_TOPICS}
                  aria-label={`${p.name}を話題に足す`}
                  className="active:translate-y-px disabled:opacity-50"
                >
                  <ProductBadge item={p} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {composer}
      </div>
    </div>
  );
}

// 商品の画像つきバッジ（入力欄・候補・質問の吹き出しで共通）
function ProductBadge({
  item,
  size = "md",
  selected = false,
  removable = false,
}: {
  item: Item;
  size?: "sm" | "md";
  selected?: boolean;
  removable?: boolean;
}) {
  const px = size === "sm" ? 22 : 28;
  return (
    <span
      className={
        "flex max-w-[14rem] items-center gap-1 rounded-full border py-0.5 pr-2 pl-0.5 " +
        (size === "sm" ? "text-xs " : "text-sm ") +
        (selected ? "border-primary bg-primary/8 font-bold" : "border-border bg-background")
      }
    >
      <ProductImage
        id={item.id}
        kind={item.kind}
        name={item.name}
        size={px}
        decorative
        className="shrink-0 rounded-full bg-white object-contain"
      />
      <span className="truncate">{item.name}</span>
      {removable && <X className="size-3.5 shrink-0" aria-hidden="true" />}
    </span>
  );
}

function Chips({
  texts,
  disabled,
  onPick,
  oneLine = false,
}: {
  texts: string[];
  disabled: boolean;
  onPick: (text: string) => void;
  oneLine?: boolean;
}) {
  return (
    <ul
      className={
        oneLine
          ? "-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]"
          : "flex flex-wrap gap-1.5"
      }
      aria-label="よくある質問"
    >
      {texts.map((text) => (
        <li key={text} className="shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(text)}
            className="min-h-9 rounded-full bg-accent px-3 text-left text-sm text-accent-foreground active:translate-y-px disabled:opacity-60"
          >
            {text}
          </button>
        </li>
      ))}
    </ul>
  );
}

// 比べる質問の表：列＝商品（写真・品名）、行＝違う項目だけ。同じ項目は下に名前だけ（L-20261104-09）
function DiffTable({
  table,
  items,
}: {
  table: NonNullable<Reply["table"]>;
  items: Map<string, Item>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table
          className="w-full table-fixed border-separate border-spacing-0 text-xs"
          // 2品なら画面に収まる幅。3〜4品は横に流す
          style={{ minWidth: `${4.75 + table.productIds.length * 6.5}rem` }}
        >
          <thead>
            <tr>
              <th scope="col" className="w-[4.75rem] border-b border-border" />
              {table.productIds.map((id) => {
                const p = items.get(id);
                return (
                  <th
                    key={id}
                    scope="col"
                    className="border-b border-border px-1 pb-1.5 align-bottom"
                  >
                    <span className="flex flex-col items-center gap-1 text-center text-xs leading-tight font-bold">
                      {p && (
                        <ProductImage
                          id={p.id}
                          kind={p.kind}
                          name={p.name}
                          size={40}
                          decorative
                          className="size-10 rounded bg-white object-contain"
                        />
                      )}
                      <span className="line-clamp-2">{p?.name}</span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r) => (
              <tr key={r.label}>
                <th
                  scope="row"
                  className="border-b border-border py-1.5 pr-1 text-left align-top text-xs font-bold"
                >
                  {r.label}
                </th>
                {r.cells.map((c, i) => (
                  <td
                    key={i}
                    className="border-b border-border px-1 py-1.5 text-center align-top tabular-nums"
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">
        {table.rows.length ? UI_COPY.askDiffNote : UI_COPY.askNoDiff}
        {table.same.length > 0 && `　同じ：${table.same.join("・")}`}
      </p>
    </div>
  );
}

// 質問エージェントの段階（L-20261104-15）。終わった段階は件数つき、動いている段階は回転の印。
// 件数は /api/ask が実際の処理から送ってきたものだけ
function StageList({ stages, running }: { stages: AskStage[]; running: AskStage["stage"] | null }) {
  return (
    <ol className="flex flex-col gap-1 text-xs" aria-label="どう答えたか">
      {stages.map((s) => (
        <li key={s.stage} className="flex items-start gap-1.5">
          <Check className="mt-px size-3.5 shrink-0 text-primary" aria-label="済み" />
          <span className="w-14 shrink-0 font-bold">{STAGE_LABEL[s.stage]}</span>
          <span className="min-w-0 flex-1 text-muted-foreground tabular-nums">
            {stageDetail(s)}
          </span>
        </li>
      ))}
      {running && (
        <li className="flex items-start gap-1.5">
          <Loader2
            className="mt-px size-3.5 shrink-0 animate-spin text-primary"
            aria-label="処理中"
          />
          <span className="w-14 shrink-0 font-bold">{STAGE_LABEL[running]}</span>
          <span className="min-w-0 flex-1 text-muted-foreground">{STAGE_RUNNING[running]}</span>
        </li>
      )}
    </ol>
  );
}

// 文字の並び（2文字ずつ）の5割以上が結論と同じなら、言い直しとみなして「詳しく見る」に入れない
function repeats(text: string, of: string): boolean {
  const grams = (t: string) => {
    const c = [...t.normalize("NFKC").replace(/[\s、。，．「」]/g, "")];
    return new Set(c.slice(0, -1).map((x, i) => x + c[i + 1]));
  };
  const a = grams(text);
  const b = grams(of);
  if (!a.size) return true;
  return [...a].filter((g) => b.has(g)).length / a.size >= 0.5;
}

function Refs({ refs }: { refs: number[] }) {
  return (
    <span className="ml-1 inline-flex gap-0.5 align-[1px]" aria-label={`根拠 ${refs.join("・")}`}>
      {refs.map((n) => (
        <span
          key={n}
          className="inline-flex size-4 items-center justify-center rounded-full border border-primary/60 text-[10px] font-bold text-primary tabular-nums"
        >
          {n}
        </span>
      ))}
    </span>
  );
}

// 答えの下の店内の説明メモ（L-20261104-15）。根拠には使わないので、出典つきのカードとは枠を分ける。
// 成分のメモは複数の商品に付くので、同じメモは1回だけ出す
function AnswerMemos({ productIds }: { productIds: string[] }) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const key = productIds.join(",");

  useEffect(() => {
    if (!key) return;
    let alive = true;
    fetch(`/api/memos?productIds=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? (r.json() as Promise<MemoListResponse>) : null))
      .then((res) => {
        if (!alive || !res?.products) return;
        const seen = new Map<string, Memo>();
        for (const p of res.products) for (const m of p.memos) seen.set(m.id, m);
        setMemos([...seen.values()]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [key]);

  if (!memos.length) return null;
  return (
    <section className="flex flex-col gap-1.5" aria-label="店内の説明メモ">
      <p className="text-xs font-bold text-muted-foreground">
        店内の説明メモ（公的な出典ではありません）
      </p>
      <MemoList memos={memos} />
    </section>
  );
}

// 1回分の答え。カードの中：（1品なら写真つきの品名とタグ）→ 結論 → 表か商品ごとの行か要点 → 出典（閉じておく）。
// 続けて聞く質問と注意書きはカードの外の下に、最新の答えのときだけ（L-20261104-11）
function ReplyView({
  turn,
  reply,
  onFollowup,
}: {
  turn: Turn;
  reply: Reply;
  onFollowup: ((text: string) => void) | null;
}) {
  const numbered = reply.answers.map((a, i) => ({ ...a, no: i + 1 }));
  const items = new Map([...reply.products, ...turn.topics].map((p) => [p.id, p]));
  // 1品のときは商品の行を出さず、品名とタグを結論の上に置く（同じことを2回言わない）
  const single = reply.rows.length === 1 && !reply.table ? reply.rows[0] : null;
  const singleItem = single ? items.get(single.productId) : undefined;

  return (
    <div className="flex max-w-[95%] flex-col gap-2">
      <div className="flex flex-col gap-2.5 rounded-2xl border border-border p-3">
        {single && singleItem && (
          <p className="flex flex-wrap items-center gap-1.5">
            <ProductImage
              id={singleItem.id}
              kind={singleItem.kind}
              name={singleItem.name}
              size={28}
              decorative
              className="size-7 rounded bg-white object-contain ring-1 ring-border"
            />
            <span className="text-sm font-bold">{singleItem.name}</span>
            {single.sections.map((s) => (
              <span
                key={s}
                className="rounded-full border border-primary/40 px-2 text-[11px] leading-5 text-primary"
              >
                {s}
              </span>
            ))}
          </p>
        )}

        <p className="text-base leading-relaxed font-bold">
          {reply.conclusion ? (
            <>
              {reply.conclusion.text}
              <Refs refs={reply.conclusion.refs} />
            </>
          ) : single && numbered.length ? (
            // 結論が検査を通らなかったときは、原文の抜き出しをそのまま出す
            numbered.map((a) => (
              <span key={a.no} className="block text-sm font-normal">
                「{a.text}」
                <Refs refs={[a.no]} />
              </span>
            ))
          ) : numbered.length ? (
            UI_COPY.askNoConclusion
          ) : (
            <span className="text-base font-normal text-muted-foreground">
              {UI_COPY.noEvidence}
            </span>
          )}
        </p>

        {reply.table && <DiffTable table={reply.table} items={items} />}

        {reply.rows.length > 1 && !reply.table && (
          <ul className="flex flex-col divide-y divide-border">
            {reply.rows.map(({ productId, cell, sections }) => {
              const p = items.get(productId);
              const own = numbered.filter((a) => a.productId === productId);
              return (
                <li key={productId} className="flex gap-2.5 py-2.5 first:pt-0 last:pb-0">
                  {p && (
                    <ProductImage
                      id={p.id}
                      kind={p.kind}
                      name={p.name}
                      size={48}
                      className="size-12 shrink-0 rounded-lg bg-white object-contain ring-1 ring-border"
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold">{p?.name}</span>
                      {sections.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-primary/40 px-2 text-[11px] leading-5 text-primary"
                        >
                          {s}
                        </span>
                      ))}
                    </p>
                    <p className="text-sm leading-relaxed">
                      {cell ? (
                        <>
                          {cell.text}
                          <Refs refs={cell.refs} />
                        </>
                      ) : own.length ? (
                        // 説明が検査を通らなかったときは、原文の抜き出しをそのまま出す
                        own.map((a) => (
                          <span key={a.no} className="block">
                            「{a.text}」
                            <Refs refs={[a.no]} />
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground">{UI_COPY.askNotFound}</span>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* 詳しく見る：結論に足りない記載の中身を3つまで。普段は閉じて短く見せる（L-20261104-18）。
            1品のときは商品ごとの説明も、結論と同じでなければここに入れる */}
        {(() => {
          const extra = [
            ...(single?.cell &&
            reply.conclusion &&
            !repeats(single.cell.text, reply.conclusion.text)
              ? [single.cell]
              : []),
            ...reply.points,
          ].slice(0, 4);
          if (!extra.length) return null;
          return (
            <details className="group/more">
              <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-bold text-primary [&::-webkit-details-marker]:hidden">
                <ChevronRight
                  className="size-3.5 transition-transform group-open/more:rotate-90"
                  aria-hidden="true"
                />
                {UI_COPY.askMore}
              </summary>
              <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed">
                {extra.map((s, i) => (
                  <li key={i}>
                    {s.text}
                    <Refs refs={s.refs} />
                  </li>
                ))}
              </ul>
            </details>
          );
        })()}

        {numbered.length > 0 && (
          <details
            open={!reply.conclusion && !reply.rows.length}
            className="group/src border-t border-border pt-2"
          >
            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-bold text-primary [&::-webkit-details-marker]:hidden">
              <ChevronRight
                className="size-3.5 transition-transform group-open/src:rotate-90"
                aria-hidden="true"
              />
              {UI_COPY.askEvidence}（{numbered.length}件）
            </summary>
            <ol className="mt-2 flex flex-col gap-2.5">
              {numbered.map((a) => (
                <li key={`${a.id}-${a.no}`} className="flex gap-2">
                  <span className="mt-0.5">
                    <Refs refs={[a.no]} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-xs text-muted-foreground">
                    <blockquote className="text-sm text-foreground">
                      {a.productId && items.get(a.productId) && (
                        <span className="font-bold">{items.get(a.productId)?.name}：</span>
                      )}
                      {a.text}
                    </blockquote>
                    {a.condition && <p>記載条件：{a.condition}</p>}
                    <p>
                      {a.source.url ? (
                        <a
                          href={a.source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 underline"
                        >
                          {a.source.label}
                          <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      ) : (
                        a.source.label
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </details>
        )}
        {turn.stages.length > 0 && (
          <details className="group/how border-t border-border pt-2">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-bold text-primary [&::-webkit-details-marker]:hidden">
              <ChevronRight
                className="size-3.5 transition-transform group-open/how:rotate-90"
                aria-hidden="true"
              />
              どう答えたか
            </summary>
            <div className="mt-2">
              <StageList stages={turn.stages} running={null} />
            </div>
          </details>
        )}
        <p className="text-[11px] leading-snug text-muted-foreground">
          {reply.via === "keyword" ? UI_COPY.askKeyword : UI_COPY.askNote}
        </p>
      </div>

      <AnswerMemos productIds={reply.rows.map((r) => r.productId)} />

      {onFollowup && reply.followups.length > 0 && (
        <Chips texts={reply.followups} disabled={false} onPick={onFollowup} />
      )}
    </div>
  );
}
