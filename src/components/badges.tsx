"use client";

import {
  Baby,
  Car,
  ChevronRight,
  ClipboardList,
  Coffee,
  type LucideIcon,
  Medal,
  UserRound,
  Wine,
} from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ABUSE_SOURCE } from "@/data/abuse_ingredients";
import { DOPING_SOURCE } from "@/data/doping_list";
import { BADGE_INFO, UI_COPY } from "@/lib/guard/uiCopy";
import { badgeRowKind } from "@/lib/compare";
import type { Badge, BadgeTone, Evidence } from "@/lib/rules/badges";
import type { BadgeKind, NoticeGroup } from "@/lib/schema/notice";
import { cn } from "@/lib/utils";

// 種類で見た目を分ける。良し悪しの色は使わない（design.md §3）
const TONE: Record<BadgeTone, string> = {
  system: "border-2 border-primary bg-background text-primary",
  notice: "border-2 border-notice bg-notice text-white",
  ingredient: "border-2 border-notice bg-background text-foreground",
};

export function BadgeChip({
  badge,
  onClick,
  compact = false,
}: {
  badge: Badge;
  onClick?: () => void;
  // 比較表など狭い場所では折り返して小さく出す
  compact?: boolean;
}) {
  const Icon = ICON[badge.kind];
  const className = cn(
    "inline-flex items-center rounded-md font-bold",
    // 狭い表では語の途中で折り返さないよう、文節で折り返す（L-20261103-31）
    compact
      ? "max-w-full gap-1 px-1.5 py-0.5 text-left text-xs leading-snug [overflow-wrap:anywhere] [word-break:auto-phrase]"
      : "min-h-9 gap-1.5 px-2.5 text-sm whitespace-nowrap",
    TONE[badge.tone],
  );
  const icon = (
    <Icon className={cn("shrink-0", compact ? "size-3.5" : "size-4")} aria-hidden="true" />
  );
  if (!onClick) {
    return (
      <span className={className}>
        {icon}
        {badge.label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        className,
        "min-h-11 shadow-sm transition-transform active:translate-y-px active:shadow-none",
      )}
    >
      {icon}
      <span>{badge.label}</span>
      {/* 狭い表では矢印を省いて文字の幅を空ける（押せることは影で示す） */}
      {!compact && <ChevronRight className="-mr-1 size-4 opacity-70" aria-hidden="true" />}
    </button>
  );
}

// バッジの種類ごとのアイコン（色ではなく形で見分けられるように）
const ICON: Record<BadgeKind, LucideIcon> = {
  abuse: ClipboardList,
  drive: Car,
  breastfeeding: Baby,
  under15: UserRound,
  under12: UserRound,
  alcohol: Wine,
  caffeine: Coffee,
  doping: Medal,
};

// 年齢（15歳未満・12歳未満は同じ製剤に併記されない）を1つの値にする。比べると商品カードで大きく出す（L-20261103-16）
export type AgeStatus = {
  badge: Badge | null;
  // 「15歳から」「15歳未満は相談」、なければ「該当なし」「未収録」
  text: string;
  state: "set" | "none" | "unloaded";
};

// unrecorded：「未収録」と出す種類（ProductView.unrecorded）
export function ageStatus(badges: Badge[], unrecorded: BadgeKind[]): AgeStatus {
  const badge = badges.find((b) => badgeRowKind(b.kind) === "under15") ?? null;
  if (badge) return { badge, text: badge.label.replace(/^年齢 /, ""), state: "set" };
  return unrecorded.includes("under15")
    ? { badge: null, text: UI_COPY.badgeUnloaded, state: "unloaded" }
    : { badge: null, text: UI_COPY.badgeNone, state: "none" };
}

export function BadgeRow({
  badges,
  group,
  unrecorded,
}: {
  badges: Badge[];
  group: NoticeGroup | null;
  unrecorded: BadgeKind[];
}) {
  const [open, setOpen] = useState<BadgeTarget | null>(null);
  // 年齢は商品カードの上に別に大きく出すので、ここでは扱わない
  const shown = badges.filter((b) => badgeRowKind(b.kind) !== "under15");
  // バッジがない種類も「該当なし」として名前を出す（何も出ないと、見落としか該当なしか区別できない）
  const absent = (Object.keys(BADGE_INFO) as BadgeKind[])
    .filter((k) => badgeRowKind(k) === k && k !== "under15")
    .filter((k) => !shown.some((b) => b.kind === k));
  // 通知を取り込んでいない薬効群や、補正で表せない種類は「該当なし」ではなく「未収録」
  const unloaded = absent.filter((k) => unrecorded.includes(k));
  const none = absent.filter((k) => !unloaded.includes(k));
  return (
    <section aria-labelledby="badges-title" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="badges-title" className="text-base font-bold">
          確認ポイント
        </h2>
        <span className="text-xs text-muted-foreground">{UI_COPY.badgeHint}</span>
      </div>
      {shown.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="この商品のバッジ">
          {shown.map((b) => (
            <li key={b.kind}>
              <BadgeChip badge={b} onClick={() => setOpen({ kind: b.kind, badge: b, group })} />
            </li>
          ))}
        </ul>
      )}
      {/* 「該当なし」「未収録」は1行ずつ。意味は名前を押すと出る */}
      {[
        { kinds: unloaded, label: UI_COPY.badgeUnloadedShort, empty: "unloaded" as const },
        { kinds: none, label: UI_COPY.badgeNone, empty: "none" as const },
      ]
        .filter((line) => line.kinds.length > 0)
        .map((line) => (
          <p
            key={line.empty}
            className={cn(
              "flex flex-wrap items-baseline gap-x-1 text-xs",
              line.empty === "unloaded" ? "text-uncertain" : "text-muted-foreground",
            )}
          >
            <span className="font-bold">{line.label}：</span>
            {line.kinds.map((k, i) => (
              <button
                key={k}
                type="button"
                onClick={() => setOpen({ kind: k, badge: null, group, empty: line.empty })}
                className="underline decoration-dotted underline-offset-2"
              >
                {BADGE_INFO[k].name}
                {i < line.kinds.length - 1 && "・"}
              </button>
            ))}
          </p>
        ))}
      <BadgeSheet target={open} onClose={() => setOpen(null)} />
    </section>
  );
}

// 何のバッジかの説明と、その商品での根拠。badge が null なら説明だけ（比べるの行見出しから開いたとき）
export type BadgeTarget = {
  kind: BadgeKind;
  badge: Badge | null;
  group: NoticeGroup | null;
  productName?: string;
  // バッジがないセルから開いたとき：その意味を添える
  empty?: "none" | "unloaded";
};

export function BadgeSheet({
  target,
  onClose,
}: {
  target: BadgeTarget | null;
  onClose: () => void;
}) {
  const info = target ? BADGE_INFO[target.kind] : null;
  const Icon = target ? ICON[target.kind] : null;
  return (
    <Sheet open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
        {target && info && Icon && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 pr-8 leading-snug">
                <Icon className="size-5" aria-hidden="true" />
                {target.badge
                  ? `${target.badge.label}${target.productName ? `（${target.productName}）` : ""}`
                  : target.empty
                    ? `${info.name}：${target.empty === "none" ? UI_COPY.badgeNone : UI_COPY.badgeUnloaded}${target.productName ? `（${target.productName}）` : ""}`
                    : info.name}
              </SheetTitle>
              <SheetDescription className="text-sm text-foreground">{info.about}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4 pb-6">
              {target.empty && (
                <p
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm",
                    target.empty === "unloaded"
                      ? "border-uncertain text-uncertain"
                      : "border-border",
                  )}
                >
                  {target.empty === "none" ? UI_COPY.badgeNoneNote : UI_COPY.badgeUnloadedNote}
                </p>
              )}
              {target.badge && (
                <>
                  <h3 className="text-sm font-bold">根拠と出典</h3>
                  {target.badge.evidence.map((e, i) => (
                    <EvidenceBlock key={i} evidence={e} group={target.group} />
                  ))}
                  {target.badge.evidence.some((e) => e.kind === "notice") && (
                    <p className="text-sm text-muted-foreground">{UI_COPY.noticeDerived}</p>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function EvidenceBlock({ evidence, group }: { evidence: Evidence; group: NoticeGroup | null }) {
  if (evidence.kind === "notice") {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <blockquote className="border-l-0 bg-muted px-3 py-2 text-base">{evidence.body}</blockquote>
        <p className="text-sm">
          当たった成分：
          <span className="font-bold">{evidence.matched.join("、") || "（全製剤に記載）"}</span>
        </p>
        {evidence.conditionText && (
          <p className="text-xs text-muted-foreground">記載条件：{evidence.conditionText}</p>
        )}
        <p className="text-xs text-muted-foreground">
          出典：厚労省通知「使用上の注意」{group?.name ?? evidence.groupId}　{evidence.section}{" "}
          {evidence.itemNo}
          {group && (
            <>
              {" "}
              （
              <a href={group.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                PDF {group.sourcePage}頁〜
              </a>
              ・取得 {group.fetchedOn}）
            </>
          )}
        </p>
      </div>
    );
  }
  if (evidence.kind === "label") {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <blockquote className="border-l-0 bg-muted px-3 py-2 text-base">{evidence.body}</blockquote>
        {evidence.matched.length > 0 && (
          <p className="text-sm">
            当たった成分：<span className="font-bold">{evidence.matched.join("、")}</span>
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {evidence.labelOnly ? UI_COPY.labelOnly : UI_COPY.labelCorrected}（{evidence.section}
          ）。出典：
          {evidence.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && "・"}
              <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                {s.label}
              </a>
            </span>
          ))}
          （確認 {evidence.checkedOn}）
        </p>
      </div>
    );
  }
  if (evidence.kind === "fact") {
    return (
      <div className="rounded-lg border border-border p-3 text-sm">
        <p>
          {evidence.ingredient}：無水カフェイン換算で{evidence.per} {evidence.amountMg}mg
        </p>
        <p className="mt-1 text-xs text-muted-foreground">出典：この商品の成分・分量（入力値）</p>
      </div>
    );
  }
  const abuse = evidence.list === "abuse";
  return (
    <div className="rounded-lg border border-border p-3 text-sm">
      <p>
        {evidence.ingredient}　→　{abuse ? "告示の成分" : "WADA禁止表"}：
        <span className="font-bold">{evidence.listed}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        出典：{evidence.source}
        {abuse ? (
          <>
            {" "}
            （
            <a href={ABUSE_SOURCE.url} target="_blank" rel="noreferrer" className="underline">
              通知の掲載元
            </a>
            ）
          </>
        ) : (
          <>
            {DOPING_SOURCE.verified ? ` ${DOPING_SOURCE.year}年版` : "（年版確認中）"}。
            {UI_COPY.dopingCheck}（
            <a href={DOPING_SOURCE.checkUrl} target="_blank" rel="noreferrer" className="underline">
              Global DRO
            </a>
            ）
          </>
        )}
      </p>
    </div>
  );
}
