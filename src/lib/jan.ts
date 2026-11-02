// JAN（EAN-13 / EAN-8）の形式とチェックデジットを確かめる
export function isValidJan(code: string): boolean {
  if (!/^\d{8}$|^\d{13}$/.test(code)) return false;
  const digits = [...code].map(Number);
  const check = digits.pop();
  // 右端（チェックデジットの隣）から 3, 1, 3, 1… の重み
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

// 全角数字や空白・ハイフンが混ざった手入力をそろえる
export function cleanJan(input: string): string {
  return input.normalize("NFKC").replace(/[^\d]/g, "");
}
