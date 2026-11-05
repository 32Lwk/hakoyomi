import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { cueSec } from "../captions";
import { ramp, rise } from "../components/anim";
import { HakoyomiIcon } from "../components/Wordmark";
import { C, FONT } from "../theme";
import { sec } from "../timeline";

// S7 ハコよみが変える店頭の姿と結び（前半：新人が自信を持って接客できている店頭、後半：新人・ベテランが並ぶ背景での結び）
export type S7Props = {
  banwordHits: number | null;
  checkedQuestions: number | null;
  checkedSentences: number | null;
  checkMethod: string;
  firstCommit: string;
  commitCount: number | null;
  repoUrl: string;
};

export const s7Defaults: S7Props = {
  banwordHits: 0,
  checkedQuestions: 39,
  checkedSentences: 435,
  checkMethod: "推薦を引き出す質問を含む39問・435文の画面出力を禁止語で照合",
  firstCommit: "2026-11-02 15:09 JST",
  commitCount: 54,
  repoUrl: "github.com/32Lwk/hakoyomi",
};

export const S7: React.FC<S7Props> = (p) => {
  const frame = useCurrentFrame();
  const tClose = sec(cueSec("s7-3")) - 10;
  const closeFade = ramp(frame, tClose, 20);

  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      {/* 前半（0〜15秒）：S1で困っていた新人が、ハコよみを手にお客様へ自信を持って笑顔で説明している姿 */}
      {closeFade < 1 ? (
        <AbsoluteFill style={{ opacity: 1 - closeFade }}>
          <AfterScene />
        </AbsoluteFill>
      ) : null}

      {/* 後半・締め（14.8〜26秒）：改善した店頭の姿を背景に、メインメッセージとロゴで締める */}
      {closeFade > 0 ? (
        <AbsoluteFill style={{ opacity: closeFade }}>
          <Closing repoUrl={p.repoUrl} start={tClose} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const AfterScene: React.FC = () => {
  const frame = useCurrentFrame();
  const t2 = sec(cueSec("s7-2"));
  const zoom = 1 + interpolate(frame, [0, 450], [0, 0.06], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT, overflow: "hidden" }}>
      <Img
        src={staticFile("real/s7-confident-1.jpg")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom})`,
        }}
      />
      {/* 人物の表情・スマホ・箱がくっきり見えるよう、左と下だけに控えめなグラデーションを敷く */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(10,18,30,0.18) 0%, rgba(10,18,30,0.05) 45%, rgba(10,18,30,0.72) 100%)",
        }}
      />

      {/* 左上ピル（S1の「お客様の質問」「新人／調べながら」と対になるラベル） */}
      <div style={{ position: "absolute", left: 80, top: 72, ...rise(frame, 8, 16) }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            background: "rgba(255,255,255,0.95)",
            color: C.navy,
            fontSize: 34,
            fontWeight: 700,
            padding: "10px 28px",
            borderRadius: 999,
            letterSpacing: 3,
            boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
          }}
        >
          <span style={{ width: 12, height: 12, borderRadius: 6, background: C.navy }} />
          ハコよみがある店頭
        </div>
      </div>

      {/* 左下の要点カード（人物の顔や手元に重ならない位置） */}
      <div
        style={{
          position: "absolute",
          left: 80,
          bottom: 136,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "rgba(14, 24, 40, 0.84)",
            backdropFilter: "blur(8px)",
            borderLeft: "6px solid #8FB4E8",
            borderRadius: "6px 18px 18px 6px",
            padding: "18px 32px",
            color: C.white,
            boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
            ...rise(frame, 14, 18),
          }}
        >
          <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: 2 }}>
            新人でも初日から、根拠を持って答えられる。
          </div>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.94)",
            borderRadius: 16,
            padding: "14px 28px",
            color: C.navy,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 1.5,
            boxShadow: "0 10px 28px rgba(0,0,0,0.25)",
            alignSelf: "flex-start",
            ...rise(frame, t2, 18),
          }}
        >
          誰もが等しい知識を持ち、対話に必要な正確な材料を瞬時に手元へ。
        </div>
      </div>
    </AbsoluteFill>
  );
};

const BARS = [0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1];

export const Closing: React.FC<{ repoUrl: string; start: number }> = ({ repoUrl, start }) => {
  const frame = useCurrentFrame();
  const rel = Math.max(0, frame - start);
  const bgScale = 1.02 + interpolate(rel, [0, 360], [0, 0.05], { extrapolateRight: "clamp" });
  const lineExpand = ramp(frame, start + 52, 22);

  return (
    <AbsoluteFill style={{ background: "#0B1524", fontFamily: FONT, overflow: "hidden" }}>
      {/* 背景：改善後の店頭で新人とベテランが共に自信を持って立つ姿（ぼかしすぎず表情が見えるようにする） */}
      <Img
        src={staticFile("real/s7-confident-2.jpg")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(3px)",
          transform: `scale(${bgScale})`,
        }}
      />
      {/* 背景の2人の笑顔と店頭の雰囲気がしっかり透けて見えるシネマティックなオーバーレイ */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(12, 23, 39, 0.52) 0%, rgba(15, 30, 52, 0.64) 52%, rgba(10, 18, 32, 0.82) 100%)",
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 44,
        }}
      >
        <div
          style={{
            padding: "8px 26px",
            borderRadius: 999,
            background: "rgba(14, 25, 42, 0.68)",
            border: "1px solid rgba(255, 255, 255, 0.32)",
            color: "#E2ECF8",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 5,
            ...rise(frame, start + 4, 16),
          }}
        >
          登録販売者の店頭業務を支える
        </div>

        <div
          style={{
            marginTop: 32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 36,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontSize: 60,
                fontWeight: 700,
                color: C.white,
                letterSpacing: 5,
                textShadow: "0 6px 24px rgba(0,0,0,0.65)",
                ...rise(frame, start + 10, 18),
              }}
            >
              年数の壁を、なくす。
            </span>
            <span
              style={{
                fontSize: 60,
                fontWeight: 700,
                color: C.white,
                letterSpacing: 5,
                textShadow: "0 6px 24px rgba(0,0,0,0.65)",
                ...rise(frame, start + 26, 18),
              }}
            >
              新人でも、自信を持って。
            </span>
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 78,
              fontWeight: 700,
              color: C.white,
              letterSpacing: 8,
              whiteSpace: "nowrap",
              textShadow: "0 8px 30px rgba(0,0,0,0.7)",
              ...rise(frame, start + 44, 20),
            }}
          >
            説明するのは、人。
          </div>
        </div>

        <div
          style={{
            marginTop: 26,
            width: 680 * lineExpand,
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg, rgba(143,180,232,0) 0%, #8FB4E8 50%, rgba(143,180,232,0) 100%)",
            opacity: lineExpand,
          }}
        />

        <div
          style={{
            marginTop: 34,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            ...rise(frame, start + 62, 20),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <HakoyomiIcon size={92} idSuffix="s7" />
            <div
              style={{
                fontSize: 94,
                fontWeight: 700,
                color: C.white,
                letterSpacing: 10,
                lineHeight: 1,
                textShadow: "0 8px 28px rgba(0,0,0,0.65)",
              }}
            >
              ハコよみ
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "10px 28px",
              borderRadius: 999,
              background: "rgba(12, 22, 38, 0.72)",
              border: "1px solid rgba(255, 255, 255, 0.28)",
              color: "#E2ECF8",
              fontSize: 24,
              letterSpacing: 1.5,
            }}
          >
            <span>hakoyomi.yutok.dev</span>
            <span style={{ opacity: 0.45 }}>|</span>
            <span>{repoUrl}</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Roles: React.FC<{ start: number }> = () => <AfterScene />;
export const Results: React.FC<S7Props & { start: number }> = () => <AfterScene />;


