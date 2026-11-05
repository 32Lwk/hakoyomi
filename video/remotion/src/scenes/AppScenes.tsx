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
        { at: "s3-1", text: "医薬品ごとの細かな違いも、比較表で瞬時に理解", note: "1日最大量・成分の基準をそろえて並列比較" },
        { at: out("S3", 29.6), text: "「どう説明し分けるか」の着眼点を提示", note: "運転の有無・服用回数など接客のポイントを整理" },
        { at: out("S3", 37.5), text: "「どんなお客様にどちらが向いているか」が一目で分かる", note: "お客様一人ひとりに合わせた対話を支援" },
      ]}
    />
  </AppScene>
);

export const S4: React.FC<{ pipeline?: PipelineProps }> = () => (
  <AppScene id="S4">
    <Points
      items={[
        { at: "s4-1", text: "バッジにない細かい疑問・複雑な質問もチャットで", note: "「授乳中について書いてある？」など自由な言葉で検索" },
        { at: out("S4", 10.5), text: "ClaudeとRAGで膨大な資料から該当箇所を抽出", note: "根拠となる記載を出典つきで瞬時に提示" },
        { at: out("S4", 12), text: "対話に必要な正確な材料を、すぐ手元へ届ける" },
      ]}
    />
  </AppScene>
);

export const S5: React.FC = () => (
  <AppScene id="S5">
    <Points
      items={[
        { at: "s5-1", text: "症状や条件から、店舗の在庫をすぐに絞り込み", note: "「鼻水」「運転注意の成分を含まない」などで検索" },
        { at: out("S5", 10.8), text: "接客時に聞かれても、該当する薬がすぐ見つかる" },
        { at: out("S5", 29.2), text: "薬のある棚の場所が同時に表示され、すぐにご案内", note: "売場図 → 棚の正面図まで一目で分かる" },
      ]}
    />
  </AppScene>
);

export const S6: React.FC = () => (
  <AppScene id="S6">
    <Points
      items={[
        { at: "s6-1", text: "現場で培った接客のコツを、成分ごとにメモで残す" },
        { at: out("S6", 26.5), text: "同じ成分を含むすべての商品に自動で共有", note: "一度残せば、別の商品を読み取った時にも表示" },
        { at: out("S6", 44.4), text: "ベテランの経験が、次の人へと自然に受け継がれる", note: "現場にいるうちに、ノウハウを店舗の資産に" },
      ]}
    />
  </AppScene>
);
