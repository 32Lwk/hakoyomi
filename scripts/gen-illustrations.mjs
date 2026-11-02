// 薬の種類イラスト（12種×11パターン）を public/illustrations/ に SVG で書き出す。
// 実在の商品を描いたものではなく、薬の種類を表すイメージ図（L-20261102-33、L-35・L-36 でパターン追加）。
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
const E = (x, y, rx, ry) =>
  `M${x - rx} ${y}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`;
const f1 = (n) => Math.round(n * 10) / 10;
// 中心(cx,cy)で deg 度回した長方形
const RR = (cx, cy, w, h, deg) => {
  const t = (deg * Math.PI) / 180;
  const pts = [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ].map(
    ([x, y]) =>
      `${f1(cx + x * Math.cos(t) - y * Math.sin(t))} ${f1(cy + x * Math.sin(t) + y * Math.cos(t))}`,
  );
  return `M${pts.join("L")}z`;
};
// カプセルの左右（縦なら上下）の半分
const capsule = (x, y, w, h, vertical) => {
  if (vertical) {
    const r = w / 2;
    return {
      p: `M${x} ${y + h / 2}V${y + r}a${r} ${r} 0 0 1 ${w} 0V${y + h / 2}z`,
      q: `M${x} ${y + h / 2}h${w}V${y + h - r}a${r} ${r} 0 0 1 ${-w} 0z`,
    };
  }
  const r = h / 2;
  return {
    p: `M${x + w / 2} ${y}v${h}H${x + r}a${r} ${r} 0 0 1 0 ${-h}z`,
    q: `M${x + w / 2} ${y}H${x + w - r}a${r} ${r} 0 0 1 0 ${h}H${x + w / 2}z`,
  };
};

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

// 2つめのモチーフ（symbol2・box2）
const GERM = [0, 45, 90, 135, 180, 225, 270, 315].map((d) => (d * Math.PI) / 180);
const BAND = RR(50, 50, 72, 22, -45);
const SYM2 = {
  cold: {
    a:
      C(50, 50, 20) +
      GERM.map((t) => C(f1(50 + 29 * Math.cos(t)), f1(50 + 29 * Math.sin(t)), 5)).join(""),
    b: C(44, 45, 5) + C(57, 54, 4) + C(45, 58, 3),
    l: GERM.map(
      (t) =>
        `M${f1(50 + 19 * Math.cos(t))} ${f1(50 + 19 * Math.sin(t))}L${f1(50 + 26 * Math.cos(t))} ${f1(50 + 26 * Math.sin(t))}`,
    ).join(""),
  },
  fever: {
    a: "M24 50c0-14 11-22 26-22s26 8 26 22c0 16-11 28-26 28S24 66 24 50z",
    c: R(41, 14, 18, 14, 3),
    h: R(36, 42, 12, 12, 2.5) + R(52, 46, 12, 12, 2.5) + R(42, 58, 12, 12, 2.5),
  },
  cough: {
    a:
      "M45 40v28c0 6-5 10-12 9-7-1-12-7-12-15 0-13 7-24 15-28 5-2 9 0 9 6z" +
      "M55 40v28c0 6 5 10 12 9 7-1 12-7 12-15 0-13-7-24-15-28-5-2-9 0-9 6z",
    h: E(31, 56, 3, 5) + E(69, 56, 3, 5),
    l: "M50 16v22M50 38l-5 6M50 38l5 6",
  },
  rhinitis: {
    b: [0, 60, 120, 180, 240, 300]
      .map((d) =>
        C(
          f1(50 + 13 * Math.cos((d * Math.PI) / 180)),
          f1(40 + 13 * Math.sin((d * Math.PI) / 180)),
          8,
        ),
      )
      .join(""),
    a: C(50, 40, 8),
    c: C(80, 22, 2.5) + C(86, 31, 2) + C(18, 24, 2.5) + C(14, 34, 2),
    l: "M50 54v28M50 72c-5-6-13-7-18-3M50 76c5-6 13-7 18-3",
  },
  nasal: {
    a: "M22 16h26c2 12 8 22 16 32 4 5 2 11-4 11h-4v9c0 7-5 12-12 12H22z",
    c: E(52, 56, 3.5, 2),
    b: C(72, 46, 3.5) + C(80, 54, 3) + C(72, 62, 2.5),
    h: C(36, 36, 3),
  },
  stomach: {
    b: "M28 52c0-12 10-18 22-18s22 6 22 18z",
    a: "M18 52h64c0 16-14 26-32 26S18 68 18 52z",
    c: R(40, 76, 20, 6, 2),
    l: "M58 16l26 24M66 14l22 20",
  },
  eye: {
    a: "M50 14c6 9 10 15 10 21a10 10 0 0 1-20 0c0-6 4-12 10-21z",
    h: C(46, 36, 2.5),
    l: "M20 56c10 11 50 11 60 0M28 64l-4 6M40 69l-2 7M60 69l2 7M72 64l4 6",
  },
  topical: {
    a: RR(50, 50, 72, 22, 45),
    b: BAND,
    h: RR(50, 50, 18, 18, 45),
    c: C(50, 44, 1.6) + C(50, 56, 1.6) + C(44, 50, 1.6) + C(56, 50, 1.6),
    l: BAND,
  },
  vitamin: {
    a: C(50, 56, 26),
    c: "M51 31c2-10 10-14 20-12-2 10-10 14-20 12z",
    b: C(60, 64, 1.8) + C(66, 54, 1.8) + C(55, 73, 1.8) + C(70, 66, 1.6),
    l: "M50 31v-7",
    x: "M34 52a17 17 0 0 1 8-11",
  },
  sleep: {
    a: R(16, 44, 68, 34, 15),
    b: R(24, 49, 52, 6, 3),
    l: "M56 14h11l-11 13h11M74 26h8l-8 9h8",
    x: "M30 68c10 4 30 4 40 0",
  },
  kampo: {
    c: "M60 14l9 5-15 35-7-4z",
    a: "M18 52h64c0 16-14 28-32 28S18 68 18 52z",
    b: R(15, 47, 70, 9, 4.5),
    x: "M30 64c6 6 14 8 20 8",
  },
  motion: {
    b: "M52 18v34H28zM57 26v26h16z",
    a: "M16 58h68l-9 15H25z",
    l: "M55 14v44M8 82c5-4 11 4 17 0s11-4 17 0 11 4 17 0 11-4 17 0 7 3 9 1",
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
// 2つめの剤形（form2）
const CAPS = [capsule(14, 24, 46, 20), capsule(34, 58, 46, 20), capsule(68, 12, 20, 42, true)];
const FORM2 = {
  cold: {
    a: R(24, 14, 22, 72, 4),
    b: R(54, 14, 22, 72, 4),
    h: R(28, 32, 14, 34, 2) + R(58, 32, 14, 34, 2),
    l: "M27 21h16M27 79h16M57 21h16M57 79h16",
  },
  fever: {
    w: R(28, 30, 44, 56, 9),
    c: R(31, 14, 38, 17, 4),
    a: R(28, 44, 44, 26, 0),
    h: C(41, 57, 5.5) + C(59, 57, 5.5),
    l: R(28, 30, 44, 56, 9),
  },
  cough: {
    c: C(50, 55, 32),
    a: C(50, 50, 32),
    b: C(50, 50, 25),
    h: R(30, 40, 40, 18, 4),
    l: "M37 49h26",
  },
  rhinitis: {
    w: CAPS.map((c) => c.q).join(""),
    a: CAPS.map((c) => c.p).join(""),
    h: R(20, 28, 14, 3, 1.5) + R(40, 62, 14, 3, 1.5) + R(72, 20, 3, 12, 1.5),
    l: CAPS.map((c) => c.p + c.q).join(""),
  },
  nasal: {
    c: R(42, 12, 16, 22, 8),
    a: R(35, 30, 30, 58, 13),
    b: R(35, 30, 30, 7, 3.5),
    h: R(41, 44, 18, 30, 4),
    l: "M45 53h10M45 59h7",
  },
  stomach: {
    a: R(12, 28, 23, 50, 3) + R(38.5, 20, 23, 50, 3) + R(65, 28, 23, 50, 3),
    c: R(12, 28, 23, 6, 0) + R(38.5, 20, 23, 6, 0) + R(65, 28, 23, 6, 0),
    h: R(16, 42, 15, 22, 2) + R(42.5, 34, 15, 22, 2) + R(69, 42, 15, 22, 2),
  },
  eye: {
    a: "M18 40h44l-7 36H25z",
    b: "M21 50h38l-5 24H26z",
    w: R(66, 42, 20, 36, 5),
    c: R(70, 26, 12, 16, 3),
    h: R(23, 43, 4, 18, 2),
    l: R(66, 42, 20, 36, 5) + "M70 54h12",
  },
  topical: {
    w: R(22, 42, 56, 38, 9),
    a: R(22, 52, 56, 16, 0),
    c: R(19, 26, 62, 18, 5),
    h: R(26, 30, 18, 4, 2),
    l: R(22, 42, 56, 38, 9),
  },
  vitamin: {
    c: R(24, 12, 30, 12, 3) + C(76, 36, 3) + C(82, 28, 2) + C(74, 22, 2.5),
    a: R(22, 22, 34, 66, 6),
    h: R(27, 40, 24, 30, 3),
    b: C(74, 66, 14),
    x: "M65 66h18",
  },
  sleep: {
    a: E(36, 40, 20, 13) + E(64, 66, 20, 13),
    b: E(72, 30, 11, 7.5),
    h: E(29, 35, 7, 3) + E(57, 61, 7, 3) + E(68, 28, 4, 2),
  },
  kampo: {
    c: R(16, 78, 64, 6, 3),
    a: "M20 44h56c0 18-11 32-28 32S20 62 20 44z",
    b: E(48, 44, 28, 5),
    l: "M76 50c9 0 11 13 0 15M40 34c-4-6 4-10 0-16M54 34c-4-6 4-10 0-16",
  },
  motion: {
    a: C(34, 40, 16) + C(66, 46, 14) + C(46, 72, 14),
    b: C(46, 72, 9),
    x: "M23 40h22M57 46h18",
    h: C(29, 35, 2.5) + C(61, 41, 2),
  },
};
const BOX = {
  b: "M18 24L32 12h52L70 24z",
  c: "M70 24l14-12v66L70 90z",
  w: R(18, 24, 52, 66, 0),
  a: R(18, 24, 52, 22, 0),
  l: R(18, 24, 52, 66, 0),
};
// 横長の箱（box2）。下の帯に種類名
const BOX2 = {
  b: "M10 30l12-12h70L80 30z",
  c: "M80 30l12-12v50L80 80z",
  w: R(10, 30, 70, 50, 0),
  a: R(10, 64, 70, 16, 0),
  l: R(10, 30, 70, 50, 0),
};
// 縦長スリム箱（slim）。斜めの帯＋剤形
const SLIM = {
  b: "M30 16l9-8h36l-9 8z",
  c: "M66 16l9-8v76l-9 8z",
  w: R(30, 16, 36, 76, 0),
  a: "M30 70L66 58V80L30 92z",
  l: R(30, 16, 36, 76, 0),
};
// 正方形の箱（square）。色の面に白い丸窓
const SQUARE = {
  b: "M12 30l12-12h64L76 30z",
  c: "M76 30l12-12v58L76 88z",
  a: R(12, 30, 64, 58, 0),
  h: C(44, 51, 18),
  l: R(12, 30, 64, 58, 0),
};
// スタンドパウチ（pouch）
const POUCH = {
  b: R(20, 10, 60, 12, 3),
  w: "M20 22h60l4 62c0 4-2 6-6 6H22c-4 0-6-2-6-6z",
  c: R(20, 22, 60, 4, 0),
  a: "M18 60h64l2 24c0 4-2 6-6 6H22c-4 0-6-2-6-6z",
  h: C(50, 16, 3),
  l: "M20 22h60l4 62c0 4-2 6-6 6H22c-4 0-6-2-6-6z",
};
// フタの開いた箱（carton）。奥の面→中身→手前の面の順に重ねる
const CARTON_BACK = { c: "M16 48l10-14h48l10 14z" };
const CARTON_FRONT = {
  a: R(16, 48, 68, 42, 3),
  b: "M16 48L6 60h10zM84 48l10 12H84z",
  l: R(16, 48, 68, 42, 3),
};
const LABEL_FONT =
  'font-family="\'Noto Sans JP\', \'Hiragino Sans\', sans-serif" font-weight="900" fill="#FFFFFF"';
const nest = (x, y, size, inner) =>
  `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 100 100">\n  ${inner}\n  </svg>`;

function layers(L, k, sw = 2.5) {
  const out = [];
  if (L.t) out.push(`<path d="${L.t}" fill="${k.t}"/>`);
  if (L.w) out.push(`<path d="${L.w}" fill="${k.w ?? "#FFFFFF"}"/>`);
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

export const PATTERNS = [
  "box",
  "form",
  "symbol",
  "box2",
  "form2",
  "symbol2",
  "duo",
  "slim",
  "square",
  "pouch",
  "carton",
];

// パッケージは同じ形で v2〜v5 の描き分けをつくる（L-36）。v1 は {kind}-{pattern}.svg
export const PACKAGES = ["box", "box2", "slim", "square", "pouch", "carton"];
export const VARIANTS = {
  1: "基本",
  2: "濃い色",
  3: "斜めストライプ",
  4: "ドット",
  5: "生成り",
};
// 正面（模様を重ねる範囲）
const FACE = {
  box: R(18, 24, 52, 66, 0),
  box2: R(10, 30, 70, 50, 0),
  slim: R(30, 16, 36, 76, 0),
  square: R(12, 30, 64, 58, 0),
  pouch: POUCH.w,
  carton: CARTON_FRONT.a,
};
const darken = (hex, f) =>
  "#" +
  [1, 3, 5]
    .map((i) =>
      Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - f))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase();
const mix = (h1, h2) =>
  "#" +
  [1, 3, 5]
    .map((i) =>
      Math.round((parseInt(h1.slice(i, i + 2), 16) + parseInt(h2.slice(i, i + 2), 16)) / 2)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase();
const STRIPES = Array.from({ length: 26 }, (_, i) => `M${i * 8 - 100} 0l100 100`).join("");
const DOTS = Array.from({ length: 13 * 13 }, (_, i) =>
  C(4 + (i % 13) * 8 + (Math.floor(i / 13) % 2) * 4, 4 + Math.floor(i / 13) * 8, 1.3),
).join("");

function deco(id, face, variant, k) {
  if (variant !== 3 && variant !== 4) return "";
  const fill =
    variant === 3
      ? `<path d="${STRIPES}" fill="none" stroke="${k.c}" stroke-width="3" opacity="0.13"/>`
      : `<path d="${DOTS}" fill="${k.c}" opacity="0.16"/>`;
  return `<clipPath id="${id}"><path d="${face}"/></clipPath>\n  <g clip-path="url(#${id})">${fill}</g>`;
}

function svg(kind, pattern, variant = 1) {
  const k0 = CAT[kind];
  const k = variant === 2 ? { ...k0, a: k0.c, b: k0.a, c: darken(k0.c, 0.35) } : k0;
  const ks = variant === 5 ? { ...k, w: k.t, b: mix(k.b, k.t) } : k;
  const pkg = (shape) =>
    [layers(shape, ks), deco(`f-${kind}-${pattern}-v${variant}`, FACE[pattern], variant, k)]
      .filter(Boolean)
      .join("\n  ");
  const name = k.short ?? k.label;
  let body;
  if (pattern === "form") body = layers({ t: R(4, 4, 92, 92, 22), ...FORM[kind] }, k);
  else if (pattern === "form2") body = layers({ t: R(4, 4, 92, 92, 22), ...FORM2[kind] }, k);
  else if (pattern === "symbol") body = layers({ t: C(50, 50, 46), ...SYM[kind] }, k);
  else if (pattern === "symbol2") body = layers({ t: C(50, 50, 46), ...SYM2[kind] }, k);
  else if (pattern === "duo")
    body = [
      layers({ t: R(4, 4, 92, 92, 22) }, k),
      nest(2, 2, 80, layers(FORM[kind], k)),
      `<path d="${C(74, 74, 21)}" fill="#FFFFFF"/>`,
      nest(55, 55, 38, layers({ t: C(50, 50, 46), ...SYM[kind] }, k, 3.5)),
    ].join("\n  ");
  else if (pattern === "slim")
    body = [
      pkg(SLIM),
      `<text x="48" y="27" text-anchor="middle" ${LABEL_FONT.replace("#FFFFFF", k.c)} font-size="${name.length >= 5 ? 6.5 : 8}">${name}</text>`,
      nest(31, 30, 34, layers(FORM[kind], k, 3)),
    ].join("\n  ");
  else if (pattern === "square")
    body = [
      pkg(SQUARE),
      nest(28, 35, 32, layers(SYM2[kind], k, 3)),
      `<text x="44" y="82" text-anchor="middle" ${LABEL_FONT} font-size="${name.length >= 5 ? 7.5 : 9}">${name}</text>`,
    ].join("\n  ");
  else if (pattern === "pouch")
    body = [
      pkg(POUCH),
      nest(31, 25, 38, layers(SYM[kind], k, 3)),
      `<text x="50" y="78" text-anchor="middle" ${LABEL_FONT} font-size="${name.length >= 5 ? 9 : 11}">${name}</text>`,
    ].join("\n  ");
  else if (pattern === "carton")
    body = [
      layers(CARTON_BACK, k),
      nest(24, 0, 52, layers(FORM2[kind], k, 3)),
      pkg(CARTON_FRONT),
      `<text x="50" y="74" text-anchor="middle" ${LABEL_FONT} font-size="${name.length >= 5 ? 9.5 : 11}">${name}</text>`,
    ].join("\n  ");
  else if (pattern === "box2")
    body = [
      pkg(BOX2),
      `<text x="45" y="76" text-anchor="middle" ${LABEL_FONT} font-size="${name.length >= 5 ? 9 : 10.5}">${name}</text>`,
      nest(29, 31, 32, layers(SYM2[kind], k, 3)),
    ].join("\n  ");
  else
    body = [
      pkg(BOX),
      `<text x="44" y="39" text-anchor="middle" ${LABEL_FONT} font-size="${name.length >= 5 ? 8.5 : 10}">${name}</text>`,
      nest(24, 48, 40, layers(SYM[kind], k, 3)),
    ].join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${k.label}のイメージ図">\n  <title>${k.label}のイメージ図</title>\n  ${body}\n</svg>\n`;
}

mkdirSync(OUT, { recursive: true });
let n = 0;
for (const kind of Object.keys(CAT)) {
  for (const pattern of PATTERNS) {
    writeFileSync(join(OUT, `${kind}-${pattern}.svg`), svg(kind, pattern));
    n++;
  }
  for (const pattern of PACKAGES) {
    for (const v of [2, 3, 4, 5]) {
      writeFileSync(join(OUT, `${kind}-${pattern}-v${v}.svg`), svg(kind, pattern, v));
      n++;
    }
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
