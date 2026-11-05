import React from "react";
import { C, FONT } from "../theme";
import qr from "../qr.json";

// 右上に常に出す「ご活用ください」のカード（QR は https://hakoyomi.yutok.dev）。クリーム地・濃紺の文字・細い葉の飾り
const M = qr as boolean[][];
const N = M.length;

const Leaf: React.FC<{ x: number; y: number; r: number; s: number; o?: number }> = ({ x, y, r, s, o = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
    <path d="M0 0 C 10 -14 28 -14 38 0 C 28 14 10 14 0 0 Z" fill="#B8C7BD" />
    <path d="M2 0 L36 0" stroke="#8FA698" strokeWidth={1.2} />
  </g>
);

export const QrCard: React.FC<{ width?: number }> = ({ width = 320 }) => {
  const k = width / 580; // 元の図の幅 580
  const qrSize = 132;
  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        right: 28,
        width,
        height: 232 * k,
        borderRadius: 26 * k,
        background: "linear-gradient(135deg,#FBF8F0 0%,#F1EBDC 100%)",
        border: "1.5px solid rgba(180,165,130,0.55)",
        boxShadow: "0 14px 34px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.08)",
        overflow: "hidden",
        fontFamily: FONT,
        zIndex: 50,
      }}
    >
      <svg width={width} height={232 * k} viewBox="0 0 580 232" style={{ position: "absolute", inset: 0 }} aria-hidden>
        <Leaf x={338} y={156} r={-30} s={1.5} o={0.8} />
        <Leaf x={352} y={192} r={-70} s={1.2} o={0.7} />
        <Leaf x={318} y={198} r={-10} s={1.1} o={0.6} />
        <Leaf x={552} y={60} r={-120} s={1.1} o={0.7} />
        <Leaf x={556} y={110} r={-160} s={1.0} o={0.6} />
        <path d="M310 222 C 336 188, 360 154, 384 124" stroke="#8FA698" strokeWidth={1.6} fill="none" opacity={0.7} />
        <circle cx={366} cy={200} r={5} fill="#C9A29A" />
        <circle cx={378} cy={208} r={4.5} fill="#C9A29A" />
        <circle cx={356} cy={210} r={4} fill="#C9A29A" />
        {/* 矢印 */}
        <path d="M52 118 H268 M258 111 L270 118 L258 125" stroke="#8C9AAB" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", left: 52 * k, top: 38 * k, fontSize: 58 * k, fontWeight: 700, color: C.navy, letterSpacing: 2 }}>ハコよみ</div>
      <div style={{ position: "absolute", left: 52 * k, top: 138 * k, fontSize: 32 * k, fontWeight: 700, color: C.navy, letterSpacing: 1.5 }}>ご活用ください</div>
      <div
        style={{
          position: "absolute",
          right: 22 * k,
          top: 22 * k,
          width: (qrSize + 36) * k,
          height: (qrSize + 36) * k,
          borderRadius: 18 * k,
          background: "#fff",
          boxShadow: "0 2px 8px rgba(15,23,42,0.12)",
          padding: 18 * k,
          boxSizing: "border-box",
        }}
      >
        <svg width="100%" height="100%" viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges" aria-label="hakoyomi.yutok.dev">
          {M.flatMap((row, y) => row.map((v, x) => (v ? <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={C.navy} /> : null)))}
        </svg>
      </div>
      <div style={{ position: "absolute", right: 22 * k, bottom: 12 * k, width: (qrSize + 36) * k, textAlign: "center", fontSize: 15 * k, color: C.sub, letterSpacing: 0.5 }}>
        hakoyomi.yutok.dev
      </div>
    </div>
  );
};
