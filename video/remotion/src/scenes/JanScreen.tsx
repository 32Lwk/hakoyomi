import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { ramp } from "../components/anim";
import { RecordingTrack } from "../components/AppScene";
import { HakoyomiIcon } from "../components/Wordmark";
import { FPS } from "../theme";
import { Viewfinder } from "./JanDemo";

// 実写（Gemini 生成、スマホの画面が緑）にはめ込む「端末の画面」素材。390×800（--scale=2 で 780×1600 に書き出す）。
// 実写 iPhone の上部の黒いノッチ（中央・高さ約38px）と四隅の角丸に UI が被らないよう、
// 上部に iOS ステータスバー（44px）と下部に Home Indicator（22px）を設け、
// 固定フッター（下部ナビバー）も切れずに 100% 収まるように配置する。
export const JAN_SCREEN_SEC = 16;
const T_SCAN = 4.3;
const T_CARD = 5.2;
const FILE = "recordings/S2-jan-badges.webm";

const TOP_SAFE = 44;
const BOT_SAFE = 22;
const NAV_H = 98; // 下部の固定ナビバー＋中央の丸い「探す」ボタンの高さ（844px の下端 98px）

const IosStatusBar: React.FC<{ dark: boolean }> = ({ dark }) => {
  const fg = dark ? "#FFFFFF" : "#0E1116";
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: TOP_SAFE,
        background: dark ? "#1B232C" : "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 24px 0 26px",
        boxSizing: "border-box",
        zIndex: 20,
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: fg,
          letterSpacing: -0.3,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        }}
      >
        9:41
      </div>
      {/* 中央は実写 iPhone のノッチが入るため空けておく */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
          <rect x="0.5" y="7" width="3" height="3.5" rx="0.8" fill={fg} />
          <rect x="4.8" y="5" width="3" height="5.5" rx="0.8" fill={fg} />
          <rect x="9.1" y="2.8" width="3" height="7.7" rx="0.8" fill={fg} />
          <rect x="13.4" y="0.5" width="3" height="10" rx="0.8" fill={fg} />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <path
            d="M7.5 2.2C10.1 2.2 12.4 3.2 14.1 4.8L15 3.8C13.1 1.9 10.4 0.8 7.5 0.8C4.6 0.8 1.9 1.9 0 3.8L0.9 4.8C2.6 3.2 4.9 2.2 7.5 2.2ZM7.5 5.4C9.2 5.4 10.7 6.1 11.8 7.1L12.8 6.1C11.4 4.8 9.5 4 7.5 4C5.5 4 3.6 4.8 2.2 6.1L3.2 7.1C4.3 6.1 5.8 5.4 7.5 5.4ZM9.7 8.4L7.5 10.6L5.3 8.4C6.5 7.3 8.5 7.3 9.7 8.4Z"
            fill={fg}
          />
        </svg>
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
          <rect x="0.5" y="0.5" width="20" height="10" rx="3" stroke={fg} strokeOpacity="0.45" />
          <rect x="2" y="2" width="17" height="7" rx="1.8" fill={fg} />
          <path d="M22 3.8V7.2C22.9 6.8 23.5 6.2 23.5 5.5C23.5 4.8 22.9 4.2 22 3.8Z" fill={fg} fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  );
};

export const JanScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const total = Math.round((JAN_SCREEN_SEC - T_CARD) * FPS);
  const shift = Math.round((5.9 - T_SCAN) * FPS);
  const cardIn = ramp(frame, Math.round(T_CARD * FPS), 10);
  const bodyH = 800 - TOP_SAFE - BOT_SAFE; // 734px

  // 実写パート（5.2s〜9.0s）では、読み取り直後の商品カード上部（コルゲンコーワIB透明カプセルαプラスの品名・パッケージ写真・確認ポイント）
  // がはっきり見える区間（8.8s〜11.1s）をゆっくり表示し、続いてバッジ一覧へ進む
  const segments = [
    { from: 8.8, to: 11.1, rate: 0.55 },
    { from: 11.1, to: 18.0, rate: 1 },
  ];

  return (
    <AbsoluteFill style={{ background: cardIn > 0.5 ? "#FFFFFF" : "#0E1116" }}>
      <IosStatusBar dark={cardIn < 0.5} />

      {/* スキャン画面（0〜5.2s） */}
      <div style={{ position: "absolute", left: 0, right: 0, top: TOP_SAFE, height: bodyH, overflow: "hidden" }}>
        <Viewfinder frame={frame + shift} w={390} h={bodyH} jan="4987067277100" scanned={s >= T_SCAN} />
      </div>

      {/* 商品カード画面（5.2s〜）：上部ヘッダー〜本文と、下部固定ナビバーが切れずに収まる */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: TOP_SAFE,
          height: bodyH,
          background: "#FFFFFF",
          opacity: cardIn,
          overflow: "hidden",
        }}
      >
        {/* 上部〜本文領域 */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 390, height: 844 }}>
          <Sequence from={Math.round(T_CARD * FPS)} layout="none" durationInFrames={total}>
            <RecordingTrack file={FILE} seconds={null} segments={segments} total={total} />
          </Sequence>
          {/* ヘッダ左上のアイコン（28×28px）を新アイコン A-1 に置き換え */}
          <div style={{ position: "absolute", left: 16, top: 10, width: 28, height: 28, borderRadius: 6, background: "#FFFFFF", display: "flex" }}>
            <HakoyomiIcon size={28} idSuffix="janscreen" />
          </div>
        </div>
        {/* 下部固定ナビバー領域（844px の下端 NAV_H を bodyH の下端に重ねて、ナビバーが絶対に切れないようにする） */}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: 390,
            height: NAV_H,
            overflow: "hidden",
            clipPath: "polygon(0px 30px, 154px 30px, 164px 0px, 226px 0px, 236px 30px, 390px 30px, 390px 98px, 0px 98px)",
          }}
        >
          <div style={{ position: "absolute", left: 0, top: -(844 - NAV_H), width: 390, height: 844 }}>
            <Sequence from={Math.round(T_CARD * FPS)} layout="none" durationInFrames={total}>
              <RecordingTrack file={FILE} seconds={null} segments={segments} total={total} />
            </Sequence>
          </div>
        </div>
      </div>

      {/* 下部 Home Indicator Safe Area */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: BOT_SAFE,
          background: cardIn > 0.5 ? "#FFFFFF" : "#0E1116",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20,
        }}
      >
        <div
          style={{
            width: 132,
            height: 5,
            borderRadius: 999,
            background: cardIn > 0.5 ? "#0E1116" : "rgba(255,255,255,0.7)",
            opacity: 0.82,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

