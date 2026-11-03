// 成分名の表記ゆれ（全角・半角、「dl－」「dl-」、空白）をそろえて比べる
export function normalizeName(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[\s　]/g, "")
    .replace(/[‐‑‒–—―−]/g, "-")
    .toLowerCase();
}

// 塩の旧表記「塩酸プソイドエフェドリン」を今の表記「プソイドエフェドリン塩酸塩」にそろえる（L-20261103-28）。
// 既存データの成分名は旧表記が残っていて、通知の記載条件（今の表記）と照合できない
const SALT_PREFIX = /^((?:dl|d|l)-)?(塩酸|硫酸|マレイン酸|リン酸|臭化水素酸)(.+)$/;

// 漢方製剤の通知は生薬を漢字（「甘草として」「大黄」）でも書き、入力値はカタカナ（カンゾウ・ダイオウ）。
// 同じ生薬として照合する（L-20261104-09）
const CRUDE_DRUG_KANA: Record<string, string> = {
  甘草: "カンゾウ",
  大黄: "ダイオウ",
  麻黄: "マオウ",
  附子: "ブシ",
  芒硝: "ボウショウ",
};

export function canonicalName(name: string): string {
  const n = normalizeName(CRUDE_DRUG_KANA[normalizeName(name)] ?? name);
  const m = n.match(SALT_PREFIX);
  return m ? `${m[1] ?? ""}${m[3]}${m[2]}塩` : n;
}

export function sameName(a: string, b: string): boolean {
  return canonicalName(a) === canonicalName(b);
}

// 単位をそろえて mg にする
export function toMg(amount: number, unit: "mg" | "g" | "µg" | "mL"): number | null {
  switch (unit) {
    case "mg":
      return amount;
    case "g":
      return amount * 1000;
    case "µg":
      return amount / 1000;
    case "mL":
      return null;
  }
}
