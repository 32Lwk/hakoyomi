import React from "react";
import { AppScene, Points } from "../components/AppScene";
import { C } from "../theme";
import { outputSec, scene, type SceneId } from "../timeline";
import { type PipelineProps } from "./Pipeline";

// 画面録画の場面の右側。文はナレーション（demo-script.md）の言い換えで、推薦・効能の評価・可否の言葉は使わない（banwords.ts）。

/** 録画の秒 t（cues.json の秒）が場面の何秒目に映るか */
const out = (id: SceneId, t: number) => outputSec(scene(id), t) ?? 0;

export const S2b: React.FC = () => (
  <AppScene id="S2b">
    <Points
      items={[
        { at: "s2b-1", text: "2026年5月施行「指定濫用防止医薬品」に現場対応", note: "大容量・複数個購入時の確認義務フローをシステム化" },
        { at: out("S2b", 4.8), text: "系列店舗での確認記録タイムラインを照合", note: "個人情報非保持（PIIゼロ）で他店購入事実を安全に共有" },
        { at: out("S2b", 11.8), text: "Claudeが販売記録の下書きを自動作成", note: "ワンタップでコピーし、法令遵守と記録業務を効率化" },
      ]}
    />
  </AppScene>
);

export const S3: React.FC = () => (
  <AppScene id="S3">
    <Points
      items={[
        { at: "s3-1", text: "医薬品ごとの細かな違いも、比較表で瞬時に理解", note: "1日最大量・成分の基準をそろえて並列比較" },
        { at: out("S3", 30.3), text: "Claudeが「どう説明し分けるか」の着眼点を生成", note: "運転の有無・服用回数など接客の分岐点を自動整理" },
        { at: out("S3", 38.2), text: "「どんなお客様にどちらが向いているか」が一目で分かる", note: "お客様一人ひとりに合わせた対話を支援" },
      ]}
    />
  </AppScene>
);

export const S4: React.FC<{ pipeline?: PipelineProps }> = () => (
  <AppScene id="S4">
    <Points
      items={[
        { at: "s4-1", text: "バッジにない細かい疑問・複雑な質問もチャットで", note: "「授乳中について書いてある？」など自由な言葉で検索" },
        { at: out("S4", 10.5), text: "Claudeの質問エージェントが公的資料から該当箇所を抽出", note: "原文との出典検証・禁止語ガードを経て根拠のみを提示" },
        { at: out("S4", 12), text: "対話に必要な正確な材料を、すぐ手元へ届ける" },
      ]}
    />
  </AppScene>
);

export const S5: React.FC = () => (
  <AppScene id="S5">
    <Points
      items={[
        { at: "s5-1", text: "症状や条件から、店舗の在庫をすぐに絞り込み", note: "1行ピルで承認基準を表示し、ワンタップ条件で即座に絞り込み" },
        { at: out("S5", 8.8), text: "文字多すぎず、スクロール不要で目的の薬がすぐ見つかる" },
        { at: out("S5", 14.1), text: "商品行から棚へ直行、店内マップと棚正面図でご案内", note: "売場図 → 棚の正面図（琥珀色ハイライト）まで瞬時にナビ" },
      ]}
    />
  </AppScene>
);

export const S6: React.FC = () => (
  <AppScene id="S6">
    <Points
      items={[
        { at: "s6-1", text: "現場で培った接客のコツを、成分ごとにメモで残す" },
        { at: out("S6", 16.4), text: "1つのメモが同一成分を含む全商品へ自動共有", note: "一度残せば、別の商品を読み取った時にも最上部に自動反映" },
        { at: out("S6", 41.3), text: "ベテランの経験が、次の人へと自然に受け継がれる", note: "現場にいるうちに、店舗の集合知として定着" },
      ]}
    />
    {/* 1つの成分メモ → 全商品へ自動反映の図解カード */}
    <div
      style={{
        marginTop: 32,
        padding: "20px 24px",
        borderRadius: 16,
        background: "rgba(30, 58, 95, 0.05)",
        border: "2px solid rgba(30, 58, 95, 0.15)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 700, color: C.navy }}>
        <span>💡 1つの成分メモ ➔ 全対象商品へ自動反映</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 15, color: C.text }}>
        <div style={{ padding: "8px 12px", background: C.white, borderRadius: 8, border: "1px solid #ddd", fontWeight: 700 }}>
          パブロンでメモ入力<br />
          <span style={{ fontSize: 12, color: "#666" }}>成分：ジヒドロコデイン</span>
        </div>
        <div style={{ fontSize: 22, color: C.navy, fontWeight: 900 }}>➔</div>
        <div style={{ padding: "8px 12px", background: C.white, borderRadius: 8, border: "1px solid #ddd", fontWeight: 700 }}>
          新ルル・他4商品の最上部に<br />
          <span style={{ fontSize: 12, color: C.navy }}>「先輩のコツ」として自動浮上！</span>
        </div>
      </div>
    </div>
  </AppScene>
);
