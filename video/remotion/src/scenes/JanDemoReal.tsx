import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { cueSec } from "../captions";
import { ramp, rise } from "../components/anim";
import { FeatureList, ProblemSolutionBanner, RecordingTrack } from "../components/AppScene";
import { PhoneFrame } from "../components/PhoneFrame";
import { C, FONT, FPS, LAYOUT } from "../theme";
import { scene, type Segment } from "../timeline";

export const REAL_CLIP_SEC = 3.6; // 実写クリップを3.6秒でスマートに完結
const SCENE_AT = 3.4; // アプリ画面（iPhoneフレーム＋スライド）へ切り替える秒
const REC_FROM = 10.6; // 商品カード上部（コルゲンコーワIB透明カプセルαプラス）が見える所から進む
export const getSceneSec = () => scene("S2").durationSec;
export const realSegments: Segment[] = [{ from: REC_FROM, to: 44.5, rate: 1.0 }];
export const REAL_TOTAL_SEC = 35;
const FILE = "recordings/S2-jan-badges.webm";

export const JanDemoReal: React.FC<{ captions?: boolean }> = ({ captions = true }) => {
  const frame = useCurrentFrame();
  const at = (sec: number) => Math.round(sec * FPS);
  const s2Def = scene("S2");
  const s2Segments = s2Def.segments ?? realSegments;
  const recFrames = at(s2Def.durationSec - SCENE_AT);

  // 3.4秒で実写からアプリ画面へスマートにフェード（酔いゼロ）
  const crossFade = ramp(frame, at(SCENE_AT), at(0.4));
  const realOpacity = 1 - crossFade;

  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      {/* 冒頭の実写クリップ：手元でバーコードをピッとするシーン（ブレや拡大変形なし） */}
      {realOpacity > 0 ? (
        <AbsoluteFill style={{ opacity: realOpacity }}>
          <Sequence from={0} durationInFrames={at(REAL_CLIP_SEC)} layout="none">
            <OffthreadVideo src={staticFile("real/jan-real-clip.mp4")} muted style={fill} />
          </Sequence>
        </AbsoluteFill>
      ) : null}

      {/* アプリ画面：iPhone Pro フレーム（上下中央）＋右側プレゼンスライド */}
      {crossFade > 0 ? (
        <AbsoluteFill style={{ opacity: crossFade }}>
          <PhoneFrame>
            <Sequence from={at(SCENE_AT)} layout="none" durationInFrames={recFrames}>
              <RecordingTrack file={FILE} seconds={null} segments={s2Segments} total={recFrames} />
            </Sequence>
          </PhoneFrame>

          <Panel frame={frame} />
        </AbsoluteFill>
      ) : null}

      {captions ? <Caption frame={frame} /> : null}
    </AbsoluteFill>
  );
};

const fill: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };

const Caption: React.FC<{ frame: number }> = ({ frame }) => {
  const s = frame / FPS;
  const list = [
    { from: 0.4, to: 4.2, text: "お客様が箱を持ってこられたら、バーコードを読み取るだけ。" },
    { from: 4.6, to: 9.6, text: "接客前に確認すべきポイントが、一瞬で手元に集約されます。" },
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
  const tFin = cueSec("s2-6");
  const fin = ramp(frame, Math.round(tFin * FPS), 18);
  return (
    <div style={{ position: "absolute", left: LAYOUT.panel.x, top: LAYOUT.panel.y, width: LAYOUT.panel.w }}>
      <div style={rise(frame, Math.round(3.8 * FPS))}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 18px",
            borderRadius: 999,
            background: C.navySoft,
            color: C.navy,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 3,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 4, background: C.navy }} />
          バーコードを読み取るだけ
        </div>
        <div style={{ fontSize: 50, fontWeight: 700, color: C.text, marginTop: 10, lineHeight: 1.25, whiteSpace: "nowrap" }}>
          確認の材料が、瞬時に手元にそろう
        </div>
        <div style={{ width: 96, height: 6, background: C.navy, marginTop: 16, marginBottom: 22, borderRadius: 3 }} />
      </div>

      <ProblemSolutionBanner
        problem="箱の裏や添付文書を必死に探す"
        solution="バーコード1秒で確認事項が集約"
        at={cueSec("s2-2")}
      />

      <FeatureList
        items={[
          {
            badge: "接客前チェック",
            title: "確認漏れを未然に防止",
            desc: "年齢・運転注意・併用薬など接客前の確認事項が一瞬で集約",
            at: cueSec("s2-2"),
          },
          {
            badge: "直感バッジ",
            title: "注意点をひと目で判断",
            desc: "ドーピング禁止成分やハラール・授乳中などの相談にも迷わず即答",
            at: cueSec("s2-3"),
          },
          {
            badge: "誰でも安心",
            title: "誰でも同じ高水準で説明",
            desc: "探す時間をゼロにし、お客様一人ひとりとの対話に集中",
            at: cueSec("s2-4"),
          },
        ]}
      />

      <div
        style={{
          marginTop: 20,
          padding: "16px 28px",
          borderRadius: 14,
          background: C.navy,
          color: C.white,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 1,
          textAlign: "center",
          boxShadow: "0 8px 20px rgba(30, 58, 95, 0.2)",
          opacity: fin,
          transform: `translateY(${(1 - fin) * 14}px)`,
        }}
      >
        探す時間をゼロに。目の前のお客様との対話に集中。
      </div>
    </div>
  );
};


