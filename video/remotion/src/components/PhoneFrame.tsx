import React from "react";
import { C, FONT, H } from "../theme";
import { HakoyomiIcon } from "./Wordmark";

export const PHONE_INNER_W = 390;
export const PHONE_APP_H = 844;
export const PHONE_STATUS_H = 40;
export const PHONE_HOME_H = 18;
export const PHONE_SCREEN_H = PHONE_STATUS_H + PHONE_APP_H + PHONE_HOME_H; // 902
export const PHONE_BEZEL = 9;
export const PHONE_RIM = 3;
export const PHONE_OUTER_W = PHONE_INNER_W + (PHONE_BEZEL + PHONE_RIM) * 2; // 414
export const PHONE_OUTER_H = PHONE_SCREEN_H + (PHONE_BEZEL + PHONE_RIM) * 2; // 926
export const PHONE_SCALE = 1.08; // 画面を大きく表示（実寸高さ 約1000px、上下40pxずつの完全中央配置）
export const PHONE_CX = 400; // 左側のスマホ中心 X 座標
export const PHONE_CY = H / 2; // 画面上下中央（540px）

/** iPhone 16 Pro スタイルのリアルな筐体フレーム。
 * 1080p キャンバスの上下中央（cy = 540）に大きく（scale = 1.08、高さ約1000px）配置する。
 */
export const PhoneFrame: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      position: "absolute",
      left: PHONE_CX - PHONE_OUTER_W / 2,
      top: PHONE_CY - PHONE_OUTER_H / 2,
      width: PHONE_OUTER_W,
      height: PHONE_OUTER_H,
      transform: `scale(${PHONE_SCALE})`,
      transformOrigin: "center center",
      ...style,
    }}
  >
    {/* 左側面ハードウェアボタン（アクションボタン・音量＋／−） */}
    <div
      style={{
        position: "absolute",
        left: -3,
        top: 158,
        width: 3,
        height: 30,
        borderRadius: "2px 0 0 2px",
        background: "linear-gradient(180deg, #5A6270 0%, #2B3038 50%, #4A515E 100%)",
        boxShadow: "-1px 0 2px rgba(0,0,0,0.3)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: -3,
        top: 212,
        width: 3,
        height: 60,
        borderRadius: "2px 0 0 2px",
        background: "linear-gradient(180deg, #5A6270 0%, #2B3038 50%, #4A515E 100%)",
        boxShadow: "-1px 0 2px rgba(0,0,0,0.3)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: -3,
        top: 286,
        width: 3,
        height: 60,
        borderRadius: "2px 0 0 2px",
        background: "linear-gradient(180deg, #5A6270 0%, #2B3038 50%, #4A515E 100%)",
        boxShadow: "-1px 0 2px rgba(0,0,0,0.3)",
      }}
    />
    {/* 右側面ハードウェアボタン（サイドボタン） */}
    <div
      style={{
        position: "absolute",
        right: -3,
        top: 238,
        width: 3,
        height: 88,
        borderRadius: "0 2px 2px 0",
        background: "linear-gradient(180deg, #5A6270 0%, #2B3038 50%, #4A515E 100%)",
        boxShadow: "1px 0 2px rgba(0,0,0,0.3)",
      }}
    />

    {/* 外装チタニウムフレーム */}
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 58,
        padding: PHONE_RIM,
        boxSizing: "border-box",
        background: "linear-gradient(145deg, #6E7684 0%, #2D323B 28%, #1A1D23 68%, #505866 100%)",
        boxShadow:
          "0 30px 70px rgba(15, 23, 42, 0.22), 0 8px 22px rgba(15, 23, 42, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.45)",
      }}
    >
      {/* 内側ディスプレイ黒ベゼル */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 55,
          padding: PHONE_BEZEL,
          boxSizing: "border-box",
          background: "#0B0D11",
          boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
          position: "relative",
        }}
      >
        {/* ディスプレイ表示領域（390 × 902） */}
        <div
          style={{
            width: PHONE_INNER_W,
            height: PHONE_SCREEN_H,
            borderRadius: 46,
            overflow: "hidden",
            background: C.white,
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* 1. iOS Status Bar + Dynamic Island（40px） */}
          <div
            style={{
              width: PHONE_INNER_W,
              height: PHONE_STATUS_H,
              background: C.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "2px 24px 0 28px",
              boxSizing: "border-box",
              position: "relative",
              flex: "none",
              zIndex: 10,
              borderBottom: "1px solid rgba(217, 221, 227, 0.35)",
            }}
          >
            {/* 時刻 */}
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#0E1116",
                letterSpacing: -0.3,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              }}
            >
              9:41
            </div>

            {/* Dynamic Island */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 7,
                transform: "translateX(-50%)",
                width: 108,
                height: 27,
                borderRadius: 999,
                background: "#07080B",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: 9,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "radial-gradient(circle at 35% 35%, #243754 0%, #0E1522 55%, #05070A 100%)",
                  boxShadow: "inset 0 0 0 1px rgba(143, 180, 232, 0.22)",
                }}
              />
            </div>

            {/* 電波・Wi-Fi・バッテリー */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="16" height="10" viewBox="0 0 17 11" fill="none">
                <rect x="0.5" y="7" width="3" height="3.5" rx="0.8" fill="#0E1116" />
                <rect x="4.8" y="5" width="3" height="5.5" rx="0.8" fill="#0E1116" />
                <rect x="9.1" y="2.8" width="3" height="7.7" rx="0.8" fill="#0E1116" />
                <rect x="13.4" y="0.5" width="3" height="10" rx="0.8" fill="#0E1116" />
              </svg>
              <svg width="14" height="10" viewBox="0 0 15 11" fill="none">
                <path
                  d="M7.5 2.2C10.1 2.2 12.4 3.2 14.1 4.8L15 3.8C13.1 1.9 10.4 0.8 7.5 0.8C4.6 0.8 1.9 1.9 0 3.8L0.9 4.8C2.6 3.2 4.9 2.2 7.5 2.2ZM7.5 5.4C9.2 5.4 10.7 6.1 11.8 7.1L12.8 6.1C11.4 4.8 9.5 4 7.5 4C5.5 4 3.6 4.8 2.2 6.1L3.2 7.1C4.3 6.1 5.8 5.4 7.5 5.4ZM9.7 8.4L7.5 10.6L5.3 8.4C6.5 7.3 8.5 7.3 9.7 8.4Z"
                  fill="#0E1116"
                />
              </svg>
              <svg width="23" height="10" viewBox="0 0 24 11" fill="none">
                <rect x="0.5" y="0.5" width="20" height="10" rx="3" stroke="#0E1116" strokeOpacity="0.4" />
                <rect x="2" y="2" width="17" height="7" rx="1.8" fill="#0E1116" />
                <path d="M22 3.8V7.2C22.9 6.8 23.5 6.2 23.5 5.5C23.5 4.8 22.9 4.2 22 3.8Z" fill="#0E1116" fillOpacity="0.45" />
              </svg>
            </div>
          </div>

          {/* 2. Web アプリ画面領域（390 × 844 1:1、上下の角丸から完全に独立） */}
          <div
            style={{
              width: PHONE_INNER_W,
              height: PHONE_APP_H,
              position: "relative",
              overflow: "hidden",
              background: C.white,
              flex: "none",
            }}
          >
            {children}
            {/* ヘッダ左上の「箱」アイコン（left: 16, top: 10, 28×28px）を新アイコン A-1 で表示 */}
            <div
              style={{
                position: "absolute",
                left: 16,
                top: 10,
                width: 28,
                height: 28,
                borderRadius: 6,
                background: C.white,
                display: "flex",
                pointerEvents: "none",
              }}
            >
              <HakoyomiIcon size={28} idSuffix="phonehdr" />
            </div>
          </div>

          {/* 3. iOS Home Indicator Safe Area（18px） */}
          <div
            style={{
              width: PHONE_INNER_W,
              height: PHONE_HOME_H,
              background: C.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: 132,
                height: 5,
                borderRadius: 999,
                background: "#0E1116",
                opacity: 0.82,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/** 録画がまだないときの札 */
export const RecordingPlaceholder: React.FC<{ sceneId: string; title: string; expected: string }> = ({
  sceneId,
  title,
  expected,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: C.base,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT,
      color: C.sub,
      textAlign: "center",
      padding: 32,
      gap: 18,
    }}
  >
    <div style={{ fontSize: 22, color: C.navy, fontWeight: 700, letterSpacing: 2 }}>{sceneId}</div>
    <div style={{ fontSize: 30, color: C.text, fontWeight: 700, lineHeight: 1.4 }}>{title}</div>
    <div style={{ width: 120, height: 2, background: C.line }} />
    <div style={{ fontSize: 22, lineHeight: 1.6 }}>画面録画（未収録）</div>
    <div style={{ fontSize: 17, lineHeight: 1.6, color: C.muted, wordBreak: "break-all" }}>{expected}</div>
  </div>
);


