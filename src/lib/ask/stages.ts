// 質問エージェントの段階の記録（L-20261104-15）。/api/ask が段階の終わりごとに1行ずつ送る（NDJSON）。
// 件数は実際の処理の数だけ（演出にしない）。画面と route で共通の型と文面。純粋関数のみ

export type AskStage =
  // ①解釈：会話の続きのときだけ動く。ok=false は Claude を使えず元の質問のまま
  | { stage: "interpret"; ok: boolean; rewritten: boolean }
  // ②検索：Claude に渡す候補の記載の数
  | { stage: "search"; candidates: number }
  // ③照合：claude＝Claude が選んだ抜き出しの数。keyword＝Claude を使えず検索の上位をそのまま出した数
  | { stage: "match"; via: "claude" | "keyword"; selected: number }
  // ④出典検証：原文とそのまま一致した数・除いた数（不一致・重複。keyword のときは原文をそのまま出すので検証しない）
  | { stage: "verify"; matched: number; discarded: number }
  // ⑤ガード：禁止語（regex）・番号と数値の照合・Claude 自己検査で差し止めた数。
  // review=null は自己検査できず説明文を出さなかった。reviewed は自己検査に回した文の数
  | { stage: "guard"; regex: number; numbers: number; reviewed: number; review: number | null };

export type AskEvent<R> =
  ({ type: "stage" } & AskStage) | { type: "result"; reply: R } | { type: "error" };

export const NDJSON = "application/x-ndjson";

export function encodeEvent<R>(event: AskEvent<R>): string {
  return `${JSON.stringify(event)}\n`;
}

// 受け取った分を行に分ける。最後の行は途中かもしれないので rest に残す
export function splitEvents<R>(buffer: string): { events: AskEvent<R>[]; rest: string } {
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  const events = lines.filter((line) => line.trim()).map((line) => JSON.parse(line) as AskEvent<R>);
  return { events, rest };
}

export const STAGE_LABEL: Record<AskStage["stage"], string> = {
  interpret: "解釈",
  search: "検索",
  match: "照合",
  verify: "出典検証",
  guard: "ガード",
};

// 動いている段階の説明（まだ件数がない）
export const STAGE_RUNNING: Record<AskStage["stage"], string> = {
  interpret: "前の質問を踏まえて質問を読んでいます",
  search: "通知・商品の記載から候補を探しています",
  match: "候補から質問に当たる記載を抜き出しています",
  verify: "抜き出しを原文と照らしています",
  guard: "表現と数値を検査しています",
};

// 次に動く段階。解釈は会話の続きのときだけ。keyword のときは出典検証を飛ばす
export function nextStage(done: AskStage[], followup: boolean): AskStage["stage"] | null {
  const last = done.at(-1);
  if (!last) return followup ? "interpret" : "search";
  if (last.stage === "interpret") return "search";
  if (last.stage === "search") return "match";
  if (last.stage === "match") return last.via === "keyword" ? "guard" : "verify";
  if (last.stage === "verify") return "guard";
  return null;
}

// 終わった段階の件数の文
export function stageDetail(s: AskStage): string {
  switch (s.stage) {
    case "interpret":
      return !s.ok
        ? "Claude を使えないため、元の質問のまま検索"
        : s.rewritten
          ? "前の質問を踏まえて質問を補った"
          : "質問はそのまま";
    case "search":
      return `候補の記載 ${s.candidates}件`;
    case "match":
      return s.via === "claude"
        ? `抜き出し ${s.selected}件`
        : `Claude を使えないため、検索の上位 ${s.selected}件をそのまま`;
    case "verify":
      return `原文と一致 ${s.matched}件・除外 ${s.discarded}件`;
    case "guard": {
      const review =
        s.review === null
          ? `自己検査できず説明文 ${s.reviewed}文を出さない`
          : `自己検査 ${s.review}文`;
      return `差し止め：禁止語 ${s.regex}件・番号と数値 ${s.numbers}文・${review}`;
    }
  }
}
