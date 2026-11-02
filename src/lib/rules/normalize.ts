// 成分名の表記ゆれ（全角・半角、「dl－」「dl-」、空白）をそろえて比べる
export function normalizeName(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[\s　]/g, "")
    .replace(/[‐‑‒–—―−]/g, "-")
    .toLowerCase();
}

export function sameName(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
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
