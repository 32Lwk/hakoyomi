import React from "react";
import { useCurrentFrame } from "remotion";
import { CAPTIONS } from "../captions";
import { C, FONT, FPS, LAYOUT } from "../theme";

/** 焼き込み字幕。offsetSec は、この部品を置いた Sequence の頭が動画の何秒目か（単体の場面の確認用） */
export const Subtitles: React.FC<{ offsetSec?: number; only?: string[] }> = ({ offsetSec = 0, only }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS + offsetSec;
  const cap = CAPTIONS.find((c) => t >= c.start && t < c.end && (!only || only.includes(c.scene)));
  if (!cap) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: LAYOUT.subtitle.bottom,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: LAYOUT.subtitle.maxW,
          background: "rgba(20, 24, 31, 0.86)",
          color: C.white,
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 40,
          lineHeight: 1.45,
          padding: "12px 32px",
          borderRadius: 12,
          textAlign: "center",
          letterSpacing: 1,
        }}
      >
        {cap.text}
      </div>
    </div>
  );
};
