"use client";

import { BookOpen, NotebookPen, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { matchOfficialNoticesForMemo } from "@/lib/memos/linker";
import { AUTHOR_ALIASES, MEMO_MAX_LENGTH, type Memo } from "@/lib/memos/memo";
import { cn } from "@/lib/utils";

// 店内の説明メモ（T403、L-20261104-15）。公的な出典ではないので、通知・商品の事実とは枠を分けて出す

type Status = "loading" | "ready" | "unavailable";

// GET /api/memos?productIds=a,b の応答
export type MemoListResponse = {
  configured?: boolean;
  error?: string;
  products?: { productId: string; memos: Memo[] }[];
};

function targetLabel(memo: Memo): string {
  return memo.target.kind === "product" ? "この商品" : `成分：${memo.target.ingredient}`;
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

// 一覧だけ（質問画面の回答の下などでも使える）。onDelete があれば削除ボタンを出す
export function MemoList({ memos, onDelete }: { memos: Memo[]; onDelete?: (memo: Memo) => void }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {memos.map((memo) => {
        const matches = matchOfficialNoticesForMemo(memo.body);
        return (
          <li key={memo.id} className="flex flex-col gap-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed text-foreground">
                  {memo.body}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {memo.authorAlias}・{targetLabel(memo)}・{dateLabel(memo.createdAt)}
                </p>
              </div>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(memo)}
                  aria-label="このメモを削除"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive active:bg-accent"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* 公的根拠の自動照合タグ */}
            {matches.length > 0 && (
              <div className="mt-1 flex flex-col gap-1 rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs">
                <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
                  <BookOpen className="size-3.5 shrink-0" />
                  <span>公的根拠との自動照合（厚労省通知）</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {matches.map((m, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded bg-background px-1.5 py-0.5 text-[10px] font-medium border border-border text-foreground shadow-2xs"
                    >
                      <span className="text-muted-foreground font-bold">[{m.category}]</span>
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function MemoSection({
  productId,
  ingredients,
}: {
  productId: string;
  ingredients: string[];
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [memos, setMemos] = useState<Memo[]>([]);
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/memos?productIds=${encodeURIComponent(productId)}`)
      .then((res) => res.json() as Promise<MemoListResponse>)
      .then((json) => {
        if (!alive) return;
        setMemos(json.products?.find((p) => p.productId === productId)?.memos ?? []);
        setStatus(json.configured === false || json.error ? "unavailable" : "ready");
      })
      .catch(() => alive && setStatus("unavailable"));
    return () => {
      alive = false;
    };
  }, [productId]);

  async function remove(memo: Memo) {
    if (!window.confirm("このメモを削除します。元に戻せません。")) return;
    const res = await fetch(`/api/memos/${memo.id}`, { method: "DELETE" });
    if (res.ok || res.status === 404) setMemos((list) => list.filter((m) => m.id !== memo.id));
  }

  return (
    <section aria-labelledby="memo-title" className="flex flex-col gap-2">
      <h2 id="memo-title" className="flex items-baseline justify-between text-base font-bold">
        店内の説明メモ
        <span className="text-xs font-normal text-muted-foreground">公的な出典ではありません</span>
      </h2>
      {status === "loading" ? (
        <p className="text-xs text-muted-foreground">読み込み中…</p>
      ) : memos.length ? (
        <MemoList memos={memos} onDelete={remove} />
      ) : (
        <p className="text-xs text-muted-foreground">
          {status === "unavailable"
            ? "メモの保存先につながらないため、メモは表示できません"
            : "この商品のメモはまだありません"}
        </p>
      )}
      {writing ? (
        <MemoForm
          productId={productId}
          ingredients={ingredients}
          onCancel={() => setWriting(false)}
          onSaved={(memo) => {
            setMemos((list) => [memo, ...list]);
            setWriting(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setWriting(true)}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary text-sm font-bold text-primary active:bg-accent"
        >
          <NotebookPen className="size-4" aria-hidden="true" />
          説明メモを書く
        </button>
      )}
    </section>
  );
}

function MemoForm({
  productId,
  ingredients,
  onCancel,
  onSaved,
}: {
  productId: string;
  ingredients: string[];
  onCancel: () => void;
  onSaved: (memo: Memo) => void;
}) {
  const [body, setBody] = useState("");
  const [alias, setAlias] = useState<string>(AUTHOR_ALIASES[0]);
  const [target, setTarget] = useState(""); // "" = この商品、それ以外は成分名
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  async function save() {
    setSaving(true);
    setMessages([]);
    try {
      const res = await fetch("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          authorAlias: alias,
          productId,
          ...(target ? { ingredient: target } : {}),
        }),
      });
      const json = (await res.json()) as { memo?: Memo; messages?: string[] };
      if (res.ok && json.memo) onSaved(json.memo);
      else setMessages(json.messages ?? ["保存できませんでした。入力を確かめてください"]);
    } catch {
      setMessages(["保存できませんでした。通信を確かめてください"]);
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = "min-h-11 w-full rounded-lg border border-border bg-background px-2 text-sm";
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">
        説明の仕方（箱のどこに書いてあるか・何を先に確かめるか）を書きます。商品を勧める書き方、効果の言い切り、お客様の症状・氏名などは保存できません。
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          付ける先
          <select className={fieldClass} value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">この商品</option>
            {ingredients.map((name) => (
              <option key={name} value={name}>
                成分：{name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          書いた人（役割）
          <select className={fieldClass} value={alias} onChange={(e) => setAlias(e.target.value)}>
            {AUTHOR_ALIASES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>
      {target && (
        <div className="flex flex-col gap-1 rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs">
          <p className="font-bold text-primary">
            1つの成分メモが同一成分を含む全商品へ自動共有されます
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            【自動共有先】新ルル-A錠s、パブロンゴールドA微粒など、{target}
            を含むすべての商品カード最上部に「先輩から受け継がれた接客のコツ」として自動反映されます。
          </p>
        </div>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MEMO_MAX_LENGTH}
        rows={3}
        aria-label="メモの本文"
        placeholder="例：眠気の記載は箱の裏「してはいけないこと」の欄にある。そこを指で示して説明する"
        className="w-full rounded-lg border border-border bg-background p-2 text-sm"
      />
      <p className="text-right text-[11px] text-muted-foreground tabular-nums">
        {body.length}/{MEMO_MAX_LENGTH}
      </p>
      {messages.length > 0 && (
        <div role="alert" className="rounded-lg border-2 border-primary px-3 py-2 text-sm">
          <p className="font-bold">保存しませんでした</p>
          <ul className="list-disc pl-5">
            {messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-xl border border-border text-sm active:bg-accent"
        >
          やめる
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || !body.trim()}
          className={cn(
            "min-h-11 rounded-xl bg-primary text-sm font-bold text-primary-foreground active:translate-y-px",
            "disabled:opacity-50",
          )}
        >
          {saving ? "確かめています…" : "確かめて保存"}
        </button>
      </div>
    </div>
  );
}
