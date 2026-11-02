"use client";

import { ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TEBIKI_SOURCE, type IngredientRole } from "@/data/ingredient_roles";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { ingredientRole } from "@/lib/ingredientRole";
import { KIND_LABEL } from "@/lib/illustration";
import type { MedicineKind } from "@/lib/schema/product";

// 成分をタップしたときの「配合目的」。手引きの見出しと1文を抜き出しのまま出し、章・頁を添える（L-20261103-05）
export type IngredientTarget = {
  ingredient: string;
  // この成分を含む商品の薬効群（比べるでは複数。薬効群で書き方が違うことがある）
  products: { name: string; kind: MedicineKind }[];
};

export function IngredientSheet({
  target,
  onClose,
}: {
  target: IngredientTarget | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
        {target && (
          <>
            <SheetHeader>
              <SheetTitle className="leading-snug">{target.ingredient}</SheetTitle>
              <SheetDescription>{UI_COPY.purposeTitle}（厚労省の手引きより）</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4 pb-6">
              {byRole(target).map(({ role, kind, names }) => (
                <RoleBlock
                  key={role?.id ?? kind}
                  role={role}
                  ingredient={target.ingredient}
                  // 比べるで薬効群が分かれるときだけ、どの商品の話かを出す
                  heading={
                    target.products.length > 1 ? `${KIND_LABEL[kind]}：${names.join("、")}` : null
                  }
                />
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// 同じ記載に当たる商品はまとめる
function byRole(target: IngredientTarget) {
  const out: { role: IngredientRole | null; kind: MedicineKind; names: string[] }[] = [];
  for (const p of target.products) {
    const role = ingredientRole(p.kind, target.ingredient);
    const same = out.find((o) => (role ? o.role?.id === role.id : !o.role && o.kind === p.kind));
    if (same) same.names.push(p.name);
    else out.push({ role, kind: p.kind, names: [p.name] });
  }
  return out;
}

function RoleBlock({
  role,
  ingredient,
  heading,
}: {
  role: IngredientRole | null;
  ingredient: string;
  heading: string | null;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-border p-3">
      {heading && <h3 className="text-xs font-bold text-muted-foreground">{heading}</h3>}
      {role ? (
        <>
          <p className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-accent px-2 py-0.5 text-sm font-bold text-accent-foreground">
              {role.group}
            </span>
            {!TEBIKI_SOURCE.verifiedOn && (
              <span className="rounded border border-uncertain px-1.5 text-[11px] text-uncertain">
                {UI_COPY.tebikiPending}
              </span>
            )}
          </p>
          <p className="text-base font-bold">「{role.purpose}」</p>
          <blockquote className="rounded-lg bg-muted px-3 py-2 text-sm leading-relaxed">
            {role.quote}
          </blockquote>
          {role.memberNote?.[ingredient] && (
            <p className="text-xs text-muted-foreground">{role.memberNote[ingredient]}</p>
          )}
          <p className="text-xs text-muted-foreground">
            出典：{TEBIKI_SOURCE.publisher}「{TEBIKI_SOURCE.title}」第3章 {role.section}（
            {role.page}
            頁）・取得 {TEBIKI_SOURCE.fetchedOn}{" "}
            <a
              href={TEBIKI_SOURCE.pageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 underline"
            >
              掲載ページ
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </p>
        </>
      ) : (
        <p className="text-sm">{UI_COPY.tebikiMissing}</p>
      )}
    </section>
  );
}
