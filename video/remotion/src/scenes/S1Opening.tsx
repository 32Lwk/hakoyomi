import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { cueSec } from "../captions";
import { ramp, rise } from "../components/anim";
import { Wordmark } from "../components/Wordmark";
import { C, FONT } from "../theme";
import { sec } from "../timeline";

// S1 つかみ（15秒）。人の顔・実在の人物・商品名は出さない。吹き出しは推薦・効能の評価の言葉を含めない。
export const S1Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const tBubbles = sec(cueSec("s1-2")) - 6;
  const tLogo = sec(cueSec("s1-3")) - 6;

  const blackOut = 1 - ramp(frame, tBubbles - 8, 14);
  const bubblesOut = 1 - ramp(frame, tLogo - 6, 12);

  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      {/* 2. 売場（簡略図）と吹き出し */}
      {frame >= tBubbles - 10 && frame < tLogo + 10 ? (
        <AbsoluteFill style={{ opacity: bubblesOut }}>
          <Shelf />
          <Bubbles start={tBubbles} />
        </AbsoluteFill>
      ) : null}

      {/* 3. ロゴ */}
      {frame >= tLogo - 6 ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 90, opacity: ramp(frame, tLogo, 16) }}>
          <div style={{ transform: `scale(${interpolate(ramp(frame, tLogo, 24), [0, 1], [0.96, 1])})` }}>
            <Wordmark size={150} sub="登録販売者の店頭業務を支える" />
          </div>
        </AbsoluteFill>
      ) : null}

      {/* 1. 黒地に白文字 */}
      {blackOut > 0 ? (
        <AbsoluteFill
          style={{ background: C.black, justifyContent: "center", alignItems: "center", opacity: blackOut, paddingBottom: 60 }}
        >
          <div style={{ color: C.white, fontSize: 76, fontWeight: 700, lineHeight: 1.6, textAlign: "center", letterSpacing: 4 }}>
            <div style={rise(frame, 6, 20)}>同じ質問でも、</div>
            <div style={rise(frame, 24, 20)}>答えは、誰が立っているかで変わる。</div>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/** 売場の棚の簡略図（箱は無地。商品名・人は描かない） */
const Shelf: React.FC = () => {
  const rows = [0, 1, 2];
  const widths = [86, 64, 110, 72, 96, 58, 120, 80, 66, 104, 74, 92, 60, 112, 84, 70, 98, 62];
  return (
    <div style={{ position: "absolute", left: 120, right: 120, top: 40, height: 250, opacity: 0.9 }}>
      {rows.map((r) => (
        <div key={r} style={{ position: "absolute", left: 0, right: 0, top: r * 82, height: 82 }}>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: C.line }} />
          <div style={{ position: "absolute", left: 12, right: 12, bottom: 6, display: "flex", gap: 10, alignItems: "flex-end" }}>
            {widths.map((w, i) => (
              <div
                key={i}
                style={{
                  width: w,
                  height: 44 + ((i * 7 + r * 13) % 24),
                  background: (i + r) % 4 === 0 ? C.navySoft : "#EEF0F3",
                  border: `2px solid ${C.line}`,
                  borderBottom: "none",
                  borderRadius: "4px 4px 0 0",
                  flex: "none",
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Tag: React.FC<{ children: React.ReactNode; solid?: boolean }> = ({ children, solid }) => (
  <div
    style={{
      display: "inline-block",
      fontSize: 30,
      fontWeight: 700,
      padding: "6px 22px",
      borderRadius: 999,
      color: solid ? C.white : C.navy,
      background: solid ? C.navy : C.white,
      border: `3px solid ${C.navy}`,
      letterSpacing: 2,
    }}
  >
    {children}
  </div>
);

const Bubble: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; tail?: "left" | "right" | "bottom" }> = ({
  children,
  style,
  tail = "bottom",
}) => (
  <div
    style={{
      position: "relative",
      background: C.white,
      border: `3px solid ${C.text}`,
      borderRadius: 28,
      padding: "26px 36px",
      fontSize: 36,
      lineHeight: 1.55,
      color: C.text,
      ...style,
    }}
  >
    {children}
    <div
      style={{
        position: "absolute",
        width: 28,
        height: 28,
        background: C.white,
        borderRight: `3px solid ${C.text}`,
        borderBottom: `3px solid ${C.text}`,
        transform: "rotate(45deg)",
        ...(tail === "bottom"
          ? { bottom: -17, left: "50%", marginLeft: -14 }
          : tail === "left"
            ? { left: 48, top: -17, transform: "rotate(225deg)" }
            : { right: 48, top: -17, transform: "rotate(225deg)" }),
      }}
    />
  </div>
);

const Bubbles: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const q = start;
  const a1 = start + 36;
  const a2 = start + 60;
  return (
    <>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", ...rise(frame, q) }}>
        <div style={{ fontSize: 26, color: C.sub, marginBottom: 12, letterSpacing: 2 }}>お客様の質問</div>
        <Bubble style={{ fontSize: 44, fontWeight: 700, padding: "22px 48px" }}>「この薬とこの薬、何が違うの？」</Bubble>
      </div>

      <div style={{ position: "absolute", top: 520, left: 160, width: 600, ...rise(frame, a1) }}>
        <Bubble tail="left" style={{ minHeight: 120 }}>
          えっと…
          <br />
          少々お待ちください。
          <br />
          確認してきます。
        </Bubble>
        <div style={{ marginTop: 22 }}>
          <Tag>新人</Tag>
        </div>
      </div>

      <div style={{ position: "absolute", top: 520, right: 160, width: 820, ...rise(frame, a2) }}>
        <Bubble tail="right">
          違いは3つあります。
          <div style={{ fontSize: 32, color: C.sub, marginTop: 8, lineHeight: 1.6 }}>
            ・入っている成分と、その量
            <br />
            ・1回の量と、1日の回数
            <br />
            ・「してはいけないこと」の書き方
          </div>
          箱のこの欄に書いてあります。
        </Bubble>
        <div style={{ marginTop: 22, textAlign: "right" }}>
          <Tag solid>ベテラン</Tag>
        </div>
      </div>
    </>
  );
};
