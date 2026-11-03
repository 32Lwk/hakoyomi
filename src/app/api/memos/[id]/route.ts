import type { NextRequest } from "next/server";
import { deleteMemo } from "@/lib/memos/store";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// DELETE → メモを消す（編集はできない、L-20261104-15）
export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/memos/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return Response.json({ error: "not_found" }, { status: 404 });
  const result = await deleteMemo(id);
  if (result === "deleted") return new Response(null, { status: 204 });
  return Response.json({ error: result }, { status: result === "not_found" ? 404 : 503 });
}
