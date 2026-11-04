import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ramp } from "../components/anim";
import { SceneHeading } from "../components/AppScene";
import { C, FONT } from "../theme";

// S4 質問エージェントの仕組み。件数は実際の処理（/api/ask の段階表示）から入れる。null は「○」で出す。
export type PipelineProps = {
  question: string;
  candidates: number | null;
  extracted: number | null;
  matched: number | null;
  excluded: number | null;
  blocked: number | null;
};

// S4 の録画（video/record/out/S4-ask、パブロンSゴールドW錠「授乳中について書いてある？」）の「どう答えたか」の値
export const pipelineDefaults: PipelineProps = {
  question: "授乳中について書いてある？",
  candidates: 3,
  extracted: 2,
  matched: 2,
  excluded: 0,
  blocked: 0,
};

const n = (v: number | null) => (v === null ? "○" : String(v));

type Step = { name: string; detail: string; result?: string[] };
const steps = (p: PipelineProps): Step[] => [
  { name: "質問", detail: `「${p.question}」` },
  { name: "解釈", detail: "何を聞いているか・どの商品か" },
  { name: "検索", detail: "tool use で商品の事実と通知を探す", result: [`候補 ${n(p.candidates)}件`] },
  { name: "照合", detail: "質問に当たる記載を抜き出す", result: [`抜き出し ${n(p.extracted)}件`] },
  { name: "出典検証", detail: "原文と一致しない文は捨てる", result: [`一致 ${n(p.matched)}件`, `除外 ${n(p.excluded)}件`] },
  { name: "ガード", detail: "禁止語＋自己検査", result: [`差し止め ${n(p.blocked)}件`] },
  { name: "回答", detail: "抜き出した文＋出典だけを返す" },
];

/**
 * start から stepFrames ごとに1段ずつ進む。vertical は録画の横の右側用、horizontal は全画面用。
 */
export const PipelineDiagram: React.FC<PipelineProps & { start: number; stepFrames: number; orientation: "vertical" | "horizontal" }> = ({
  start,
  stepFrames,
  orientation,
  ...p
}) => {
  const frame = useCurrentFrame();
  const list = steps(p);
  const active = Math.floor((frame - start) / stepFrames);
  const vertical = orientation === "vertical";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        alignItems: vertical ? "stretch" : "flex-start",
        gap: 0,
        fontFamily: FONT,
      }}
    >
      {list.map((s, i) => {
        const t = ramp(frame, start + i * stepFrames, 10);
        const isNow = i === active;
        const done = i < active || (i === list.length - 1 && i <= active);
        const shown = t > 0;
        const fill = isNow ? C.navy : C.white;
        const fg = isNow ? C.white : shown ? C.text : C.muted;
        const border = shown ? C.navy : C.line;
        const box: React.CSSProperties = vertical
          ? { display: "flex", alignItems: "center", gap: 24, height: 70, padding: "0 26px", borderRadius: 14 }
          : { display: "flex", flexDirection: "column", gap: 10, width: 226, height: 300, padding: "22px 18px", borderRadius: 18 };
        return (
          <React.Fragment key={s.name}>
            {i > 0 ? <Arrow vertical={vertical} on={shown} /> : null}
            <div
              style={{
                ...box,
                background: fill,
                border: `3px solid ${border}`,
                color: fg,
                opacity: 0.35 + 0.65 * t,
                boxSizing: "border-box",
              }}
            >
              <div style={{ fontSize: vertical ? 32 : 34, fontWeight: 700, width: vertical ? 150 : "auto", flex: "none", letterSpacing: 1 }}>
                {s.name}
              </div>
              <div style={{ fontSize: vertical ? 24 : 24, lineHeight: 1.45, flex: 1, color: isNow ? C.white : C.sub, opacity: shown ? 1 : 0.6 }}>
                {s.detail}
              </div>
              {s.result ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: vertical ? "row" : "column",
                    gap: vertical ? 10 : 6,
                    flex: "none",
                    marginTop: vertical ? 0 : "auto",
                    alignSelf: vertical ? "center" : "stretch",
                    opacity: done || isNow ? 1 : 0,
                  }}
                >
                  {s.result.map((r) => (
                    <div
                      key={r}
                      style={{
                        fontSize: vertical ? 26 : 25,
                        fontWeight: 700,
                        padding: "4px 12px",
                        borderRadius: 8,
                        background: isNow ? C.white : C.navySoft,
                        color: C.navy,
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Arrow: React.FC<{ vertical: boolean; on: boolean }> = ({ vertical, on }) => {
  const color = on ? C.navy : C.line;
  return vertical ? (
    <div style={{ height: 14, display: "flex", justifyContent: "flex-start", paddingLeft: 90 }}>
      <svg width="20" height="14" viewBox="0 0 20 14">
        <path d="M10 0 V8 M3 6 L10 13 L17 6" stroke={color} strokeWidth="3" fill="none" />
      </svg>
    </div>
  ) : (
    <div style={{ width: 32, height: 300, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
      <svg width="30" height="20" viewBox="0 0 30 20">
        <path d="M0 10 H26 M18 3 L27 10 L18 17" stroke={color} strokeWidth="3" fill="none" />
      </svg>
    </div>
  );
};

/** 単体の素材（全画面・横並び）。差し込み用に字幕なしで書き出せる */
export const S4PipelineStandalone: React.FC<PipelineProps> = (p) => (
  <AbsoluteFill style={{ background: C.white, fontFamily: FONT, padding: "90px 70px" }}>
    <SceneHeading id="S4" title="質問エージェントの仕組み" />
    <div style={{ marginTop: 90 }}>
      <PipelineDiagram {...p} start={20} stepFrames={60} orientation="horizontal" />
    </div>
    <div style={{ position: "absolute", left: 70, bottom: 80, fontSize: 28, color: C.sub }}>
      件数は実際の処理の記録（/api/ask の段階表示）
    </div>
  </AbsoluteFill>
);

