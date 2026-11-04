import React from "react";
import { useCurrentFrame } from "remotion";
import { lineTiming } from "../captions";
import { ramp, rise } from "../components/anim";
import { AppScene, Points } from "../components/AppScene";
import { C } from "../theme";
import { outputSec, scene, sec, type SceneId } from "../timeline";
import { type PipelineProps } from "./Pipeline";

// 画面録画の場面の右側。文はナレーション（demo-script.md）の言い換えで、推薦・効能の評価・可否の言葉は使わない（banwords.ts）。

/** 録画の秒 t（cues.json の秒）が場面の何秒目に映るか */
const out = (id: SceneId, t: number) => outputSec(scene(id), t) ?? 0;

// S2 は JanDemoReal（実写 → 画面収録）。ここは「ほかにも」の4場面（L-20261104-24）。琥珀色・段階表示の件数の話はしない。

export const S3: React.FC = () => (
  <AppScene id="S3">
    <Points
      items={[
        { at: "s3-1", text: "「何が違うの？」にも" },
        { at: out("S3", 29.6), text: "量の基準をそろえて、違う所だけを並べる", note: "1日最大量・内容量・成分の分量" },
        { at: out("S3", 37.5), text: "並べ替え・順位はなし", note: "選ぶのは、人" },
      ]}
    />
  </AppScene>
);

export const S4: React.FC<{ pipeline?: PipelineProps }> = () => (
  <AppScene id="S4">
    <Points
      items={[
        { at: "s4-1", text: "質問は、チャットでも", note: "「授乳中について書いてある？」" },
        { at: out("S4", 10.5), text: "通知の該当箇所を、出典つきで返す", note: "出典：厚労省の通知など、国の機関の情報" },
        { at: out("S4", 12), text: "飲めるかどうかは、答えない" },
      ]}
    />
  </AppScene>
);

export const S5: React.FC = () => (
  <AppScene id="S5">
    <Points
      items={[
        { at: "s5-1", text: "症状の言葉からも、探せる" },
        { at: out("S5", 10.8), text: "運転注意の成分を含まないものに絞る", note: "順位なし・品名順。入力した言葉は保存しない" },
        { at: out("S5", 29.2), text: "棚の場所も、その場で", note: "売場図 → 棚の正面図" },
      ]}
    />
  </AppScene>
);

export const S6: React.FC = () => (
  <AppScene id="S6">
    <Points
      items={[
        { at: "s6-1", text: "ベテランのコツを、メモで残す", note: "成分に付けると、その成分を含む商品すべてに出る" },
        { at: out("S6", 26.5), text: "推薦の言葉・お客様の情報は、保存の前に止める" },
        { at: out("S6", 44.4), text: "新人も、ベテランと同じ所から始められる" },
      ]}
    />
  </AppScene>
);
