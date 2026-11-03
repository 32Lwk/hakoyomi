"use client";

import { ExternalLink, Loader2, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ColumnNo } from "@/components/compare-view";
import { ProductImage } from "@/components/product-image";
import { useStack } from "@/components/stack-provider";
import { useProductViews } from "@/components/use-product-views";
import type { Answer } from "@/lib/ask/select";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { cn } from "@/lib/utils";

// よく聞かれることの入口。答えは記載の抜き出しだけ（判断はしない）
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

type Result = { question: string; answers: Answer[]; via: "claude" | "keyword" };

// 質問（T301、L-20261103-43）。対象は選んでいる商品（複数可）か、商品を選ばず全体。
// 質問文は画面の中だけで持ち、保存しない
export function AskView() {
  const initialId = useSearchParams().get("id");
  const { ids } = useStack();
  const { views } = useProductViews(ids);
  // 商品から開いたときはその商品、ほかは選んでいる商品すべて。外した商品は対象から落とす
  const [chosen, setChosen] = useState<string[] | null>(initialId ? [initialId] : null);
  const targets = (chosen ?? ids).filter((id) => ids.includes(id));
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [failed, setFailed] = useState(false);

  const toggle = (id: string) =>
    setChosen(targets.includes(id) ? targets.filter((x) => x !== id) : [...targets, id]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: text, ids: targets }),
      });
      const data = (await res.json()) as { answers: Answer[]; via: "claude" | "keyword" };
      setResult({ question: text, ...data });
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const ordered = views.filter((v) => targets.includes(v.product.id));
  const groups = ordered.length
    ? ordered.map((v) => ({
        key: v.product.id,
        no: ids.indexOf(v.product.id) + 1,
        name: v.product.name,
        answers: result?.answers.filter((a) => a.productId === v.product.id) ?? [],
      }))
    : [{ key: "general", no: 0, name: UI_COPY.askGeneralSource, answers: result?.answers ?? [] }];

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="target-title" className="flex flex-col gap-2">
        <h1 id="target-title" className="text-base font-bold">
          {UI_COPY.askTarget}
        </h1>
        <ul className="flex flex-wrap gap-1.5">
          {views.map((v, i) => {
            const on = targets.includes(v.product.id);
            return (
              <li key={v.product.id}>
                <button
                  type="button"
                  onClick={() => toggle(v.product.id)}
                  aria-pressed={on}
                  className={cn(
                    "flex min-h-10 max-w-[15rem] items-center gap-1.5 rounded-full border-2 py-1 pr-3 pl-1 text-sm",
                    on ? "border-primary bg-primary/8 font-bold" : "border-border",
                  )}
                >
                  <ColumnNo n={i + 1} />
                  <ProductImage
                    id={v.product.id}
                    kind={v.product.kind}
                    name={v.product.name}
                    size={24}
                    decorative
                    className="size-6 rounded bg-white object-contain"
                  />
                  <span className="truncate">{v.product.name}</span>
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setChosen([])}
              aria-pressed={targets.length === 0}
              className={cn(
                "min-h-10 rounded-full border-2 px-3 text-sm",
                targets.length === 0 ? "border-primary bg-primary/8 font-bold" : "border-border",
              )}
            >
              {UI_COPY.askGeneral}
            </button>
          </li>
        </ul>
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(q);
        }}
        className="flex gap-2"
      >
        <label htmlFor="ask-q" className="sr-only">
          質問
        </label>
        <textarea
          id="ask-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={UI_COPY.askPlaceholder}
          rows={2}
          maxLength={200}
          className="min-h-12 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <button
          type="submit"
          disabled={loading || !q.trim()}
          aria-label="質問する"
          className="flex w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-5" aria-hidden="true" />
          )}
        </button>
      </form>

      <ul className="-mt-2 flex flex-wrap gap-1.5" aria-label="よくある質問">
        {(targets.length ? PRODUCT_QUESTIONS : GENERAL_QUESTIONS).map((text) => (
          <li key={text}>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setQ(text);
                void ask(text);
              }}
              className="min-h-9 rounded-full bg-accent px-3 text-sm text-accent-foreground active:translate-y-px disabled:opacity-60"
            >
              {text}
            </button>
          </li>
        ))}
      </ul>

      {failed && <p className="rounded-lg bg-muted p-3 text-sm">{UI_COPY.readError}</p>}

      {result && !loading && (
        <section aria-labelledby="answer-title" className="flex flex-col gap-3">
          <h2 id="answer-title" className="text-sm text-muted-foreground">
            「{result.question}」の記載
          </h2>
          {groups.map((g) => (
            <div key={g.key} className="flex flex-col gap-2">
              {ordered.length > 1 && (
                <h3 className="flex items-center gap-1.5 text-sm font-bold">
                  <ColumnNo n={g.no} />
                  {g.name}
                </h3>
              )}
              {g.answers.length === 0 ? (
                <p className="rounded-lg bg-muted p-3 text-sm">{UI_COPY.noEvidence}</p>
              ) : (
                g.answers.map((a, i) => (
                  <figure
                    key={`${a.id}-${i}`}
                    className="flex flex-col gap-1.5 rounded-xl border border-border p-3"
                  >
                    <blockquote className="rounded-lg bg-muted px-3 py-2 text-base leading-relaxed">
                      {a.text}
                    </blockquote>
                    <figcaption className="text-xs text-muted-foreground">
                      出典：
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
                    </figcaption>
                  </figure>
                ))
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">{UI_COPY.askNote}</p>
          {result.via === "keyword" && (
            <p className="text-[11px] text-muted-foreground">{UI_COPY.askKeyword}</p>
          )}
        </section>
      )}
    </div>
  );
}
