import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { ramp, rise } from "../components/anim";
import { RecordingTrack } from "../components/AppScene";
import { C, FONT, FPS, W, H } from "../theme";
import { isHold, segLen, type Segment } from "../timeline";

// JAN のデモ動画：ドラッグストアで、初心者マークをつけた登録販売者（白衣）が、手に持った医薬品の JAN を
// iPhone／iPad のハコよみで読む → 画面収録へ。人物は顔を描かない簡略図（S1 と同じ方針）。箱は無地で商品名を出さない。
// 画面収録は video/record の S2（iPhone）／ DEVICE=ipad の JD-ipad-S2（iPad）。

export type Device = "iphone" | "ipad";
export type JanDemoProps = { device: Device; file: string; segments: Segment[]; jan: string };

const INTRO = 9.2; // 画面収録が始まる秒
const DEVICES = {
  iphone: { w: 390, h: 844, bezel: 16, radius: 56, hand: 0.46, final: 1.06 },
  ipad: { w: 820, h: 1180, bezel: 22, radius: 40, hand: 0.34, final: 0.76 },
} as const;

export const iphoneSegments: Segment[] = [
  { from: 9.1, to: 23, rate: 1 },
  { from: 23, to: 26, rate: 3 },
  { from: 26, to: 32, rate: 1 },
];
export const janDemoDefaults: Record<Device, JanDemoProps> = {
  iphone: { device: "iphone", file: "recordings/JD-iphone-S2-jan-badges.webm", segments: iphoneSegments, jan: "4987306047372" },
  ipad: { device: "ipad", file: "recordings/JD-ipad-S2-jan-badges.webm", segments: iphoneSegments, jan: "4987306047372" },
};

export const janDemoSeconds = (segments: Segment[]) => INTRO + segments.reduce((a, g) => a + segLen(g), 0);

const t = (frame: number) => frame / FPS;

export const JanDemo: React.FC<JanDemoProps> = ({ device, file, segments, jan }) => {
  const frame = useCurrentFrame();
  const s = t(frame);
  const D = DEVICES[device];
  const outerW = D.w + D.bezel * 2;
  const outerH = D.h + D.bezel * 2;
  const recFrames = Math.round((janDemoSeconds(segments) - INTRO) * FPS);

  // 端末の動き：手の中（読み取り）→ 画面の左へ大きく
  const fly = ramp(frame, Math.round(6.7 * FPS), Math.round(2.1 * FPS));
  const hand = { cx: 1130, cy: 520, sc: D.hand, rot: -5 };
  const fin = { cx: 560, cy: H / 2, sc: D.final, rot: 0 };
  const cx = interpolate(fly, [0, 1], [hand.cx, fin.cx]);
  const cy = interpolate(fly, [0, 1], [hand.cy, fin.cy]);
  const sc = interpolate(fly, [0, 1], [hand.sc, fin.sc]);
  const rot = interpolate(fly, [0, 1], [hand.rot, fin.rot]);
  const bob = Math.sin(s * 1.6) * 3 * (1 - fly);

  const veil = ramp(frame, Math.round(6.6 * FPS), Math.round(2.2 * FPS)); // 売り場を白へ溶かす
  const scanned = s >= 5.9;
  const recIn = ramp(frame, Math.round(8.4 * FPS), 12);

  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      <AbsoluteFill style={{ filter: `blur(${veil * 10}px)`, opacity: ramp(frame, 0, 12) }}>
        <Store />
        <Clerk frame={frame} jan={jan} scanned={scanned} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: C.white, opacity: veil * 0.94 }} />

      {/* 端末（手の中 → 画面収録） */}
      <div
        style={{
          position: "absolute",
          left: cx - outerW / 2,
          top: cy - outerH / 2 + bob,
          width: outerW,
          height: outerH,
          transform: `scale(${sc}) rotate(${rot}deg)`,
          transformOrigin: "center",
          borderRadius: D.radius + D.bezel * 0.4,
          background: "#15181D",
          boxShadow: `0 ${30 * (0.4 + fly)}px ${70 * (0.4 + fly)}px rgba(15, 23, 42, ${0.22 + fly * 0.06}), 0 0 0 2px #2A2F37 inset`,
          padding: D.bezel,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: D.w,
            height: D.h,
            borderRadius: D.radius - D.bezel * 0.5,
            overflow: "hidden",
            position: "relative",
            background: "#0E1116",
          }}
        >
          <Viewfinder frame={frame} w={D.w} h={D.h} jan={jan} scanned={scanned} />
          <div style={{ position: "absolute", inset: 0, opacity: recIn, background: C.white }}>
            <Sequence from={Math.round(INTRO * FPS)} layout="none" durationInFrames={recFrames}>
              <RecordingTrack file={file} seconds={null} segments={segments} total={recFrames} />
            </Sequence>
          </div>
          <div style={{ opacity: 1 - recIn }}><Notch device={device} /></div>
        </div>
      </div>

      <Captions frame={frame} />
      <Panel frame={frame} />
      <SpeedLabel frame={frame} segments={segments} cx={fin.cx} bottom={H / 2 + (outerH * D.final) / 2 + 10} show={fly > 0.99} />
    </AbsoluteFill>
  );
};

const Notch: React.FC<{ device: Device }> = ({ device }) =>
  device === "iphone" ? (
    <div style={{ position: "absolute", top: 10, left: "50%", marginLeft: -52, width: 104, height: 30, borderRadius: 15, background: "#0A0B0D" }} />
  ) : (
    <div style={{ position: "absolute", top: 12, left: "50%", marginLeft: -5, width: 10, height: 10, borderRadius: 5, background: "#0A0B0D" }} />
  );

/** 端末の中の読み取り画面（JANを読む）。バーコードに線が走り、読めたら JAN が出る */
export const Viewfinder: React.FC<{ frame: number; w: number; h: number; jan: string; scanned: boolean }> = ({ frame, w, h, jan, scanned }) => {
  const u = w / 390;
  const s = t(frame);
  const line = ((s - 2.8) % 1.1) / 1.1;
  const barW = 220 * u;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#1B232C 0%,#0E1116 70%)", fontFamily: FONT }}>
      <div style={{ position: "absolute", top: 62 * u, left: 0, right: 0, textAlign: "center", color: C.white, fontSize: 24 * u, fontWeight: 700, letterSpacing: 2 }}>
        JANを読む
      </div>
      <div style={{ position: "absolute", left: (w - barW) / 2 - 30 * u, top: h * 0.34, width: barW + 60 * u, height: 170 * u }}>
        {/* 枠の四隅 */}
        {[
          { l: 0, tp: 0, bl: "L", bt: "T" },
          { l: 1, tp: 0, bl: "R", bt: "T" },
          { l: 0, tp: 1, bl: "L", bt: "B" },
          { l: 1, tp: 1, bl: "R", bt: "B" },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              [c.l ? "right" : "left"]: 0,
              [c.tp ? "bottom" : "top"]: 0,
              width: 34 * u,
              height: 34 * u,
              borderColor: C.white,
              borderStyle: "solid",
              borderWidth: 0,
              [`border${c.bt === "T" ? "Top" : "Bottom"}Width`]: 4 * u,
              [`border${c.bl === "L" ? "Left" : "Right"}Width`]: 4 * u,
              borderRadius: 6 * u,
            }}
          />
        ))}
        <div style={{ position: "absolute", left: 30 * u, top: 30 * u, width: barW, height: 110 * u, background: C.white, borderRadius: 6 * u, display: "flex", gap: 3 * u, padding: `${14 * u}px ${12 * u}px`, boxSizing: "border-box" }}>
          <Bars color="#111" />
        </div>
        {!scanned ? (
          <div style={{ position: "absolute", left: 6 * u, right: 6 * u, top: 12 * u + line * 146 * u, height: 4 * u, background: "#8FB4E8", boxShadow: "0 0 18px #8FB4E8", borderRadius: 2 }} />
        ) : null}
      </div>
      <div style={{ position: "absolute", left: 24 * u, right: 24 * u, bottom: 150 * u, ...(scanned ? rise(frame, Math.round(5.9 * FPS), 8) : { opacity: 0 }) }}>
        <div style={{ background: C.white, borderRadius: 18 * u, padding: `${16 * u}px ${20 * u}px`, textAlign: "center" }}>
          <div style={{ fontSize: 17 * u, color: C.sub }}>読み取りました</div>
          <div style={{ fontSize: 28 * u, fontWeight: 700, color: C.navy, letterSpacing: 2, marginTop: 4 * u }}>{jan}</div>
        </div>
      </div>
      {!scanned ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 160 * u, textAlign: "center", color: "rgba(255,255,255,0.72)", fontSize: 17 * u }}>
          箱のバーコードを枠に合わせます
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const BAR_W = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 1, 2, 3, 1, 1, 2];
const Bars: React.FC<{ color: string }> = ({ color }) => (
  <>
    {BAR_W.map((b, i) => (
      <div key={i} style={{ flex: b, background: i % 2 === 0 ? color : "transparent" }} />
    ))}
  </>
);

// ───────── ドラッグストア（簡略図。商品名・文字のある商品は描かない） ─────────
const BOX = ["#DCE6F2", "#F6E7B8", "#D6E9E1", "#F3D9D5", "#E4DDF1", "#FFFFFF", "#CFE0EA", "#EDE3D3"];
const ShelfBank: React.FC<{ x: number; y: number; w: number; rows: number; rowH: number; seed: number; tone?: number }> = ({ x, y, w, rows, rowH, seed, tone = 1 }) => (
  <g opacity={tone}>
    <rect x={x} y={y} width={w} height={rows * rowH + 14} fill="#F4F7FA" stroke="#C5CED8" strokeWidth={3} rx={6} />
    {Array.from({ length: rows }).map((_, r) => {
      const base = y + (r + 1) * rowH;
      let cx = x + 14;
      const boxes: React.ReactNode[] = [];
      let i = 0;
      while (cx < x + w - 50) {
        const bw = 34 + ((i * 13 + seed * 7 + r * 5) % 30);
        const bh = rowH * 0.42 + ((i * 11 + seed + r * 3) % 28);
        const col = BOX[(i * 3 + r * 2 + seed) % BOX.length];
        boxes.push(
          <g key={i}>
            <rect x={cx} y={base - bh} width={bw} height={bh} fill={col} stroke="#B9C3CE" strokeWidth={1.5} rx={2} />
            <rect x={cx} y={base - bh * 0.38} width={bw} height={bh * 0.14} fill="#1E3A5F" opacity={0.5} />
          </g>,
        );
        cx += bw + 6;
        i++;
      }
      return (
        <g key={r}>
          {boxes}
          <rect x={x + 4} y={base} width={w - 8} height={8} fill="#B3BECA" />
        </g>
      );
    })}
  </g>
);

const Sign: React.FC<{ x: number; label: string }> = ({ x, label }) => (
  <g>
    <line x1={x - 90} y1={92} x2={x - 90} y2={128} stroke="#9AA6B2" strokeWidth={3} />
    <line x1={x + 90} y1={92} x2={x + 90} y2={128} stroke="#9AA6B2" strokeWidth={3} />
    <rect x={x - 120} y={126} width={240} height={52} rx={8} fill="#1E3A5F" />
    <text x={x} y={162} fontSize={28} fontWeight={700} fill="#fff" textAnchor="middle" fontFamily={FONT}>
      {label}
    </text>
  </g>
);

const Store: React.FC = () => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
    <rect width={W} height={H} fill="#EEF3F7" />
    <rect width={W} height={92} fill="#FFFFFF" />
    {[160, 560, 960, 1360, 1760].map((x) => (
      <rect key={x} x={x - 110} y={28} width={220} height={26} rx={13} fill="#FFFFFF" stroke="#DCE3EA" strokeWidth={3} />
    ))}
    <rect y={92} width={W} height={6} fill="#DCE3EA" />
    {/* 奥の棚 */}
    <ShelfBank x={640} y={300} w={640} rows={3} rowH={118} seed={4} tone={0.8} />
    {/* 左右の棚 */}
    <ShelfBank x={30} y={190} w={600} rows={5} rowH={118} seed={1} />
    <ShelfBank x={1290} y={190} w={600} rows={5} rowH={118} seed={7} />
    {/* 床 */}
    <rect y={800} width={W} height={H - 800} fill="#D9DEE4" />
    {Array.from({ length: 10 }).map((_, i) => (
      <line key={i} x1={960 + (i - 4.5) * 60} y1={800} x2={960 + (i - 4.5) * 280} y2={H} stroke="#C8CED6" strokeWidth={2} />
    ))}
    <line x1={0} y1={880} x2={W} y2={880} stroke="#C8CED6" strokeWidth={2} />
    <Sign x={330} label="かぜ薬" />
    <Sign x={960} label="胃腸薬" />
    <Sign x={1590} label="鼻炎薬" />
  </svg>
);

// ───────── 登録販売者（白衣・初心者マーク）と医薬品の箱 ─────────
const SKIN = "#F1C8A5";
const OUT = "#C9D1DA";

/** 初心者マーク（若葉マーク）。濃い緑と黄の2色のくの字。縁は白 */
const Shoshinsha: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 8 Q0 0 8 0 L36 0 L50 14 L64 0 L92 0 Q100 0 100 8 L100 48 Q100 62 88 68 L50 96 L12 68 Q0 62 0 48 Z" fill="#fff" />
    <path d="M7 10 L34 7 L50 22 L50 84 L16 60 Q7 54 7 46 Z" fill="#1C7A3A" />
    <path d="M93 10 L66 7 L50 22 L50 84 L84 60 Q93 54 93 46 Z" fill="#F7C61B" />
  </g>
);

const Clerk: React.FC<{ frame: number; jan: string; scanned: boolean }> = ({ frame, jan, scanned }) => {
  const s = t(frame);
  const breathe = Math.sin(s * 1.4) * 2;
  const boxIn = ramp(frame, Math.round(0.8 * FPS), Math.round(1.2 * FPS));
  const flash = scanned ? Math.max(0, 1 - (s - 5.9) / 0.7) : 0;
  const beam = s > 2.2 ? (scanned ? 0.0 : 0.15 + 0.05 * Math.sin(s * 9)) : 0;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(0 ${breathe})`}>
        {/* 腕（箱を持つ側） */}
        <path d="M545 585 L450 790 L585 860" fill="none" stroke={OUT} strokeWidth={90} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M545 585 L450 790 L585 860" fill="none" stroke="#fff" strokeWidth={82} strokeLinecap="round" strokeLinejoin="round" />
        {/* 白衣 */}
        <path d="M505 1080 L525 575 Q530 505 610 488 L790 488 Q870 505 875 575 L895 1080 Z" fill="#fff" stroke={OUT} strokeWidth={4} />
        <path d="M640 488 L700 575 L760 488 Z" fill="#1E3A5F" />
        <path d="M640 488 L672 690 M760 488 L728 690" stroke={OUT} strokeWidth={4} fill="none" />
        <rect x={665} y={425} width={70} height={75} fill={SKIN} />
        {/* 頭（顔は描かない） */}
        <ellipse cx={700} cy={355} rx={78} ry={92} fill={SKIN} />
        <path d="M618 372 Q598 246 700 236 Q802 246 782 372 L782 432 Q772 444 765 424 L765 328 Q700 296 635 328 L635 424 Q628 444 618 432 Z" fill="#3B2A24" />
        {/* 名札と初心者マーク */}
        <rect x={560} y={604} width={118} height={32} rx={6} fill="#E8EEF5" stroke="#1E3A5F" strokeWidth={2} />
        <text x={619} y={627} fontSize={17} fontWeight={700} fill="#1E3A5F" textAnchor="middle" fontFamily={FONT}>登録販売者</text>
        <Shoshinsha x={566} y={498} s={0.9} />
        {/* 腕（端末を持つ側） */}
        <path d="M850 585 L985 770 L1110 640" fill="none" stroke={OUT} strokeWidth={90} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M850 585 L985 770 L1110 640" fill="none" stroke="#fff" strokeWidth={82} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={1128} cy={628} r={40} fill={SKIN} />
      </g>

      {/* 読み取りの光 */}
      {beam > 0 ? <polygon points="1070,600 1070,690 836,808 836,884" fill="#1E3A5F" opacity={beam} /> : null}

      {/* 医薬品の箱（無地。バーコードだけ） */}
      <g transform={`translate(0 ${(1 - boxIn) * 90 + breathe})`} opacity={boxIn}>
        <path d="M548 690 L598 656 L888 656 L842 690 Z" fill="#E5ECF3" stroke="#B9C3CE" strokeWidth={2} />
        <rect x={548} y={690} width={294} height={226} fill="#fff" stroke="#B9C3CE" strokeWidth={3} rx={4} />
        <rect x={548} y={690} width={294} height={62} fill="#1E3A5F" />
        <circle cx={588} cy={721} r={20} fill="none" stroke="#fff" strokeWidth={4} />
        <path d="M588 710 V732 M577 721 H599" stroke="#fff" strokeWidth={4} />
        <rect x={622} y={712} width={150} height={9} rx={4} fill="#fff" opacity={0.85} />
        <rect x={622} y={728} width={104} height={9} rx={4} fill="#fff" opacity={0.55} />
        <rect x={574} y={776} width={104} height={14} rx={7} fill="#DCE6F2" />
        <rect x={574} y={800} width={80} height={14} rx={7} fill="#DCE6F2" />
        {/* バーコード */}
        <rect x={694} y={790} width={134} height={104} fill="#fff" stroke="#E3E8EE" strokeWidth={2} />
        <g transform="translate(702 798)">
          {BAR_W.map((b, i) => {
            const x = BAR_W.slice(0, i).reduce((a, v) => a + v * 1.1 + 0.9, 0);
            return i % 2 === 0 ? <rect key={i} x={x} y={0} width={b * 1.1} height={64} fill="#111" /> : null;
          })}
        </g>
        <text x={761} y={886} fontSize={11} textAnchor="middle" fill="#333" fontFamily={FONT} letterSpacing={1}>
          {jan}
        </text>
        {flash > 0 ? <rect x={686} y={782} width={150} height={120} rx={6} fill="none" stroke="#8FB4E8" strokeWidth={6} opacity={flash} /> : null}
        {/* 手 */}
        <circle cx={578} cy={870} r={36} fill={SKIN} />
      </g>
    </svg>
  );
};

// ───────── 字幕・要点・早送りの札 ─────────
const Captions: React.FC<{ frame: number }> = ({ frame }) => {
  const s = t(frame);
  const list = [
    { from: 0.8, to: 4.8, text: "お客様が箱を持ってきたら、JAN を読むだけです。" },
    { from: 4.8, to: 8.6, text: "箱のバーコードに、端末をかざします。" },
  ];
  const cur = list.find((c) => s >= c.from && s < c.to);
  if (!cur) return null;
  const a = Math.min(ramp(frame, Math.round(cur.from * FPS), 8), 1 - ramp(frame, Math.round(cur.to * FPS) - 8, 8));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 36, display: "flex", justifyContent: "center", opacity: a }}>
      <div style={{ background: "rgba(14,17,22,0.82)", color: C.white, fontSize: 44, fontWeight: 500, padding: "12px 32px", borderRadius: 14, letterSpacing: 2 }}>
        {cur.text}
      </div>
    </div>
  );
};

const Panel: React.FC<{ frame: number }> = ({ frame }) => {
  const s = t(frame);
  if (s < INTRO - 0.6) return null;
  const pts = [
    { at: INTRO + 0.4, text: "箱の小さな文字の情報が、手元に出る" },
    { at: INTRO + 3.0, text: "確認ポイントが、バッジで一目で並ぶ" },
    { at: INTRO + 7.2, text: "タップで根拠。通知の項目・成分・出典" },
    { at: INTRO + 12.5, text: "バッジはコードで出していて、AI の推測ではない" },
  ];
  return (
    <div style={{ position: "absolute", left: 1040, top: 190, width: 800 }}>
      <div style={rise(frame, Math.round((INTRO - 0.4) * FPS))}>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.navy, letterSpacing: 4 }}>JAN DEMO</div>
        <div style={{ fontSize: 52, fontWeight: 700, color: C.text, marginTop: 8, lineHeight: 1.25, whiteSpace: "nowrap" }}>JANを読む → バッジ → 根拠</div>
        <div style={{ width: 96, height: 6, background: C.navy, marginTop: 24, borderRadius: 3 }} />
      </div>
      <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 30 }}>
        {pts.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 22, alignItems: "flex-start", ...rise(frame, Math.round(p.at * FPS)) }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: C.navy, marginTop: 20, flex: "none" }} />
            <div style={{ fontSize: 36, color: C.text, fontWeight: 500, lineHeight: 1.45 }}>{p.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** 録画の早送りは札で示す（時間を詰めたことを隠さない） */
const SpeedLabel: React.FC<{ frame: number; segments: Segment[]; cx: number; bottom: number; show: boolean }> = ({ frame, segments, cx, bottom, show }) => {
  if (!show) return null;
  let at = Math.round(INTRO * FPS);
  for (const g of segments) {
    const len = Math.max(1, Math.round(segLen(g) * FPS));
    const label = isHold(g) ? "一時停止" : g.rate > 1 ? `早送り ×${g.rate}` : null;
    if (label && frame >= at && frame < at + len)
      return (
        <div style={{ position: "absolute", left: cx - 120, width: 240, top: Math.min(bottom, H - 56), display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "6px 16px", borderRadius: 999, background: "rgba(30,58,95,0.92)", color: C.white, fontSize: 24, fontWeight: 700 }}>{label}</div>
        </div>
      );
    at += len;
  }
  return null;
};
