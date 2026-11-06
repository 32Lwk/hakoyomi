import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/NotoSansJP";

// YouTube サムネイル 第2案（L-20261106-02）。1920x1080。
// 方針：文字は少なく特大に・要素は3つまで・実際のアプリ画面を使う。
// モデル名・添付文書・推薦に読める語・根拠のない秒数は入れない。色は濃紺＋琥珀（design.md）。

const { fontFamily: noto } = loadFont("normal", {
  weights: ["500", "700", "900"],
  ignoreTooManyRequestsWarning: true,
});
export const F = `${noto}, "Hiragino Sans", sans-serif`;

const NAVY = "#0F2744";
const NAVY_DEEP = "#081626";
const AMBER = "#F5B700";
const INK = "#111827";

/** 実機らしい iPhone。画面は録画のコマ（390×844 の2倍）をそのまま貼る */
export const Phone: React.FC<{
  src: string;
  width: number;
  rotate?: number;
  crop?: number; // 画面の上を何 px（390 幅換算）ずらすか
  style?: React.CSSProperties;
}> = ({ src, width, rotate = 0, crop = 0, style }) => {
  const s = width / 390;
  const bezel = 13 * s;
  const statusH = 44 * s;
  const appH = 844 * s;
  const radius = 62 * s;
  return (
    <div
      style={{
        position: "absolute",
        width: width + bezel * 2,
        padding: bezel,
        borderRadius: radius + bezel,
        background: "linear-gradient(145deg, #3A3F47 0%, #15181C 35%, #0B0C0E 70%, #2C3036 100%)",
        boxShadow: `0 0 0 ${2 * s}px #4B515A inset, 0 ${40 * s}px ${90 * s}px rgba(0,0,0,0.55), 0 ${8 * s}px ${20 * s}px rgba(0,0,0,0.35)`,
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width,
          height: statusH + appH,
          borderRadius: radius,
          overflow: "hidden",
          background: "#FFFFFF",
        }}
      >
        {/* ステータスバー */}
        <div
          style={{
            height: statusH,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `0 ${34 * s}px`,
            fontFamily: F,
            fontWeight: 700,
            fontSize: 16 * s,
            color: INK,
          }}
        >
          <span>9:41</span>
          <span style={{ display: "flex", gap: 5 * s, alignItems: "center" }}>
            <span style={{ width: 17 * s, height: 10 * s, borderRadius: 2 * s, background: INK }} />
            <span
              style={{
                width: 24 * s,
                height: 11 * s,
                borderRadius: 3 * s,
                border: `${1.5 * s}px solid ${INK}`,
                boxSizing: "border-box",
                padding: 1.5 * s,
              }}
            >
              <span style={{ display: "block", width: "80%", height: "100%", background: INK, borderRadius: 1 * s }} />
            </span>
          </span>
        </div>
        {/* ダイナミックアイランド */}
        <div
          style={{
            position: "absolute",
            top: 10 * s,
            left: "50%",
            width: 112 * s,
            height: 32 * s,
            marginLeft: -56 * s,
            borderRadius: 20 * s,
            background: "#000",
          }}
        />
        <div style={{ height: appH, overflow: "hidden" }}>
          <Img src={staticFile(src)} style={{ width, display: "block", marginTop: -crop * s }} />
        </div>
      </div>
    </div>
  );
};

/** 画面の一部を拡大して見せる吹き出し（実際の画面の切り抜き） */
export const Zoom: React.FC<{
  src: string;
  x: number; // 切り抜く範囲（390 幅換算）
  y: number;
  w: number;
  h: number;
  scale: number;
  style?: React.CSSProperties;
}> = ({ src, x, y, w, h, scale, style }) => (
  <div
    style={{
      position: "absolute",
      width: w * scale,
      height: h * scale,
      overflow: "hidden",
      borderRadius: 22,
      background: "#fff",
      boxShadow: "0 30px 80px rgba(0,0,0,0.45), 0 0 0 6px rgba(255,255,255,0.9)",
      ...style,
    }}
  >
    <Img
      src={staticFile(src)}
      style={{ position: "absolute", width: 390 * scale, left: -x * scale, top: -y * scale, display: "block" }}
    />
  </div>
);

export const Tag: React.FC<{ children: React.ReactNode; dark?: boolean; style?: React.CSSProperties }> = ({
  children,
  dark,
  style,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      fontFamily: F,
      fontWeight: 700,
      fontSize: 30,
      letterSpacing: 1,
      padding: "10px 22px",
      borderRadius: 999,
      color: dark ? "#fff" : NAVY,
      background: dark ? "rgba(255,255,255,0.14)" : "#fff",
      border: dark ? "2px solid rgba(255,255,255,0.35)" : `2px solid ${NAVY}`,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Logo: React.FC<{ light?: boolean; size?: number }> = ({ light, size = 60 }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 18, fontFamily: F }}>
    <span style={{ fontSize: size, fontWeight: 900, color: light ? "#fff" : NAVY, letterSpacing: 2 }}>ハコよみ</span>
  </div>
);

/** E：実写＋特大コピー「ピッで、ぜんぶ手元に。」（読むだけ、の驚き） */
export const ThumbnailE: React.FC = () => (
  <AbsoluteFill style={{ background: NAVY_DEEP, overflow: "hidden" }}>
    <Img
      src={staticFile("thumbnails/photo_scan.png")}
      style={{ position: "absolute", width: 1920, height: 1080, objectFit: "cover", left: -260, filter: "saturate(0.9)" }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(90deg, rgba(8,22,38,0) 30%, rgba(8,22,38,0.82) 52%, rgba(8,22,38,0.97) 70%)",
      }}
    />
    <div style={{ position: "absolute", right: 70, top: 120, width: 900, fontFamily: F }}>
      <Tag dark>現役の登録販売者がつくった</Tag>
      <div style={{ marginTop: 34, fontSize: 128, fontWeight: 900, lineHeight: 1.08, color: "#fff", letterSpacing: -2 }}>
        ピッで、
      </div>
      <div style={{ fontSize: 128, fontWeight: 900, lineHeight: 1.12, color: AMBER, letterSpacing: -2 }}>ぜんぶ手元に。</div>
      <div style={{ marginTop: 40, fontSize: 40, fontWeight: 700, color: "#DDE6F0", lineHeight: 1.5 }}>
        濫用防止・運転・授乳・年齢・ドーピング
      </div>
      <div style={{ marginTop: 56 }}>
        <Logo light size={72} />
      </div>
    </div>
    <Zoom
      src="thumbnails/app_badges.png"
      x={0}
      y={300}
      w={390}
      h={150}
      scale={2.0}
      style={{ left: 120, top: 600, transform: "rotate(-3deg)" }}
    />
  </AbsoluteFill>
);

/** F：白地のタイポ「新人でも、ベテランの説明を。」＋実機（テーマ1の核心） */
export const ThumbnailF: React.FC = () => (
  <AbsoluteFill style={{ background: "#F4F6F9", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        right: -220,
        top: -260,
        width: 1100,
        height: 1100,
        borderRadius: "50%",
        background: NAVY,
      }}
    />
    <div style={{ position: "absolute", left: 100, top: 130, fontFamily: F }}>
      <Tag>誰が接客しても、同じ水準の説明を</Tag>
      <div style={{ marginTop: 40, fontSize: 168, fontWeight: 900, lineHeight: 1.04, color: INK, letterSpacing: -4 }}>
        新人でも、
      </div>
      <div style={{ fontSize: 168, fontWeight: 900, lineHeight: 1.04, color: INK, letterSpacing: -4 }}>
        ベテランの
      </div>
      <div style={{ fontSize: 168, fontWeight: 900, lineHeight: 1.04, letterSpacing: -4 }}>
        <span style={{ background: `linear-gradient(transparent 58%, ${AMBER} 58%)`, color: INK }}>説明を。</span>
      </div>
      <div style={{ marginTop: 50, display: "flex", alignItems: "center", gap: 26 }}>
        <Logo size={64} />
        <span style={{ fontSize: 30, fontWeight: 700, color: "#5B6573" }}>登録販売者のための店頭支援</span>
      </div>
    </div>
    <Phone src="thumbnails/app_badges.png" width={400} rotate={6} style={{ left: 1300, top: 70 }} />
  </AbsoluteFill>
);

/** G：お客様の一言「この薬、何が違うの？」＋違う行だけ光る比較表 */
export const ThumbnailG: React.FC = () => (
  <AbsoluteFill style={{ background: `linear-gradient(160deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 96, top: 170, fontFamily: F }}>
      <div
        style={{
          position: "relative",
          display: "inline-block",
          background: "#fff",
          color: INK,
          borderRadius: 40,
          padding: "34px 56px 40px",
          fontSize: 118,
          fontWeight: 900,
          letterSpacing: -2,
          lineHeight: 1.15,
          boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
        }}
      >
        この薬、
        <br />
        何が<span style={{ color: "#B7791F" }}>違う</span>の？
        <div
          style={{
            position: "absolute",
            left: 90,
            bottom: -44,
            width: 0,
            height: 0,
            borderLeft: "26px solid transparent",
            borderRight: "26px solid transparent",
            borderTop: "48px solid #fff",
          }}
        />
      </div>
      <div style={{ marginTop: 96, fontSize: 58, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>
        違うところだけ、<span style={{ color: AMBER }}>光る。</span>
      </div>
      <div style={{ marginTop: 44 }}>
        <Logo light size={70} />
      </div>
    </div>
    <Zoom
      src="thumbnails/app_compare.png"
      x={0}
      y={80}
      w={390}
      h={330}
      scale={2.2}
      style={{ left: 1000, top: 170, transform: "rotate(2deg)" }}
    />
    <Tag dark style={{ position: "absolute", left: 1030, top: 70 }}>
      2〜4品を同じ基準で比較
    </Tag>
  </AbsoluteFill>
);

/** H：3画面を並べた全体像「JANを読むだけ。」（何ができるかが一目で分かる） */
export const ThumbnailH: React.FC = () => (
  <AbsoluteFill style={{ background: "#FFFFFF", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 430, background: NAVY }} />
    <div style={{ position: "absolute", left: 96, top: 96, fontFamily: F, width: 820 }}>
      <Tag>Built with Claude Japan 2026</Tag>
      <div style={{ marginTop: 36, fontSize: 132, fontWeight: 900, lineHeight: 1.08, color: INK, letterSpacing: -3 }}>
        JANを
        <br />
        読むだけ。
      </div>
      <div style={{ marginTop: 22, fontSize: 44, fontWeight: 700, lineHeight: 1.45, color: "#334155" }}>
        確認点・比較・根拠つきの答えが
        <br />
        店頭のスマホにそろう
      </div>
    </div>
    <div style={{ position: "absolute", left: 96, bottom: 120, fontFamily: F }}>
      <Logo light size={92} />
      <div style={{ marginTop: 6, fontSize: 32, fontWeight: 700, color: "#C9D6E6" }}>
        現役の登録販売者がつくった、店頭の説明をそろえるアプリ
      </div>
    </div>
    <Phone src="thumbnails/app_ask.png" width={330} rotate={-4} style={{ left: 980, top: 150 }} />
    <Phone src="thumbnails/app_compare.png" width={330} rotate={4} style={{ left: 1520, top: 190 }} />
    <Phone src="thumbnails/app_badges.png" width={360} rotate={0} style={{ left: 1240, top: 80 }} />
  </AbsoluteFill>
);
