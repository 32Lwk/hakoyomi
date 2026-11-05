import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { lineTiming } from "../captions";
import { findRecording } from "../recordings";
import { C, FONT, FPS, LAYOUT } from "../theme";
import { isHold, scene, sec, segLen, type SceneId, type Segment } from "../timeline";
import { rise } from "./anim";
import { PHONE_CX, PHONE_OUTER_W, PHONE_SCALE, PhoneFrame, RecordingPlaceholder } from "./PhoneFrame";

/** 画面録画の場面：左にスマホ（上下中央・大サイズ）、右に場面名と要点（背景は元の白） */
export const AppScene: React.FC<{ id: SceneId; children?: React.ReactNode }> = ({ id, children }) => {
  const def = scene(id);
  const rec = findRecording(id);
  const total = sec(def.durationSec);

  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      <PhoneFrame>
        {rec ? (
          <RecordingTrack file={rec.file} seconds={rec.seconds} segments={def.segments} total={total} />
        ) : (
          <RecordingPlaceholder
            sceneId={def.id}
            title={def.title}
            expected={`video/record/out/${def.id}-….webm`}
          />
        )}
      </PhoneFrame>
      {rec ? <LabelTrack segments={def.segments} total={total} /> : null}
      <div style={{ position: "absolute", left: LAYOUT.panel.x, top: LAYOUT.panel.y, width: LAYOUT.panel.w }}>
        <SceneHeading id={def.id} title={def.title} />
        <div style={{ marginTop: 32 }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
};

const videoStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" };

/** 区切りの順に録画を並べる。早送り・一時停止のあいだは画面の上に札を出す（時間を詰めたことを隠さない） */
export const RecordingTrack: React.FC<{ file: string; seconds: number | null; segments?: Segment[]; total: number }> = ({
  file,
  seconds,
  segments,
  total,
}) => {
  const src = staticFile(file);
  const end = seconds ?? total / FPS;
  const list: Segment[] = segments?.length ? segments : [{ from: 0, to: end, rate: 1 }];
  let at = 0;
  const items: React.ReactNode[] = [];
  let lastSourceSec = 0;
  list.forEach((g, i) => {
    const len = Math.max(1, Math.round(segLen(g) * FPS));
    if (at >= total) return;
    const dur = Math.min(len, total - at);
    if (isHold(g)) {
      items.push(
        <Sequence key={i} from={at} durationInFrames={dur} layout="none">
          <Freeze frame={0}>
            <OffthreadVideo src={src} muted trimBefore={Math.round(g.at * FPS)} style={videoStyle} />
          </Freeze>
        </Sequence>,
      );
      lastSourceSec = g.at;
    } else {
      items.push(
        <Sequence key={i} from={at} durationInFrames={dur} layout="none">
          <OffthreadVideo src={src} muted trimBefore={Math.round(g.from * FPS)} playbackRate={g.rate} style={videoStyle} />
        </Sequence>,
      );
      lastSourceSec = g.to;
    }
    at += dur;
  });
  // 区切りが場面より短いときは最後の絵で止める（札は出さない：ナレーションの終わりの余白）
  if (at < total) {
    const t = Math.min(lastSourceSec, end - 1 / FPS);
    items.push(
      <Sequence key="tail" from={at} durationInFrames={total - at} layout="none">
        <Freeze frame={0}>
          <OffthreadVideo src={src} muted trimBefore={Math.max(0, Math.round(t * FPS) - 1)} style={videoStyle} />
        </Freeze>
      </Sequence>,
    );
  }
  return <>{items}</>;
};

/** 早送り・一時停止の札。スマホの右下横（画面の中身を隠さず、上下中央の大きなスマホとも重ならない位置） */
const LabelTrack: React.FC<{ segments?: Segment[]; total: number }> = ({ segments, total }) => {
  let at = 0;
  const items: React.ReactNode[] = [];
  (segments ?? []).forEach((g, i) => {
    const len = Math.max(1, Math.round(segLen(g) * FPS));
    if (at >= total) return;
    const dur = Math.min(len, total - at);
    const label = isHold(g) ? <SpeedLabel text="一時停止" /> : g.rate > 1 ? <SpeedLabel text={`早送り ×${g.rate}`} ff /> : null;
    if (label)
      items.push(
        <Sequence key={i} from={at} durationInFrames={dur} layout="none">
          {label}
        </Sequence>,
      );
    at += dur;
  });
  return <>{items}</>;
};

const SpeedLabel: React.FC<{ text: string; ff?: boolean }> = ({ text, ff }) => (
  <div
    style={{
      position: "absolute",
      top: 40,
      left: LAYOUT.panel.x,
      display: "flex",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        borderRadius: 999,
        background: "rgba(30, 58, 95, 0.92)",
        color: C.white,
        fontFamily: FONT,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: 1,
        boxShadow: "0 4px 12px rgba(15,23,42,0.25)",
      }}
    >
      {ff ? (
        <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden>
          <path d="M0 0 L10 7 L0 14 Z M11 0 L21 7 L11 14 Z" fill={C.white} />
        </svg>
      ) : (
        <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden>
          <rect x="0" y="0" width="4" height="14" fill={C.white} />
          <rect x="8" y="0" width="4" height="14" fill={C.white} />
        </svg>
      )}
      {text}
    </div>
  </div>
);

const SCENE_BADGE_MAP: Record<string, string> = {
  S2b: "機能 01",
  S3: "機能 02",
  S4: "機能 03",
  S5: "機能 04",
  S6: "機能 05",
};

export const SceneHeading: React.FC<{ id: string; title: string }> = ({ id, title }) => {
  const frame = useCurrentFrame();
  const badgeText = SCENE_BADGE_MAP[id] ?? id.replace(".", "-");
  const titleSize = title.length > 15 ? 52 : 58;
  return (
    <div style={{ ...rise(frame, 4), maxWidth: 1100 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 18px",
          borderRadius: 999,
          background: C.navySoft,
          color: C.navy,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 3,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 4, background: C.navy }} />
        {badgeText}
      </div>
      <div style={{ fontSize: titleSize, fontWeight: 700, color: C.text, marginTop: 10, lineHeight: 1.25 }}>{title}</div>
      <div style={{ width: 96, height: 6, background: C.navy, marginTop: 18, marginBottom: 26, borderRadius: 3 }} />
    </div>
  );
};

/** 要点の箇条。at はナレーションの行 id（その行が始まると出る）か、場面の中の秒 */
export const Points: React.FC<{ items: { text: React.ReactNode; at: string | number; note?: string }[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {items.map((it, i) => {
        const atSec = typeof it.at === "number" ? it.at : lineTiming(it.at).inScene;
        return (
          <div key={i} style={{ display: "flex", gap: 22, alignItems: "flex-start", ...rise(frame, sec(atSec)) }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: C.navy, marginTop: 20, flex: "none" }} />
            <div>
              <div style={{ fontSize: 40, color: C.text, fontWeight: 500, lineHeight: 1.45 }}>{it.text}</div>
              {it.note ? <div style={{ fontSize: 26, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>{it.note}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** 現場の課題 ➔ ハコよみの解決 対比カード（デザインルール準拠：絵文字なし・赤色なし） */
export const ProblemSolutionBanner: React.FC<{
  problem: string;
  solution: string;
  at?: number | string;
}> = ({ problem, solution, at = 0 }) => {
  const frame = useCurrentFrame();
  const atSec = typeof at === "number" ? at : lineTiming(at).inScene;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1.15fr",
        gap: 16,
        alignItems: "stretch",
        marginBottom: 26,
        ...rise(frame, sec(atSec)),
      }}
    >
      {/* 現場の課題（薄いグレー下地＋濃グレー枠） */}
      <div
        style={{
          background: C.base,
          border: `1.5px solid ${C.line}`,
          borderRadius: 16,
          padding: "18px 24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 16, fontWeight: 700, color: C.sub, letterSpacing: 1.5 }}>
          <span>現場の課題</span>
        </div>
        <div style={{ fontSize: 27, fontWeight: 700, color: C.text, marginTop: 6, lineHeight: 1.35 }}>
          {problem}
        </div>
      </div>

      {/* 矢印 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.navy,
          fontSize: 32,
          fontWeight: 900,
          padding: "0 4px",
        }}
      >
        ➔
      </div>

      {/* ハコよみの解決（濃紺下地＋白文字） */}
      <div
        style={{
          background: C.navy,
          border: `1.5px solid ${C.navy}`,
          borderRadius: 16,
          padding: "18px 24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(30, 58, 95, 0.22)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 16, fontWeight: 700, color: "#93C5FD", letterSpacing: 1.5 }}>
          <span>ハコよみ</span>
        </div>
        <div style={{ fontSize: 27, fontWeight: 700, color: C.white, marginTop: 6, lineHeight: 1.35 }}>
          {solution}
        </div>
      </div>
    </div>
  );
};

export interface FeaturePoint {
  badge?: string;
  title: React.ReactNode;
  at: string | number;
}

/** 実務メリットを特大フォント（34px）で言い切る、シャープなプレゼン用リスト（濃紺アクセント・白地） */
export const FeatureList: React.FC<{ items: FeaturePoint[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {items.map((it, i) => {
        const atSec = typeof it.at === "number" ? it.at : lineTiming(it.at).inScene;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              background: C.white,
              border: `1.5px solid ${C.line}`,
              borderLeft: `6px solid ${C.navy}`,
              borderRadius: 14,
              padding: "18px 24px",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
              ...rise(frame, sec(atSec)),
            }}
          >
            {it.badge ? (
              <span
                style={{
                  background: C.navySoft,
                  color: C.navy,
                  fontSize: 21,
                  fontWeight: 700,
                  padding: "6px 14px",
                  borderRadius: 8,
                  letterSpacing: 0.5,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {it.badge}
              </span>
            ) : null}
            <div style={{ fontSize: 34, fontWeight: 700, color: C.text, lineHeight: 1.3, whiteSpace: "nowrap" }}>
              {it.title}
            </div>
          </div>
        );
      })}
    </div>
  );
};


