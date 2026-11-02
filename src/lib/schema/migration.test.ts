import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BadgeKind, NoticeSection } from "./notice";
import { DosageRoute, MedicineKind, RiskClass } from "./product";

const DIR = "supabase/migrations";
const sql = readdirSync(DIR)
  .filter((file) => file.endsWith(".sql"))
  .map((file) => readFileSync(`${DIR}/${file}`, "utf8"))
  .join("\n");

const tables = [...sql.matchAll(/create table (\w+)/g)].map((m) => m[1]);

// CHECK 制約 `<column> in ('a', 'b', …)` の値
function checkValues(column: string): string[] {
  const match = sql.match(new RegExp(`${column} in \\(([^)]*)\\)`));
  if (!match) throw new Error(`${column} の CHECK 制約がない`);
  return [...match[1].matchAll(/'([^']*)'/g)].map((m) => m[1]).sort();
}

describe("migration", () => {
  it("全表で RLS を有効にする", () => {
    expect(tables.length).toBeGreaterThan(0);
    for (const table of tables)
      expect(sql).toContain(`alter table ${table} enable row level security;`);
  });

  it("お客様の個人情報・健康情報・質問入力のカラムを作らない（rules）", () => {
    const columns = sql.replace(/--.*$/gm, "");
    expect(columns).not.toMatch(
      /\b(customer|patient|symptom|disease|diagnosis|age|gender|phone|email|address|birth|query|question|prompt)\w*\b/i,
    );
  });

  it("CHECK 制約の値が zod の enum と同じ", () => {
    expect(checkValues("section")).toEqual([...NoticeSection.options].sort());
    expect(checkValues("badge")).toEqual([...BadgeKind.options].sort());
    expect(checkValues("risk_class")).toEqual([...RiskClass.options].sort());
    expect(checkValues("kind")).toEqual([...MedicineKind.options].sort());
    expect(checkValues("route")).toEqual([...DosageRoute.options].sort());
  });
});
