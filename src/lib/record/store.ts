import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { findById } from "@/lib/catalog";
import { generateRecordDraftWithClaude } from "@/lib/record/claude";
import {
  formatRecordDraft,
  orderCheckedItems,
  verifyRecordDraft,
  type RecordDraftContext,
  type RecordInput,
} from "@/lib/record/record";
import { checkAbuse, multipleOverlaps, type CartLine } from "@/lib/rules/abuse";

// 指定濫用防止医薬品の確認記録の保存（Supabase checklist_sessions / checklist_checks）と販売記録下書き作成（T401）

function db(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

function formatJstLabels(date: Date): { full: string; shortTime: string } {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const full = `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}`;
  const shortTime = `${get("hour")}:${get("minute")}`;
  return { full, shortTime };
}

export type SaveRecordResult =
  | {
      ok: true;
      sessionId: string | null;
      savedToDb: boolean;
      recordedAt: string;
      shortTime: string;
      draft: string;
      draftSource: "claude" | "template";
      large: boolean;
      multiple: boolean;
    }
  | {
      ok: false;
      error: "unknown_product" | "not_abuse_target" | "guard_blocked";
      message: string;
    };

export async function saveAbuseRecord(input: RecordInput): Promise<SaveRecordResult> {
  const product = await findById(input.productId);
  if (!product) {
    return { ok: false, error: "unknown_product", message: "対象の商品が見つかりません" };
  }
  const abuse = checkAbuse(product);
  if (!abuse.target) {
    return {
      ok: false,
      error: "not_abuse_target",
      message: "この商品は指定濫用防止医薬品の対象ではありません",
    };
  }

  const otherIds = [...new Set(input.otherProductIds.filter((id) => id !== product.id))];
  const otherProducts = (await Promise.all(otherIds.map(findById))).filter((p) => p !== null);
  const lines: CartLine[] = [
    { product, quantity: input.quantity },
    ...otherProducts.map((p) => ({ product: p, quantity: 1 })),
  ];
  const overlaps = multipleOverlaps(lines);
  const multiple = overlaps.length > 0;

  const now = new Date();
  const { full: timeLabel, shortTime } = formatJstLabels(now);
  const orderedCodes = orderCheckedItems(input.checkedItems).map((i) => i.code);

  const ctx: RecordDraftContext = {
    productName: product.name,
    quantity: input.quantity,
    days: abuse.days,
    limitDays: abuse.limitDays,
    large: abuse.large,
    multiple,
    overlaps,
    hits: abuse.hits,
    checkedItems: orderedCodes,
    staffAlias: input.staffAlias,
    timeLabel,
  };

  // Supabase への保存と Claude による下書き作成を並行して行う
  const [dbResult, claudeDraft] = await Promise.all([
    insertChecklistToSupabase(product.id, input.quantity, input.staffAlias, orderedCodes),
    generateRecordDraftWithClaude(ctx),
  ]);

  const fallback = formatRecordDraft(ctx);
  const verifiedFallback = verifyRecordDraft(fallback);
  const draft = claudeDraft ?? (verifiedFallback.ok ? verifiedFallback.text : null);
  if (!draft) {
    return {
      ok: false,
      error: "guard_blocked",
      message: "表示できない表現が含まれたため省略しました",
    };
  }

  return {
    ok: true,
    sessionId: dbResult.sessionId,
    savedToDb: dbResult.saved,
    recordedAt: timeLabel,
    shortTime,
    draft,
    draftSource: claudeDraft ? "claude" : "template",
    large: abuse.large,
    multiple,
  };
}

async function insertChecklistToSupabase(
  productId: string,
  quantity: number,
  staffAlias: string,
  checkedItems: string[],
): Promise<{ saved: boolean; sessionId: string | null }> {
  const client = db();
  if (!client) return { saved: false, sessionId: null };
  try {
    const { data: session, error: sessionErr } = await client
      .from("checklist_sessions")
      .insert({
        staff_alias: staffAlias,
        product_id: productId,
        quantity,
      })
      .select("id")
      .single();
    if (sessionErr || !session) {
      console.error("record: checklist_sessions 保存エラー", sessionErr?.message);
      return { saved: false, sessionId: null };
    }
    const sessionId = (session as { id: string }).id;
    const { error: checksErr } = await client.from("checklist_checks").insert(
      checkedItems.map((item_code) => ({
        session_id: sessionId,
        item_code,
      })),
    );
    if (checksErr) {
      console.error("record: checklist_checks 保存エラー", checksErr.message);
      return { saved: false, sessionId };
    }
    return { saved: true, sessionId };
  } catch (err) {
    console.error("record: Supabase 接続エラー", err instanceof Error ? err.message : "unknown");
    return { saved: false, sessionId: null };
  }
}
