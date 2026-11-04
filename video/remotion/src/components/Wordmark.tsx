import React from "react";
import { C, FONT } from "../theme";

/** ハコよみ A-1 アイコン（3Dキューブ薬箱＋四隅スキャン枠：ディープネイビー×スカイブルー） */
export const HakoyomiIcon: React.FC<{
  size?: number;
  draw?: number;
  idSuffix?: string;
}> = ({ size = 86, draw = 1, idSuffix = "main" }) => {
  const bgId = `hakoBg_${idSuffix}`;
  const topId = `hakoTop_${idSuffix}`;
  const p = Math.max(0, Math.min(1, draw));
  const cubeScale = 0.86 + 0.14 * p;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#274C7E" />
          <stop offset="100%" stopColor="#152A47" />
        </linearGradient>
        <linearGradient id={topId} x1="26" y1="24" x2="74" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2ECF8" />
        </linearGradient>
      </defs>
      {/* App Squircle */}
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="22"
        fill={`url(#${bgId})`}
        stroke="#8FB4E8"
        strokeWidth="2.5"
        strokeOpacity="0.45"
      />
      {/* Corner Scan Brackets */}
      <g opacity={Math.min(1, p * 1.4)}>
        <path d="M18 30V21C18 19.3431 19.3431 18 21 18H30" stroke="#8FB4E8" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M70 18H79C80.6569 18 82 19.3431 82 21V30" stroke="#8FB4E8" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M18 70V79C18 80.6569 19.3431 82 21 82H30" stroke="#8FB4E8" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M82 70V79C82 80.6569 80.6569 82 79 82H70" stroke="#8FB4E8" strokeWidth="4.5" strokeLinecap="round" />
      </g>
      {/* Isometric 3D Box */}
      <g
        style={{
          transformOrigin: "50px 50px",
          transform: `scale(${cubeScale})`,
          opacity: Math.min(1, p * 1.25),
        }}
      >
        <polygon points="50,23 75,36 50,49 25,36" fill={`url(#${topId})`} />
        <polygon points="25,39 48.5,51.2 48.5,77 25,64.5" fill="#F1F6FC" />
        <line x1="31" y1="48" x2="43" y2="54.2" stroke="#1E3A5F" strokeWidth="3.2" strokeLinecap="round" />
        <line x1="31" y1="55" x2="40" y2="59.7" stroke="#5B86C4" strokeWidth="2.6" strokeLinecap="round" />
        <polygon points="51.5,51.2 75,39 75,64.5 51.5,77" fill="#BFD6F2" />
        {[
          { x: 56.5, y1: 53, y2: 69.5, w: 2.8, i: 0 },
          { x: 61, y1: 50.7, y2: 67.2, w: 1.8, i: 1 },
          { x: 65, y1: 48.6, y2: 65.1, w: 3.2, i: 2 },
          { x: 69.5, y1: 46.3, y2: 62.8, w: 2.0, i: 3 },
        ].map((b) => {
          const barP = Math.max(0, Math.min(1, p * 1.5 - b.i * 0.12));
          return (
            <line
              key={b.x}
              x1={b.x}
              y1={b.y1}
              x2={b.x}
              y2={b.y1 + (b.y2 - b.y1) * barP}
              stroke="#152A47"
              strokeWidth={b.w}
              strokeLinecap="round"
              opacity={barP}
            />
          );
        })}
      </g>
    </svg>
  );
};

/** ハコよみのロゴ（3Dキューブ＋スキャン枠の記号と文字）。size は文字の高さ(px) */
export const Wordmark: React.FC<{ size?: number; color?: string; sub?: string; subColor?: string }> = ({
  size = 120,
  color = C.navy,
  sub,
  subColor = C.sub,
}) => {
  const s = size * 1.05;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: size * 0.32 }}>
        <HakoyomiIcon size={s} idSuffix="wordmark" />
        <div style={{ fontSize: size, fontWeight: 700, color, letterSpacing: size * 0.04, lineHeight: 1 }}>ハコよみ</div>
      </div>
      {sub ? (
        <div style={{ marginTop: size * 0.32, fontSize: size * 0.3, color: subColor, fontWeight: 500, letterSpacing: 2 }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
};
