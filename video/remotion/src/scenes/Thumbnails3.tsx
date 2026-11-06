import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { F, Logo, Tag, Zoom } from "./Thumbnails2";

// YouTube サムネイル 第3案（L-20261106-03）。G「この薬、何が違うの？」と
// 新人とベテランが並ぶ写真（real/s7-confident-2.jpg）、接客の写真（s7-confident-1.jpg）を組み合わせる。

const NAVY = "#0F2744";
const NAVY_DEEP = "#081626";
const AMBER = "#F5B700";
const INK = "#111827";

const DUO = "real/s7-confident-2.jpg"; // 新人とベテランが並ぶ
const SERVE = "real/s7-confident-1.jpg"; // 新人がお客様に説明する

const Bubble: React.FC<{
  size: number;
  tail?: "left" | "right" | "none";
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ size, tail = "left", style, children }) => (
  <div
    style={{
      position: "absolute",
      background: "#fff",
      color: INK,
      borderRadius: size * 0.36,
      padding: `${size * 0.26}px ${size * 0.46}px ${size * 0.32}px`,
      fontFamily: F,
      fontSize: size,
      fontWeight: 900,
      letterSpacing: -size * 0.02,
      lineHeight: 1.15,
      boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
      ...style,
    }}
  >
    {children}
    {tail === "none" ? null : (
      <div
        style={{
          position: "absolute",
          [tail]: size * 0.8,
          bottom: -size * 0.38,
          width: 0,
          height: 0,
          borderLeft: `${size * 0.22}px solid transparent`,
          borderRight: `${size * 0.22}px solid transparent`,
          borderTop: `${size * 0.42}px solid #fff`,
        }}
      />
    )}
  </div>
);

const Diff: React.FC = () => <span style={{ color: "#B7791F" }}>違う</span>;

/** I：左に問い＋答え、右に新人とベテランの写真 */
export const ThumbnailI: React.FC = () => (
  <AbsoluteFill style={{ background: NAVY_DEEP, overflow: "hidden" }}>
    <Img src={staticFile(DUO)} style={{ position: "absolute", height: 1080, width: 1934, left: 420, top: 0 }} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(90deg, ${NAVY_DEEP} 0%, ${NAVY_DEEP} 34%, rgba(8,22,38,0.75) 48%, rgba(8,22,38,0) 64%)`,
      }}
    />
    <Bubble size={96} style={{ left: 80, top: 90 }}>
      この薬、
      <br />
      何が<Diff />の？
    </Bubble>
    <div style={{ position: "absolute", left: 90, top: 560, fontFamily: F }}>
      <div style={{ fontSize: 104, fontWeight: 900, color: "#fff", lineHeight: 1.12, letterSpacing: -2 }}>
        誰が答えても、
      </div>
      <div style={{ fontSize: 104, fontWeight: 900, color: AMBER, lineHeight: 1.12, letterSpacing: -2 }}>
        同じ説明を。
      </div>
      <div style={{ marginTop: 36 }}>
        <Logo light size={64} />
      </div>
    </div>
  </AbsoluteFill>
);

/** J：写真を全面に。下に大きく「新人でも、ベテランと同じ説明を。」 */
export const ThumbnailJ: React.FC = () => (
  <AbsoluteFill style={{ background: NAVY_DEEP, overflow: "hidden" }}>
    <Img src={staticFile(DUO)} style={{ position: "absolute", width: 1920, height: 1072, top: -40, left: 0 }} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, rgba(8,22,38,0) 38%, rgba(8,22,38,0.88) 66%, rgba(8,22,38,0.98) 100%)",
      }}
    />
    <Bubble size={76} tail="left" style={{ left: 110, top: 120 }}>
      この薬、何が<Diff />の？
    </Bubble>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center", fontFamily: F }}>
      <div style={{ fontSize: 108, fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: -3 }}>
        新人でも、<span style={{ color: AMBER }}>ベテランと同じ説明</span>を。
      </div>
      <div style={{ marginTop: 26, display: "flex", justifyContent: "center", alignItems: "center", gap: 28 }}>
        <Logo light size={60} />
        <span style={{ fontSize: 32, fontWeight: 700, color: "#C9D6E6" }}>現役の登録販売者がつくった店頭支援アプリ</span>
      </div>
    </div>
  </AbsoluteFill>
);

/** K：上下2段。上＝お客様の問い（接客の写真）、下＝答え（新人とベテラン） */
export const ThumbnailK: React.FC = () => (
  <AbsoluteFill style={{ background: NAVY_DEEP, overflow: "hidden" }}>
    {/* 左：お客様に説明する場面 */}
    <div style={{ position: "absolute", left: 0, top: 0, width: 960, height: 1080, overflow: "hidden" }}>
      <Img src={staticFile(SERVE)} style={{ position: "absolute", height: 1080, width: 1934, left: -470 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,22,38,0) 50%, rgba(8,22,38,0.9) 100%)" }} />
    </div>
    {/* 右：新人とベテラン */}
    <div style={{ position: "absolute", left: 960, top: 0, width: 960, height: 1080, overflow: "hidden" }}>
      <Img src={staticFile(DUO)} style={{ position: "absolute", height: 1080, width: 1934, left: -560 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,22,38,0) 50%, rgba(8,22,38,0.9) 100%)" }} />
    </div>
    <div style={{ position: "absolute", left: 957, top: 0, width: 6, height: 1080, background: AMBER }} />
    <Bubble size={84} style={{ left: 60, top: 70 }}>
      何が<Diff />の？
    </Bubble>
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 60,
        textAlign: "center",
        fontFamily: F,
        fontSize: 112,
        fontWeight: 900,
        lineHeight: 1.1,
        letterSpacing: -2,
        color: "#fff",
        textShadow: "0 6px 30px rgba(0,0,0,0.5)",
      }}
    >
      誰が接客しても、<span style={{ color: AMBER }}>同じ説明</span>を。
    </div>
    <div style={{ position: "absolute", right: 60, top: 70 }}>
      <Tag dark style={{ fontSize: 34, background: "rgba(8,22,38,0.7)" }}>
        ハコよみ
      </Tag>
    </div>
  </AbsoluteFill>
);

/** L：G の配置そのまま。比較表の代わりに写真、表は小さく添える */
export const ThumbnailL: React.FC = () => (
  <AbsoluteFill style={{ background: `linear-gradient(160deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        right: 70,
        top: 70,
        width: 1000,
        height: 600,
        borderRadius: 28,
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.45), 0 0 0 6px rgba(255,255,255,0.9)",
      }}
    >
      <Img src={staticFile(DUO)} style={{ position: "absolute", width: 1180, height: 659, left: -110, top: -30 }} />
    </div>
    <Zoom
      src="thumbnails/app_compare.png"
      x={0}
      y={80}
      w={390}
      h={215}
      scale={1.55}
      style={{ right: 110, top: 640, transform: "rotate(-2deg)" }}
    />
    <Bubble size={104} style={{ left: 80, top: 110 }}>
      この薬、
      <br />
      何が<Diff />の？
    </Bubble>
    <div style={{ position: "absolute", left: 90, top: 620, fontFamily: F }}>
      <div style={{ fontSize: 64, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>
        新人でも、
        <br />
        <span style={{ color: AMBER }}>ベテランと同じ説明を。</span>
      </div>
      <div style={{ marginTop: 30 }}>
        <Logo light size={64} />
      </div>
    </div>
  </AbsoluteFill>
);
