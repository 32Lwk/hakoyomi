import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ramp, rise } from "../components/anim";
import { RecordingTrack } from "../components/AppScene";
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
  const pts = [
    { at: 10.4, text: "接客前チェック：お客様への問いかけが瞬時にそろう", note: "最初に確認すべき重要ポイントを自動で整理" },
    { at: 21.0, text: "国の機関（PMDA等）のデータを参照し正確に回答", note: "ドーピングやハラール対応も根拠とともにすぐ確認" },
    { at: 34.0, text: "授乳・運転・年齢・カフェインもワンタップで根拠表示", note: "細かい箱の記載や添付文書をその場で探す手間をゼロに" },
  ];
  const fin = ramp(frame, Math.round(44.5 * FPS), 18);
  return (
    <div style={{ position: "absolute", left: 1040, top: 170, width: 800 }}>
      <div style={rise(frame, Math.round(10.1 * FPS))}>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.navy, letterSpacing: 4 }}>バーコードを読み取るだけ</div>
        <div style={{ fontSize: 52, fontWeight: 700, color: C.text, marginTop: 8, lineHeight: 1.25, whiteSpace: "nowrap" }}>確認の材料が、瞬時にそろう</div>
        <div style={{ width: 96, height: 6, background: C.navy, marginTop: 24, borderRadius: 3 }} />
      </div>
      <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 18 }}>
        {pts.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 22, alignItems: "flex-start", ...rise(frame, Math.round(p.at * FPS)) }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: C.navy, marginTop: 20, flex: "none" }} />
            <div>
              <div style={{ fontSize: 34, color: C.text, fontWeight: 500, lineHeight: 1.4 }}>{p.text}</div>
              {p.note ? <div style={{ fontSize: 24, color: C.sub, marginTop: 2 }}>{p.note}</div> : null}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 30, padding: "18px 28px", borderRadius: 18, background: C.navy, color: C.white, fontSize: 38, whiteSpace: "nowrap", fontWeight: 700, letterSpacing: 2, opacity: fin, transform: `translateY(${(1 - fin) * 14}px)` }}>
        新人でも、ベテランと同じ自信で。
      </div>
    </div>
  );
};


