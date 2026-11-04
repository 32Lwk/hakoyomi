import React from "react";
import { AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ramp, rise } from "../components/anim";
import { HakoyomiIcon, Wordmark } from "../components/Wordmark";
import { C, FONT, FPS } from "../theme";

// S1 つかみ（24秒）：実写（Gemini 生成・無音・顔の出る人物は架空）
//  0〜3.5  お客様の手（顔なし）が2つの箱を見せる
//  3.1〜12.4  新人（調べて困る）とベテラン（その場で説明）を左右に並べる
//  12.4〜24  タイトル
const at = (s: number) => Math.round(s * FPS);
const fill: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };

const Chip: React.FC<{ text: string; sub?: string; left: number; frame: number; from: number }> = ({ text, sub, left, frame, from }) => (
  <div style={{ position: "absolute", left, bottom: 150, ...rise(frame, at(from), 14) }}>
    <div style={{ background: "rgba(255,255,255,0.94)", color: C.navy, fontSize: 40, fontWeight: 700, padding: "8px 28px", borderRadius: 999, boxShadow: "0 6px 20px rgba(0,0,0,0.25)", letterSpacing: 3 }}>{text}</div>
    {sub ? <div style={{ marginTop: 10, color: C.white, fontSize: 28, fontWeight: 500, textShadow: "0 2px 10px rgba(0,0,0,0.6)", paddingLeft: 12 }}>{sub}</div> : null}
  </div>
);

export const S1Real: React.FC = () => {
  const frame = useCurrentFrame();
  const aOut = 1 - ramp(frame, at(3.1), at(0.5));
  const bIn = ramp(frame, at(3.1), at(0.5));
  const bOut = 1 - ramp(frame, at(12.2), at(0.6));
  const tIn = ramp(frame, at(12.2), at(0.8));
  const bar = interpolate(frame, [at(0), at(17)], [0, 1]);
  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      {/* A お客様 */}
      {aOut > 0 ? (
        <AbsoluteFill style={{ opacity: aOut }}>
          <Sequence from={0} durationInFrames={at(3.8)} layout="none">
            <OffthreadVideo src={staticFile("real/s1-customer-a.mp4")} muted style={{ ...fill, transform: `scale(${1 + bar * 0.06})` }} />
          </Sequence>
          <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(0,0,0,0.0) 55%,rgba(0,0,0,0.45) 100%)" }} />
          <div style={{ position: "absolute", left: 80, top: 80, ...rise(frame, at(0.4), 14) }}>
            <div style={{ background: "rgba(255,255,255,0.94)", color: C.navy, fontSize: 38, fontWeight: 700, padding: "8px 26px", borderRadius: 999, letterSpacing: 3, boxShadow: "0 6px 20px rgba(0,0,0,0.25)" }}>お客様の質問</div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* B 新人とベテラン */}
      {bIn > 0 && bOut > 0 ? (
        <AbsoluteFill style={{ opacity: bIn * bOut }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 958, height: 1080, overflow: "hidden" }}>
            <Sequence from={at(3.1)} durationInFrames={at(9.8)} layout="none">
              <OffthreadVideo src={staticFile("real/s1-novice-a.mp4")} muted trimBefore={at(0.5)} playbackRate={0.8} style={fill} />
            </Sequence>
          </div>
          <div style={{ position: "absolute", right: 0, top: 0, width: 958, height: 1080, overflow: "hidden" }}>
            <Sequence from={at(3.1)} durationInFrames={at(9.8)} layout="none">
              <OffthreadVideo src={staticFile("real/s1-veteran-a.mp4")} muted trimBefore={at(1.2)} playbackRate={0.75} style={fill} />
            </Sequence>
          </div>
          <div style={{ position: "absolute", left: 958, top: 0, width: 4, height: 1080, background: C.white }} />
          <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,0) 62%,rgba(0,0,0,0.5) 100%)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 168, textAlign: "center", color: C.white, fontSize: 56, fontWeight: 700, letterSpacing: 4, textShadow: "0 4px 24px rgba(0,0,0,0.55)", ...rise(frame, at(3.6), 18) }}>
            同じ質問でも、答えは、誰が立っているかで変わる。
          </div>
          <Chip text="新人" sub="調べながら" left={90} frame={frame} from={4.4} />
          <Chip text="ベテラン" sub="その場で説明" left={1050} frame={frame} from={4.8} />
        </AbsoluteFill>
      ) : null}

      {/* C タイトル */}
      {tIn > 0 ? (
        <AbsoluteFill style={{ opacity: tIn }}>
          <Img src={staticFile("real/s1-bg.png")} style={{ ...fill, filter: "blur(14px)", transform: "scale(1.08)" }} />
          <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.72) 0%,rgba(240,244,249,0.86) 100%)" }} />
          <Title frame={frame} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const BARS = [0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1];
const Title: React.FC<{ frame: number }> = ({ frame }) => {
  const t0 = at(12.8);
  const draw = ramp(frame, t0, at(1.0));
  const scan = ramp(frame, t0 + at(0.9), at(1.1));
  const word = ramp(frame, t0 + at(1.6), 22);
  const tag = ramp(frame, t0 + at(2.7), 20);
  const sub = ramp(frame, t0 + at(3.8), 20);
  const size = 128;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 46 }}>
        {/* 3D薬箱＋スキャン枠の記号（立体キューブとバーコードが描かれ、光の線が走る） */}
        <div style={{ position: "relative", width: size * 1.5, height: size * 1.5, opacity: draw, transform: `scale(${0.9 + draw * 0.1})` }}>
          <HakoyomiIcon size={size * 1.5} draw={draw} idSuffix="s1" />
          <div style={{ position: "absolute", left: 14, right: 14, top: `${22 + scan * 56}%`, height: 5, borderRadius: 3, background: "#8FB4E8", boxShadow: "0 0 24px 4px rgba(143,180,232,0.9)", opacity: scan > 0 && scan < 1 ? 1 : 0 }} />
        </div>
        <div style={{ opacity: word, transform: `translateX(${(1 - word) * 30}px)` }}>
          <div style={{ fontSize: 190, fontWeight: 700, color: C.navy, letterSpacing: 14, lineHeight: 1 }}>ハコよみ</div>
        </div>
      </div>
      <div style={{ marginTop: 40, width: 760 * tag, height: 5, background: `linear-gradient(90deg,${C.navy},rgba(30,58,95,0))`, borderRadius: 3 }} />
      <div style={{ marginTop: 34, fontSize: 58, fontWeight: 500, color: C.text, letterSpacing: 6, opacity: tag, transform: `translateY(${(1 - tag) * 14}px)` }}>
        誰が接客しても、同じ水準の説明を。
      </div>
      <div style={{ marginTop: 26, fontSize: 32, color: C.sub, letterSpacing: 5, opacity: sub }}>登録販売者の店頭業務を支える</div>
    </AbsoluteFill>
  );
};
