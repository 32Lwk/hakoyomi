import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ramp, rise } from "../components/anim";
import { FeatureList, ProblemSolutionBanner, RecordingTrack } from "../components/AppScene";
import { PHONE_SCALE, PhoneFrame } from "../components/PhoneFrame";
import { C, FONT, FPS } from "../theme";
import { type Segment } from "../timeline";

export const REAL_CLIP_SEC = 9.0;
const SCENE_AT = 8.0; // スタジオの iPhone Pro フレームへ遷移を開始する秒
const REC_FROM = 10.6; // 商品カード上部（コルゲンコーワIB透明カプセルαプラス）が見える所からバッジ・根拠シートへ進む
const SCENE_SEC = 54;
export const realSegments: Segment[] = [{ from: REC_FROM, to: 44.5, rate: 0.82 }];
export const REAL_TOTAL_SEC = SCENE_SEC;
const FILE = "recordings/S2-jan-badges.webm";

export const JanDemoReal: React.FC<{ captions?: boolean }> = ({ captions = true }) => {
  const frame = useCurrentFrame();
  const at = (sec: number) => Math.round(sec * FPS);
  const recFrames = at(SCENE_SEC - SCENE_AT);

  const glide = ramp(frame, at(SCENE_AT), at(1.0));
  const blur = glide * 18;
  const veil = glide * 0.66;

  return (
    <AbsoluteFill style={{ background: C.base, fontFamily: FONT }}>
      {/* 背景：元の実写映像をぼかして薄く明るくする（同じ売場のまま） */}
      <AbsoluteFill style={{ filter: `blur(${blur}px)`, transform: `scale(${1 + glide * 0.04})` }}>
        <Sequence from={0} durationInFrames={at(REAL_CLIP_SEC)} layout="none">
          <OffthreadVideo src={staticFile("real/jan-real-clip.mp4")} muted style={fill} />
        </Sequence>
        <Sequence from={at(SCENE_AT + 0.35)} layout="none">
          <Img src={staticFile("real/last-clean.png")} style={fill} />
        </Sequence>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: C.base, opacity: veil }} />
      {captions ? <Caption frame={frame} /> : null}

      {/* iPhone Pro フレーム（上下中央・大サイズ） */}
      {glide > 0 ? (
        <PhoneFrame
          style={{
            left: 520 - 414 / 2,
            opacity: glide,
            transform: `scale(${PHONE_SCALE * (0.94 + 0.06 * glide)})`,
          }}
        >
          <Sequence from={at(SCENE_AT)} layout="none" durationInFrames={recFrames}>
            <RecordingTrack file={FILE} seconds={null} segments={realSegments} total={recFrames} />
          </Sequence>
        </PhoneFrame>
      ) : null}

      <Panel frame={frame} />
    </AbsoluteFill>
  );
};

const fill: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };

const Caption: React.FC<{ frame: number }> = ({ frame }) => {
  const s = frame / FPS;
  const list = [
    { from: 0.8, to: 5.5, text: "お客様が箱を持って相談に来られたら、バーコードを読み取るだけ。" },
    { from: 6.0, to: 11.5, text: "接客前に確認すべきポイントと問いかけが、瞬時に手元にそろいます。" },
  ];
  const cur = list.find((c) => s >= c.from && s < c.to);
  if (!cur) return null;
  const a = Math.min(ramp(frame, Math.round(cur.from * FPS), 8), 1 - ramp(frame, Math.round(cur.to * FPS) - 8, 8));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 36, display: "flex", justifyContent: "center", opacity: a }}>
      <div style={{ background: "rgba(14,17,22,0.82)", color: C.white, fontSize: 44, fontWeight: 500, padding: "12px 32px", borderRadius: 14, letterSpacing: 2 }}>{cur.text}</div>
    </div>
  );
};

const Panel: React.FC<{ frame: number }> = ({ frame }) => {
  const fin = ramp(frame, Math.round(44.0 * FPS), 18);
  return (
    <div style={{ position: "absolute", left: 980, top: 130, width: 880 }}>
      <div style={rise(frame, Math.round(9.5 * FPS))}>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.navy, letterSpacing: 4 }}>バーコードを読み取るだけ</div>
        <div style={{ fontSize: 50, fontWeight: 700, color: C.text, marginTop: 6, lineHeight: 1.25, whiteSpace: "nowrap" }}>
          確認の材料が、瞬時にそろう
        </div>
        <div style={{ width: 96, height: 6, background: C.navy, marginTop: 18, marginBottom: 24, borderRadius: 3 }} />
      </div>

      <ProblemSolutionBanner
        problem="小さな文字の箱の裏や添付文書を、お客様の前で必死に探す"
        solution="バーコード1秒読取 ➔ 確認ポイントと注意点が一瞬で手元に集約"
        at={10.2}
      />

      <FeatureList
        items={[
          {
            badge: "一瞬で集約",
            title: "接客前チェック：確認ポイントと問いかけを整理",
            desc: "年齢確認・運転予定・併用薬の注意など、確認漏れを未然に防止",
            at: 10.4,
          },
          {
            badge: "直感バッジ",
            title: "ドーピング・ハラール・授乳・運転をひと目で確認",
            desc: "添付文書を開いて探す手間をゼロにし、お客様をお待たせしない",
            at: 21.0,
          },
          {
            badge: "現場の安心",
            title: "新人でも戸惑わず、その場で自信を持って答えられる",
            desc: "文字が小さくて読みづらい箱の裏を探すストレスから解放",
            at: 29.5,
          },
        ]}
      />

      <div
        style={{
          marginTop: 22,
          padding: "14px 24px",
          borderRadius: 14,
          background: C.navy,
          color: C.white,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 1.5,
          textAlign: "center",
          opacity: fin,
          transform: `translateY(${(1 - fin) * 14}px)`,
        }}
      >
        探す時間をなくし、目の前のお客様との対話に集中。
      </div>
    </div>
  );
};


