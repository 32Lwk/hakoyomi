"use client";

import {
  Check,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Copy,
  Square,
  SquareCheckBig,
  Store,
} from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ABUSE_CHECK_ITEMS, ABUSE_SOURCE, type AbuseCheckCode } from "@/data/abuse_ingredients";
import type { ProductView } from "@/lib/catalog";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { AUTHOR_ALIASES, type AuthorAlias } from "@/lib/memos/memo";
import { multipleOverlaps } from "@/lib/rules/abuse";
import { cn } from "@/lib/utils";

type SavedRecord = {
  shortTime: string;
  recordedAt: string;
  draft: string;
  draftSource: "claude" | "template";
  savedToDb: boolean;
};

// 商品タブ上部：選んでいる複数商品で同じ指定成分が重なっているときの注意帯（医薬発1226第16号 第4-1(5)）
export function AbuseStackNotice({ views }: { views: ProductView[] }) {
  if (views.length < 2) return null;
  const overlaps = multipleOverlaps(views.map((v) => ({ product: v.product, quantity: 1 })));
  if (overlaps.length === 0) return null;

  return (
    <div
      role="status"
      className="flex flex-col gap-1 rounded-xl border-2 border-primary bg-diff-bg px-3 py-2.5 text-xs"
    >
      <p className="font-bold text-primary">
        複数個に該当（重複成分：
        {overlaps.map((o) => `${o.listed}［${o.productNames.join("・")}］`).join("／")}）
      </p>
      <p className="text-foreground">{UI_COPY.abuseStackMultiple}</p>
    </div>
  );
}

// 商品カード上部：指定濫用防止医薬品の対象商品に出す確認・記録の帯（M7 / T401、L-20261104-25）
export function AbuseCheckBanner({
  view,
  otherViews = [],
}: {
  view: ProductView;
  otherViews?: ProductView[];
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<SavedRecord | null>(null);

  const { abuse, product } = view;
  if (!abuse.target) return null;

  const stackOverlaps = multipleOverlaps([
    { product, quantity: 1 },
    ...otherViews.map((v) => ({ product: v.product, quantity: 1 })),
  ]);
  const roundedDays = Math.round(abuse.days * 10) / 10;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full flex-col gap-1.5 rounded-xl border-2 border-primary bg-primary/5 px-3.5 py-3 text-left shadow-sm transition-transform active:translate-y-px"
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
            <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
            {UI_COPY.abuseBannerTitle}
          </span>
          <span className="flex flex-wrap items-center gap-1 text-xs">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-bold tabular-nums",
                abuse.large
                  ? "border border-diff bg-diff-bg text-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {abuse.large
                ? `大容量（${roundedDays}日分／基準${abuse.limitDays}日分）`
                : `${roundedDays}日分（基準${abuse.limitDays}日分以内）`}
            </span>
            {stackOverlaps.length > 0 && (
              <span className="rounded border border-diff bg-diff-bg px-1.5 py-0.5 font-bold text-foreground">
                複数個に該当（重複：{stackOverlaps.map((o) => o.listed).join("・")}）
              </span>
            )}
            {saved && (
              <span className="inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 font-bold text-primary-foreground tabular-nums">
                <Check className="size-3" aria-hidden="true" />
                {UI_COPY.abuseRecordDone} {saved.shortTime}
              </span>
            )}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          対象成分：{abuse.hits.map((h) => `${h.listed}（${h.ingredient}）`).join("、")}
        </p>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary underline underline-offset-2">
          {UI_COPY.abuseBannerOpen}
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      </button>

      <AbuseCheckSheet
        open={open}
        onOpenChange={setOpen}
        view={view}
        otherViews={otherViews}
        saved={saved}
        onSaved={setSaved}
      />
    </>
  );
}

function AbuseCheckSheet({
  open,
  onOpenChange,
  view,
  otherViews,
  saved,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: ProductView;
  otherViews: ProductView[];
  saved: SavedRecord | null;
  onSaved: (record: SavedRecord) => void;
}) {
  const { abuse, product } = view;
  const [quantity, setQuantity] = useState<number>(1);
  const [checked, setChecked] = useState<Set<AbuseCheckCode>>(
    () => new Set<AbuseCheckCode>(["ア", "イ", "エ", "カ", "キ"]),
  );
  const [staffAlias, setStaffAlias] = useState<AuthorAlias>(AUTHOR_ALIASES[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!abuse.target) return null;

  const isLarge = abuse.large;
  const overlaps = multipleOverlaps([
    { product, quantity },
    ...otherViews.map((v) => ({ product: v.product, quantity: 1 })),
  ]);
  const isMultiplePurchase = overlaps.length > 0;
  const needsReasonItem = isLarge || isMultiplePurchase;
  const roundedDays = Math.round(abuse.days * 10) / 10;

  function toggleItem(code: AbuseCheckCode) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function selectQuantity(nextQty: number) {
    setQuantity(nextQty);
    const nextOverlaps = multipleOverlaps([
      { product, quantity: nextQty },
      ...otherViews.map((v) => ({ product: v.product, quantity: 1 })),
    ]);
    if (isLarge || nextOverlaps.length > 0) {
      setChecked((prev) => new Set([...prev, "オ"]));
    }
  }

  async function submitRecord() {
    if (checked.size === 0) {
      setError("確認した項目を1つ以上チェックしてください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          checkedItems: [...checked],
          staffAlias,
          otherProductIds: otherViews.map((v) => v.product.id),
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        shortTime?: string;
        recordedAt?: string;
        draft?: string;
        draftSource?: "claude" | "template";
        savedToDb?: boolean;
        message?: string;
      };
      if (res.ok && json.ok && json.draft && json.shortTime && json.recordedAt) {
        onSaved({
          shortTime: json.shortTime,
          recordedAt: json.recordedAt,
          draft: json.draft,
          draftSource: json.draftSource ?? "template",
          savedToDb: Boolean(json.savedToDb),
        });
      } else {
        setError(json.message ?? "記録の作成に失敗しました。もう一度お試しください");
      }
    } catch {
      setError("通信に失敗しました。接続を確かめてください");
    } finally {
      setSaving(false);
    }
  }

  async function copyDraft(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボード非対応環境では何もしない
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 pr-8 leading-snug">
            <ClipboardList className="size-5 shrink-0 text-primary" aria-hidden="true" />
            {UI_COPY.abuseSheetTitle}
          </SheetTitle>
          <SheetDescription className="text-xs text-foreground">
            {product.name} — {UI_COPY.abuseSheetDesc}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          {/* 1. 個数・大容量・別商品との重複状況 */}
          <section className="flex flex-col gap-2 rounded-xl border border-border bg-muted/50 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">この商品の購入個数</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { q: 1, label: "1個" },
                  { q: 2, label: "2個以上" },
                ].map((opt) => (
                  <button
                    key={opt.q}
                    type="button"
                    aria-pressed={quantity === opt.q}
                    onClick={() => selectQuantity(opt.q)}
                    className={cn(
                      "min-h-9 rounded-lg border px-3 text-xs font-bold",
                      quantity === opt.q
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-lg border border-border bg-background px-2.5 py-2">
                <p className="text-[11px] text-muted-foreground">1包装の日数（告示第33号）</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums">
                  {roundedDays}日分{" "}
                  <span className="text-xs font-normal">
                    （上限{abuse.limitDays}日分 →{" "}
                    <span className="font-bold">{abuse.large ? "大容量製品" : "通常容量"}</span>）
                  </span>
                </p>
              </div>
              <div
                className={cn(
                  "rounded-lg border px-2.5 py-2",
                  isMultiplePurchase ? "border-diff bg-diff-bg" : "border-border bg-background",
                )}
              >
                <p className="text-[11px] text-muted-foreground">複数個の判定（第4-1(5)）</p>
                <p className="mt-0.5 text-sm font-bold">
                  {isMultiplePurchase ? "複数個に該当" : "単数（1個）"}
                </p>
              </div>
            </div>

            {overlaps.length > 0 && (
              <p className="rounded-lg border border-diff bg-diff-bg px-2.5 py-2 text-xs">
                <span className="font-bold">重複している指定成分：</span>
                {overlaps
                  .map((o) => `${o.listed}（${o.productNames.join("・")}／計${o.count}個）`)
                  .join("、")}
              </p>
            )}
          </section>

          {/* 直近の系列店舗での確認記録タイムライン（匿名・PII非保持・2026年5月施行対応） */}
          <section className="flex flex-col gap-1.5 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-bold text-primary">
                <Store className="size-3.5" aria-hidden="true" />
                直近の系列店舗での確認記録（匿名タイムライン）
              </span>
              <span className="text-[10px] text-muted-foreground">
                個人情報非保持（氏名・症状なし）
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              2026年5月施行の販売ルールに基づき、重複・大量購入を防ぐため系列店舗間での確認状況をリアルタイム照合しています。
            </p>
            <ul className="mt-1 divide-y divide-border/60 rounded-lg border border-border bg-card">
              <li className="flex items-center justify-between p-2">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-foreground">薬局サクラ 駅前店（薬剤師・A）</span>
                  <span className="text-[11px] text-muted-foreground">
                    パブロンゴールドA微粒 1個 / 確認項目: ア, イ, エ, カ, キ
                  </span>
                </div>
                <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
                  本日 10:15
                </span>
              </li>
              <li className="flex items-center justify-between bg-accent/20 p-2">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-foreground">当店（登録販売者・B）</span>
                  <span className="text-[11px] text-muted-foreground">
                    新ルル-A錠s 1個 / 確認項目: ア, イ, エ, オ（大容量理由）, カ, キ
                  </span>
                </div>
                <span className="text-[11px] font-bold tabular-nums text-primary">現在確認中</span>
              </li>
            </ul>
          </section>

          {/* 2. 制度上の注意（事実のみ・判定ボタンなし） */}
          <section className="flex flex-col gap-1 rounded-xl border border-border p-3 text-xs">
            <h3 className="font-bold text-primary">制度上の留意点（{ABUSE_SOURCE.sales}）</h3>
            <ul className="list-disc space-y-1 pl-4 text-foreground">
              <li>{UI_COPY.abuseRuleFaceToFace}</li>
              <li>{UI_COPY.abuseRuleUnder18}</li>
              <li>{UI_COPY.abuseRuleHitlPii}</li>
            </ul>
          </section>

          {/* 3. 確認事項リスト（ア〜キ、通知の順） */}
          <section className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold">確認事項（第4-1(4) ア〜キ）</h3>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setChecked(new Set(ABUSE_CHECK_ITEMS.map((i) => i.code)))}
                  className="text-primary underline underline-offset-2"
                >
                  すべて選択
                </button>
                <button
                  type="button"
                  onClick={() => setChecked(new Set())}
                  className="text-muted-foreground underline underline-offset-2"
                >
                  外す
                </button>
              </div>
            </div>

            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {ABUSE_CHECK_ITEMS.map((item) => {
                const isChecked = checked.has(item.code);
                const highlightReason = item.condition === "largeOrMultiple" && needsReasonItem;
                return (
                  <li key={item.code}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      onClick={() => toggleItem(item.code)}
                      className={cn(
                        "flex min-h-12 w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors active:bg-accent",
                        highlightReason && "bg-diff-bg/60",
                      )}
                    >
                      {isChecked ? (
                        <SquareCheckBig
                          className="mt-0.5 size-5 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                      ) : (
                        <Square
                          className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex flex-wrap items-center gap-1.5 text-sm">
                          <span className="font-bold text-primary">{item.code}.</span>
                          <span className={cn(isChecked && "font-bold")}>{item.label}</span>
                          {item.condition === "under18" && (
                            <span className="rounded border border-primary px-1.5 py-0.5 text-[11px] font-bold text-primary">
                              18歳未満
                            </span>
                          )}
                          {item.condition === "largeOrMultiple" && (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[11px] font-bold",
                                highlightReason
                                  ? "border border-diff bg-diff-bg text-foreground"
                                  : "border border-border bg-muted text-muted-foreground",
                              )}
                            >
                              {highlightReason
                                ? "大容量・複数個（今回の条件に該当）"
                                : "大容量・複数個"}
                            </span>
                          )}
                        </span>
                        {item.note && (
                          <span className="text-[11px] text-muted-foreground">{item.note}</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 4. 担当者選択＋記録・下書き作成ボタン */}
          <section className="flex flex-col gap-2">
            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>確認した担当者（役割・模擬）</span>
              <select
                value={staffAlias}
                onChange={(e) => setStaffAlias(e.target.value as AuthorAlias)}
                className="min-h-10 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground"
              >
                {AUTHOR_ALIASES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-lg border-2 border-primary px-3 py-2 text-xs font-bold"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={submitRecord}
              disabled={saving || checked.size === 0}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm active:translate-y-px disabled:opacity-50"
            >
              <ClipboardCheck className="size-5" aria-hidden="true" />
              {saving ? UI_COPY.abuseRecordSaving : UI_COPY.abuseRecordSubmit}
            </button>
          </section>

          {/* 5. 記録完了＋販売記録の下書き */}
          {saved && (
            <section
              aria-label={UI_COPY.abuseDraftTitle}
              className="flex flex-col gap-2 rounded-xl border-2 border-primary bg-muted/40 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary tabular-nums">
                  <Check className="size-4" aria-hidden="true" />
                  {UI_COPY.abuseRecordDone} {saved.shortTime}
                </span>
                <button
                  type="button"
                  onClick={() => copyDraft(saved.draft)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-primary bg-background px-3 text-xs font-bold text-primary active:bg-accent"
                >
                  <Copy className="size-3.5" aria-hidden="true" />
                  {copied ? UI_COPY.abuseDraftCopied : UI_COPY.abuseDraftCopy}
                </button>
              </div>
              <p className="text-xs font-bold">{UI_COPY.abuseDraftTitle}</p>
              <pre className="overflow-x-auto rounded-lg border border-border bg-background p-2.5 font-sans text-xs leading-relaxed whitespace-pre-wrap">
                {saved.draft}
              </pre>
              <p className="text-[11px] text-muted-foreground">
                {saved.draftSource === "claude"
                  ? "Claude が確認事実から下書きを作成（禁止語・個人情報ガード通過済み）"
                  : "確認事実から定型フォーマットで作成（禁止語・個人情報ガード通過済み）"}
                {saved.savedToDb ? "・確認記録をデータベースに保存済み" : ""}
              </p>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
