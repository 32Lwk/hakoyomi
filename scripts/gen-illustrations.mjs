// 薬の種類イラスト（12種×3パターン）を public/illustrations/ に SVG で書き出す。
// 実在の商品を描いたものではなく、薬の種類を表すイメージ図（L-20261102-33）。
// 実行：node scripts/gen-illustrations.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "illustrations");

const C = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
const R = (x, y, w, h, r) =>
  !r
    ? `M${x} ${y}h${w}v${h}h${-w}z`
    : `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;

// a=濃い主色 b=明るい色 c=暗い色 t=背景の薄い色。種類ごとに固定
export const CAT = {
  cold: { label: "かぜ薬", a: "#D9534F", b: "#F2A19E", c: "#A33532", t: "#FDECEC" },
  fever: { label: "解熱鎮痛薬", a: "#E8833A", b: "#F6BE8F", c: "#B45F1F", t: "#FDF0E4" },
  cough: { label: "せき止め", a: "#8E5BD0", b: "#C9AEEE", c: "#643C9E", t: "#F3ECFC" },
  rhinitis: { label: "鼻炎薬", a: "#1F9D6B", b: "#7FD1AE", c: "#157350", t: "#E4F6EE" },
  nasal: { label: "点鼻薬", a: "#2A9FBF", b: "#86CFE2", c: "#1C7590", t: "#E3F4F9" },
  stomach: { label: "胃腸薬", a: "#6B8E23", b: "#B5CC7A", c: "#4B6418", t: "#EFF4E2" },
  eye: { label: "目薬", a: "#3E7BE6", b: "#9DBDF4", c: "#2756A8", t: "#E8F0FD" },
  topical: { label: "外用薬", a: "#C2577E", b: "#E9A7C0", c: "#8F3B5B", t: "#FBEAF1" },
  vitamin: { label: "ビタミン剤", a: "#E8A700", b: "#F6D46B", c: "#A87800", t: "#FDF5DC" },
  sleep: { label: "睡眠改善薬", a: "#3B3F8F", b: "#9599D6", c: "#272A63", t: "#ECEDF8" },
  kampo: { label: "漢方薬", a: "#8A6A3F", b: "#CDB38C", c: "#5F4826", t: "#F5EEE3" },
  motion: {
    label: "乗り物酔い薬",
    short: "酔い止め",
    a: "#5E7FA3",
    b: "#A9BDD3",
    c: "#3F5A78",
    t: "#EBF0F6",
  },
};

const ALMOND = "M18 50c10-14 22-20 32-20s22 6 32 20c-10 14-22 20-32 20S28 64 18 50z";
const TISSUE = "M40 50c-2-12 6-20 10-26 4 6 12 14 10 26z";

// レイヤー：w=白(下) a=主色 b=明色 c=暗色 h=白(上) l=暗色の線 x=白の線
const SYM = {
  cold: {
    a: R(24, 38, 52, 30, 10),
    b: R(29, 41, 22, 4, 2),
    l: "M30 51h40M30 59h40M24 44c-9 0-11 16 0 18M76 44c9 0 11 16 0 18",
  },
  fever: {
    w: R(44, 18, 12, 50, 6),
    a: C(50, 72, 11) + R(47, 38, 6, 32, 3),
    l: R(44, 18, 12, 50, 6) + "M60 28h7M60 36h7M60 44h7M60 52h5",
    h: C(46, 69, 3),
  },
  cough: {
    a: "M26 30h40a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H46l-12 10v-10h-8a8 8 0 0 1-8-8V38a8 8 0 0 1 8-8z",
    h: C(36, 48, 4) + C(46, 48, 4) + C(56, 48, 4),
    l: "M80 36c4 4 4 12 0 16M87 30c7 7 7 21 0 28",
  },
  rhinitis: {
    a: R(22, 46, 56, 30, 6),
    b: R(26, 66, 48, 3, 1.5),
    c: R(38, 48, 24, 5, 2.5),
    h: TISSUE,
    l: TISSUE,
  },
  nasal: {
    a: "M50 18c10 14 18 24 18 36a18 18 0 0 1-36 0c0-12 8-22 18-36z",
    b: C(76, 30, 5) + C(26, 36, 4),
    h: C(43, 60, 4),
  },
  stomach: {
    a: "M42 22h8v14c0 4 4 6 8 6 12 0 18 8 16 18-2 12-14 18-26 16-12-2-18-12-12-20 4-4 8-4 10-2v-14c0-4-4-6-4-10z",
    b: C(60, 60, 6),
    h: C(57, 57, 2.5),
  },
  eye: { w: ALMOND, a: C(50, 50, 12), c: C(50, 50, 5), h: C(46, 46, 3), l: ALMOND },
  topical: {
    a: R(14, 38, 72, 24, 12),
    b: R(38, 40, 24, 20, 4),
    c: C(44, 46, 1.8) + C(56, 46, 1.8) + C(44, 54, 1.8) + C(56, 54, 1.8) + C(50, 50, 1.8),
  },
  vitamin: {
    a: C(50, 50, 30),
    b: C(50, 50, 24),
    x: "M50 28v44M28 50h44M34 34l32 32M66 34L34 66",
    h: C(50, 50, 4),
  },
  sleep: {
    a: "M60 20A30 30 0 1 0 82 64A24 24 0 0 1 60 20Z",
    b: "M28 24l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM80 28l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z",
  },
  kampo: {
    a: "M24 76C24 46 42 26 76 24c0 34-18 52-52 52z",
    x: "M28 72L64 36M44 56l-1-12M54 46l11 1",
  },
  motion: {
    a: "M18 60v-8c0-4 2-6 6-7l8-2 8-10c2-2 4-3 7-3h16c3 0 5 1 7 4l6 9 4 1c3 1 4 3 4 6v10z",
    c: C(32, 62, 7) + C(70, 62, 7),
    h: "M42 36h10v8H36zM56 36h10l5 8H56z" + C(32, 62, 3) + C(70, 62, 3),
    l: "M8 74c4-3 8 3 12 0M80 76c4-3 8 3 12 0",
  },
};

const CRIMP13 = "M24 30l4-3l4 3l4-3l4 3l4-3l4 3l4-3l4 3l4-3l4 3l4-3l4 3l4-3";
const CRIMP12 = "M26 26l4-3l4 3l4-3l4 3l4-3l4 3l4-3l4 3l4-3l4 3l4-3l4 3";
const CAP_L = "M22 38h28v24H22a12 12 0 0 1 0-24z";
const CAP_R = "M50 38h28a12 12 0 0 1 0 24H50z";
const DROP = "M36 44h28v34c0 4-3 6-6 6H42c-3 0-6-2-6-6z";
const FORM = {
  cold: { a: C(40, 46, 17), b: C(66, 62, 14), x: "M27 46h26M56 62h20", h: C(34, 39, 3) },
  fever: {
    b: R(24, 16, 52, 68, 8),
    c: [32, 50, 68].map((y) => C(40, y, 7) + C(60, y, 7)).join(""),
    h: [30, 48, 66].map((y) => C(38, y, 2) + C(58, y, 2)).join(""),
  },
  cough: {
    a: R(32, 36, 36, 48, 8),
    b: R(42, 28, 16, 10, 2),
    c: R(38, 16, 24, 14, 3),
    h: R(37, 50, 26, 20, 3),
    l: "M42 57h16M42 63h12",
  },
  rhinitis: { w: CAP_R, a: CAP_L, b: R(18, 42, 22, 4, 2), l: CAP_L + CAP_R },
  nasal: {
    w: R(34, 42, 32, 42, 10),
    a: "M34 54h32v-6c0-4-4-8-8-8H42c-4 0-8 4-8 8z",
    c: "M44 40V22c0-3 2-6 6-6s6 3 6 6v18z",
    b: R(38, 60, 24, 16, 3),
    l: R(34, 42, 32, 42, 10),
  },
  stomach: { a: R(24, 26, 52, 48, 6), h: R(32, 38, 36, 24, 3), l: CRIMP13 + "M38 47h24M38 53h16" },
  eye: {
    w: DROP,
    a: R(42, 14, 16, 18, 4),
    b: "M44 32h12l-2 12h-8z",
    c: R(36, 58, 28, 12, 0),
    l: DROP,
  },
  topical: {
    a: "M18 40h52l12 6v8l-12 6H18z",
    c: R(82, 44, 10, 12, 2),
    h: R(26, 44, 32, 12, 2),
    l: "M22 40v20M32 50h20",
  },
  vitamin: {
    w: R(30, 36, 40, 46, 10),
    a: R(32, 22, 36, 16, 4),
    b: R(34, 52, 32, 20, 4),
    c: C(44, 62, 4) + C(56, 62, 4),
    l: R(30, 36, 40, 46, 10),
  },
  sleep: { a: C(50, 50, 26), h: "M56 34a17 17 0 1 0 10 28 13 13 0 1 1-10-28z" },
  kampo: {
    a: R(26, 20, 48, 60, 6),
    b: R(33, 32, 34, 36, 4),
    c: "M38 62c0-14 10-22 24-22 0 16-10 22-24 22z",
    l: CRIMP12,
  },
  motion: {
    a: "M40 28h20v8c4 4 6 8 6 14v28c0 4-2 6-6 6H40c-4 0-6-2-6-6V50c0-6 2-10 6-14z",
    c: R(42, 16, 16, 12, 2),
    h: R(36, 52, 28, 18, 3),
    l: "M41 58h18M41 64h12",
  },
};
const BOX = {
  b: "M18 24L32 12h52L70 24z",
  c: "M70 24l14-12v66L70 90z",
  w: R(18, 24, 52, 66, 0),
  a: R(18, 24, 52, 22, 0),
  l: R(18, 24, 52, 66, 0),
};

function layers(L, k, sw = 2.5) {
  const out = [];
  if (L.t) out.push(`<path d="${L.t}" fill="${k.t}"/>`);
  if (L.w) out.push(`<path d="${L.w}" fill="#FFFFFF"/>`);
  if (L.a) out.push(`<path d="${L.a}" fill="${k.a}"/>`);
  if (L.b) out.push(`<path d="${L.b}" fill="${k.b}"/>`);
  if (L.c) out.push(`<path d="${L.c}" fill="${k.c}"/>`);
  if (L.h) out.push(`<path d="${L.h}" fill="#FFFFFF"/>`);
  if (L.l)
    out.push(
      `<path d="${L.l}" fill="none" stroke="${k.c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`,
    );
  if (L.x)
    out.push(
      `<path d="${L.x}" fill="none" stroke="#FFFFFF" stroke-width="${sw + 0.5}" stroke-linecap="round" stroke-linejoin="round"/>`,
    );
  return out.join("\n  ");
}

function svg(kind, pattern) {
  const k = CAT[kind];
  let body;
  if (pattern === "form") body = layers({ t: R(4, 4, 92, 92, 22), ...FORM[kind] }, k);
  else if (pattern === "symbol") body = layers({ t: C(50, 50, 46), ...SYM[kind] }, k);
  else
    body = [
      layers(BOX, k),
      `<text x="44" y="39" text-anchor="middle" font-family="'Noto Sans JP', 'Hiragino Sans', sans-serif" font-size="${(k.short ?? k.label).length >= 5 ? 8.5 : 10}" font-weight="900" fill="#FFFFFF">${k.short ?? k.label}</text>`,
      `<svg x="24" y="48" width="40" height="40" viewBox="0 0 100 100">\n  ${layers(SYM[kind], k, 3)}\n  </svg>`,
    ].join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${k.label}のイメージ図">\n  <title>${k.label}のイメージ図</title>\n  ${body}\n</svg>\n`;
}

mkdirSync(OUT, { recursive: true });
let n = 0;
for (const kind of Object.keys(CAT)) {
  for (const pattern of ["box", "form", "symbol"]) {
    writeFileSync(join(OUT, `${kind}-${pattern}.svg`), svg(kind, pattern));
    n++;
  }
}
writeFileSync(
  join(OUT, "index.json"),
  JSON.stringify(
    Object.fromEntries(
      Object.entries(CAT).map(([kind, c]) => [
        kind,
        { label: c.label, colors: { a: c.a, b: c.b, c: c.c, t: c.t } },
      ]),
    ),
    null,
    2,
  ) + "\n",
);
console.log(`wrote ${n} svg files to ${OUT}`);
