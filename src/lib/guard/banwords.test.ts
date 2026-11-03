import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { findBanwords } from "@/lib/guard/banwords";

describe("findBanwords", () => {
  it("推奨・可否の表現を検出する", () => {
    expect(findBanwords("こちらがおすすめです")).toEqual(["おすすめ"]);
    expect(findBanwords("この薬は効きます")).toEqual(expect.arrayContaining(["効きます"]));
    expect(findBanwords("1日3回飲んでください")).toEqual(["1日3回飲んで"]);
  });

  it("事実と出典の表現は通す", () => {
    expect(findBanwords("この行の分量が異なります")).toEqual([]);
    expect(findBanwords("判断は販売者が行ってください")).toEqual([]);
    expect(
      findBanwords("該当する記載が見つかりません。添付文書（PMDA）で確認してください"),
    ).toEqual([]);
  });

  it("通知の原文の言い回しは通し、同じ語の別の使い方は止める（L-20261104-12）", () => {
    expect(findBanwords("体の虚弱な人（体力の衰えている人、体の弱い人）。")).toEqual([]);
    expect(findBanwords("胃腸の弱い人。")).toEqual([]);
    expect(findBanwords("次の診断を受けた人。高血圧、心臓病")).toEqual([]);
    expect(findBanwords("こちらは効き目が弱い")).toEqual(expect.arrayContaining(["弱い"]));
    expect(findBanwords("AIが診断します")).toEqual(["診断"]);
    expect(findBanwords("胃腸の弱い人には弱い薬")).toEqual(["弱い"]);
  });
});

// 画面とAPIのソースに禁止語が直接書かれていないことを確かめる（禁止語リストとテストは除く）
describe("src に禁止語がない", () => {
  const root = join(import.meta.dirname, "..", "..");
  const skip = new Set(["lib/guard/banwords.ts"]);

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : [];
    });
  }

  for (const file of sourceFiles(root)) {
    const rel = relative(root, file);
    if (skip.has(rel)) continue;
    it(rel, () => {
      expect(findBanwords(readFileSync(file, "utf8"))).toEqual([]);
    });
  }
});
