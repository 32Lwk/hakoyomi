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
        { at: "s3-1", text: "複数のお薬の比較も、バーコードで", note: "アレグラ・アレジオン・ストナリニを並列比較" },
        { at: out("S3", 29.6), text: "Claudeが「ベテランの着眼点」を提示", note: "運転の有無・服用回数など接客の分岐点を整理" },
        { at: out("S3", 37.5), text: "対話のヒアリングポイントが瞬時に分かる", note: "成分差分と合わせ、お客様に合わせた確認を支援" },
      ]}
    />
  </AppScene>
);

export const S4: React.FC<{ pipeline?: PipelineProps }> = () => (
  <AppScene id="S4">
    <Points
      items={[
        { at: "s4-1", text: "接客中の疑問は、チャットで公的検索", note: "「授乳中について書いてある？」" },
        { at: out("S4", 10.5), text: "厚労省通知の該当箇所を、出典つきで即座に提示", note: "国の一次情報から直接エビデンスを抽出" },
        { at: out("S4", 12), text: "正確な根拠をもとに、確信を持って対話できる" },
      ]}
    />
  </AppScene>
);

export const S5: React.FC = () => (
  <AppScene id="S5">
    <Points
      items={[
        { at: "s5-1", text: "「眠くならない薬は？」にも即座に対応", note: "症状の言葉から探す" },
        { at: out("S5", 10.8), text: "運転注意の成分を含まないものへ素早く絞り込み", note: "成分テーブルと公的通知から客観抽出" },
        { at: out("S5", 29.2), text: "棚の場所まで、その場でお客様をご案内", note: "売場図 → 棚の正面図" },
      ]}
    />
  </AppScene>
);

export const S6: React.FC = () => (
  <AppScene id="S6">
    <Points
      items={[
        { at: "s6-1", text: "ベテランの接客のコツを、成分メモに残す", note: "同じ成分を含むすべての商品へ自動共有" },
        { at: out("S6", 26.5), text: "Claudeが厚労省の公的通知と自動照合", note: "先輩の経験則に客観的な裏付けを付与" },
        { at: out("S6", 44.4), text: "新人もベテランと同じ知恵を持って接客へ", note: "店舗のノウハウをテクノロジーで継承" },
      ]}
    />
  </AppScene>
);
