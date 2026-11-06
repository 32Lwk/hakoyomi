import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { F, Logo, Phone } from "./Thumbnails2";

// YouTube サムネイル 第4案（L-20261106-04）。F（白地の特大タイポ＋実機）と
// I（問いの吹き出し＋新人とベテランの写真）を組み合わせる。

const NAVY = "#0F2744";
const AMBER = "#F5B700";
const INK = "#111827";
const DUO = "real/s7-confident-2.jpg";

const Diff: React.FC = () => <span style={{ color: "#B7791F" }}>違う</span>;

/** 白地の吹き出し（濃紺のふち）。白い背景の上でも浮く */
const Ask: React.FC<{ size: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  size,
  style,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      background: "#fff",
      color: INK,
      border: `${size * 0.06}px solid ${NAVY}`,
      borderRadius: size * 0.4,
      padding: `${size * 0.2}px ${size * 0.42}px ${size * 0.24}px`,
      fontFamily: F,
      fontSize: size,
      fontWeight: 900,
      letterSpacing: -size * 0.02,
      lineHeight: 1.15,
      boxShadow: "0 18px 40px rgba(15,39,68,0.25)",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
    <div
      style={{
        position: "absolute",
        left: size * 0.7,
        bottom: -size * 0.44,
        width: 0,
        height: 0,
        borderLeft: `${size * 0.24}px solid transparent`,
        borderRight: `${size * 0.24}px solid transparent`,
        borderTop: `${size * 0.44}px solid ${NAVY}`,
      }}
    />
  </div>
);

const Headline: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ fontFamily: F, fontWeight: 900, fontSize: size, lineHeight: 1.04, letterSpacing: -size * 0.025, color: INK }}>
    <div>新人でも、</div>
    <div>ベテランの</div>
    <div>
      <span style={{ background: `linear-gradient(transparent 58%, ${AMBER} 58%)` }}>説明を。</span>
    </div>
  </div>
);

/** M：F の濃紺の円の中に新人とベテランの写真。左は F の特大タイポ＋I の問い */
export const ThumbnailM: React.FC = () => (
  <AbsoluteFill style={{ background: "#F4F6F9", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: 860,
        top: -120,
        width: 1320,
        height: 1320,
        borderRadius: "50%",
        overflow: "hidden",
        background: NAVY,
        boxShadow: `0 0 0 18px ${NAVY}`,
      }}
    >
      <Img src={staticFile(DUO)} style={{ position: "absolute", height: 1080, width: 1934, left: -456, top: 120 }} />
    </div>
    <Ask size={64} style={{ left: 96, top: 70 }}>
      この薬、何が<Diff />の？
    </Ask>
    <div style={{ position: "absolute", left: 96, top: 260 }}>
      <Headline size={150} />
      <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 24 }}>
        <Logo size={60} />
        <span style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: "#5B6573" }}>登録販売者のための店頭支援</span>
      </div>
    </div>
    <Phone src="thumbnails/app_badges.png" width={240} rotate={-7} style={{ left: 930, top: 540 }} />
  </AbsoluteFill>
);

/** N：I の配置を白地に。右半分は写真が白へ溶ける。境目に実機 */
export const ThumbnailN: React.FC = () => (
  <AbsoluteFill style={{ background: "#F4F6F9", overflow: "hidden" }}>
    <Img src={staticFile(DUO)} style={{ position: "absolute", height: 1080, width: 1934, left: 520, top: 0 }} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(90deg, #F4F6F9 0%, #F4F6F9 40%, rgba(244,246,249,0.85) 50%, rgba(244,246,249,0) 64%)",
      }}
    />
    <Ask size={66} style={{ left: 96, top: 76 }}>
      この薬、何が<Diff />の？
    </Ask>
    <div style={{ position: "absolute", left: 96, top: 270 }}>
      <Headline size={148} />
      <div style={{ marginTop: 34 }}>
        <Logo size={64} />
      </div>
    </div>
    <Phone src="thumbnails/app_badges.png" width={300} rotate={-6} style={{ left: 880, top: 360 }} />
  </AbsoluteFill>
);

/** O：F そのままの構成で、右の円を写真に。実機は写真の前に大きく */
export const ThumbnailO: React.FC = () => (
  <AbsoluteFill style={{ background: "#F4F6F9", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        right: -260,
        top: -200,
        width: 1180,
        height: 1180,
        borderRadius: "50%",
        overflow: "hidden",
        background: NAVY,
      }}
    >
      <Img src={staticFile(DUO)} style={{ position: "absolute", height: 1080, width: 1934, left: -560, top: 200 }} />
    </div>
    <Ask size={60} style={{ left: 100, top: 72 }}>
      この薬、何が<Diff />の？
    </Ask>
    <div style={{ position: "absolute", left: 100, top: 250 }}>
      <Headline size={160} />
      <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 24 }}>
        <Logo size={60} />
        <span style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: "#5B6573" }}>登録販売者のための店頭支援</span>
      </div>
    </div>
    <Phone src="thumbnails/app_badges.png" width={240} rotate={8} style={{ left: 1630, top: 440 }} />
  </AbsoluteFill>
);
