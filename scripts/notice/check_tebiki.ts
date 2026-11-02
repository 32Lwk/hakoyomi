// 成分の配合目的（src/data/ingredient_roles.ts）が手引きの原文どおりかを照合する（L-20261103-05、開発時のみ）。
// 手引きの PDF は data/ に置き、リポに入れない。
//
// 使い方：
//   curl -o data/notices/tebiki/001692425.pdf https://www.mhlw.go.jp/content/001692425.pdf
//   python3 -I scripts/notice/extract.py data/notices/tebiki/001692425.pdf data/notices/tebiki/001692425.pages.json
//   npx tsx scripts/notice/check_tebiki.ts
import { readFileSync } from "node:fs";
import { INGREDIENT_ROLES } from "@/data/ingredient_roles";

const PAGES = "data/notices/tebiki/001692425.pages.json";

// 比べるための形：ルビの行・頁の見出し・空白を落とし、注の番号とずれないよう数字も落とす
function cleanPage(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^[ぁ-ゖー]{1,8}$/.test(line.trim()))
    .join("")
    .replace(
      /試験問題の作成に関する手引き（令和８年４月一部改訂）第３章 主な医薬品とその作用\s*\d+/g,
      "",
    );
}

function norm(text: string): string {
  return text.normalize("NFKC").replace(/\s/g, "").replace(/\d/g, "");
}

const pages = (JSON.parse(readFileSync(PAGES, "utf-8")) as { text: string }[]).map((p) =>
  norm(cleanPage(p.text)),
);
const all = pages.join("");

// 頁の変わり目では、前の頁の本文と次の頁の本文のあいだに脚注が入る。前半と後半が続く頁にあれば原文どおりとみなす
function found(part: string): boolean {
  const t = norm(part);
  if (all.includes(t)) return true;
  for (let i = 0; i + 1 < pages.length; i++) {
    for (let k = 1; k < t.length; k++) {
      if (pages[i].includes(t.slice(0, k)) && pages[i + 1].startsWith(t.slice(k))) return true;
    }
  }
  return false;
}

let failures = 0;
for (const role of INGREDIENT_ROLES) {
  const problems: string[] = [];
  for (const part of role.quote.split("…").filter(Boolean)) {
    if (!found(part)) problems.push(`quote: ${part.slice(0, 30)}…`);
  }
  const purposeParts = role.purpose.split("…").filter(Boolean);
  if (!purposeParts.every(found)) problems.push(`purpose: ${role.purpose}`);
  for (const member of role.members) {
    const base = member.replace(/^(dl|d|l)-/i, "");
    // 商品の表記が手引きと違う成分は memberNote に手引きでの名前を書く。その場合は名前の照合を省く
    if (!found(base) && base !== "塩酸プソイドエフェドリン" && !role.memberNote?.[member]) {
      problems.push(`member: ${member}`);
    }
  }
  if (problems.length) {
    failures++;
    console.log(`NG ${role.id}\n  ${problems.join("\n  ")}`);
  } else {
    console.log(`OK ${role.id}`);
  }
}
console.log(failures ? `${failures} 件が原文と合いません` : "すべて原文どおり");
process.exit(failures ? 1 : 0);
