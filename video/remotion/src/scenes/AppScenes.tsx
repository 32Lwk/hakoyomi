import React from "react";
import { AppScene, FeatureList, ProblemSolutionBanner } from "../components/AppScene";
import { C } from "../theme";
import { outputSec, scene, type SceneId } from "../timeline";
import { type PipelineProps } from "./Pipeline";

// 画面録画の場面の右側。文はナレーション（demo-script.md）の言い換えで、推薦・効能の評価・可否の言葉は使わない（banwords.ts）。

/** 録画の秒 t（cues.json の秒）が場面の何秒目に映るか */
const out = (id: SceneId, t: number) => outputSec(scene(id), t) ?? 0;

export const S2b: React.FC = () => (
  <AppScene id="S2b">
    <ProblemSolutionBanner
      problem="他店での購入歴が分からず、重複・多量販売を防ぎきれない"
      solution="系列店タイムライン照合 ＆ 10秒で販売記録下書き作成"
    />
    <FeatureList
      items={[
        {
          badge: "2026年5月施行",
          title: "指定濫用防止医薬品の義務フローに完全対応",
          desc: "大容量・複数個購入時の確認義務項目をシステム化し漏れをゼロに",
          at: "s2b-1",
        },
        {
          badge: "個人情報非保持",
          title: "系列店舗の確認記録タイムラインを即座に照合",
          desc: "PIIを一切保持せず、他店での購入事実のみを安全に共有",
          at: out("S2b", 4.8),
        },
        {
          badge: "業務時間を短縮",
          title: "Claudeが販売記録の下書きを自動作成",
          desc: "ワンタップでコピーし、法令遵守と記録記入をスムーズに完結",
          at: out("S2b", 11.8),
        },
      ]}
    />
  </AppScene>
);

export const S3: React.FC = () => (
  <AppScene id="S3">
    <ProblemSolutionBanner
      problem="似た薬の違いを覚えるのに何年もかかり、添付文書を行き来する"
      solution="成分・用量を横並び比較 ＆ 接客の着眼点をClaudeが自動整理"
    />
    <FeatureList
      items={[
        {
          badge: "一目でわかる",
          title: "医薬品ごとの細かな違いを並列テーブルで比較",
          desc: "1日最大量や有効成分の基準をそろえて、差分を瞬時に把握",
          at: "s3-1",
        },
        {
          badge: "Claude支援",
          title: "「どう説明し分けるか」の着眼点を自動整理",
          desc: "眠気の有無・服用回数・生活習慣など、接客の分岐点を提示",
          at: out("S3", 30.3),
        },
        {
          badge: "提案力向上",
          title: "お客様一人ひとりに合わせた最適な対話を支援",
          desc: "新人でも迷わず自信を持って、納得感のある説明が可能に",
          at: out("S3", 38.2),
        },
      ]}
    />
  </AppScene>
);

export const S4: React.FC<{ pipeline?: PipelineProps }> = () => (
  <AppScene id="S4">
    <ProblemSolutionBanner
      problem="複雑な質問のたびに分厚い添付文書をめくり、お客様を待たせる"
      solution="自然な日本語チャットで、公的資料から該当箇所をピンポイント抽出"
    />
    <FeatureList
      items={[
        {
          badge: "いつもの言葉で",
          title: "バッジにない細かい疑問も自然言語で検索",
          desc: "「授乳中について書いてある？」など、店頭での疑問をそのまま入力",
          at: "s4-1",
        },
        {
          badge: "公的根拠と直結",
          title: "Claude質問エージェントが添付文書から即座に抽出",
          desc: "原文との照合・禁止語ガードを経て、客観的事実のみを提示",
          at: out("S4", 10.5),
        },
        {
          badge: "接客を止めない",
          title: "対話に必要な判断材料を、数秒で手元へお届け",
          desc: "探す時間をゼロにして、お客様との対話そのものに集中",
          at: out("S4", 12),
        },
      ]}
    />
  </AppScene>
);

export const S5: React.FC = () => (
  <AppScene id="S5">
    <ProblemSolutionBanner
      problem="あいまいに相談されると薬がすぐ決まらず、広い店内で棚も迷う"
      solution="ワンタップ絞り込み（スクロール不要）➔ 店内マップ・棚正面図へ直行"
    />
    <FeatureList
      items={[
        {
          badge: "ワンタップ",
          title: "症状や条件チップから在庫を一瞬で絞り込み",
          desc: "1行ピルで承認基準を表示し、スクロール不要で該当商品一覧が即表示",
          at: "s5-1",
        },
        {
          badge: "スクロール不要",
          title: "文字過多を解消し、必要な情報だけをスマートに整理",
          desc: "重要な成分・特徴バッジが一目でわかり、迷う時間を徹底排除",
          at: out("S5", 8.8),
        },
        {
          badge: "棚へ直行",
          title: "商品行から棚案内へ直結、売場図と棚正面図でナビ",
          desc: "棚番号「6B-5」と該当フック（琥珀色）をハイライトし、スムーズにご案内",
          at: out("S5", 14.1),
        },
      ]}
    />
  </AppScene>
);

export const S6: React.FC = () => (
  <AppScene id="S6">
    <ProblemSolutionBanner
      problem="ベテランの接客ノウハウが個人の頭の中に埋もれ、属人化する"
      solution="1つの成分メモ ➔ 同一成分を含む全商品の最上部へ自動反映"
    />
    <FeatureList
      items={[
        {
          badge: "1入力で完了",
          title: "現場で培った接客のコツを成分ごとにメモ登録",
          desc: "「ジヒドロコデイン」に関する注意点を1回メモするだけ",
          at: "s6-1",
        },
        {
          badge: "全商品へ自動波及",
          title: "同一成分を含むすべての薬の最上部に自動共有",
          desc: "新ルルを開いた瞬間、「先輩から受け継がれた接客のコツ」として自動浮上",
          at: out("S6", 16.4),
        },
        {
          badge: "店舗の資産に",
          title: "ベテランが現場にいるうちに、経験を自然に継承",
          desc: "誰が接客しても店舗全体の集合知が活かされ、接客品質を底上げ",
          at: out("S6", 41.3),
        },
      ]}
    />
    {/* 1つの成分メモ → 全商品へ自動反映の図解カード */}
    <div
      style={{
        marginTop: 20,
        padding: "16px 20px",
        borderRadius: 14,
        background: "rgba(30, 58, 95, 0.05)",
        border: "1.5px solid rgba(30, 58, 95, 0.15)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 700, color: C.navy }}>
        <span>💡 1つの成分メモ ➔ 全対象商品へ自動反映</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: C.text }}>
        <div style={{ padding: "6px 10px", background: C.white, borderRadius: 8, border: "1px solid #ddd", fontWeight: 700 }}>
          パブロンでメモ入力<br />
          <span style={{ fontSize: 11, color: "#666" }}>成分：ジヒドロコデイン</span>
        </div>
        <div style={{ fontSize: 20, color: C.navy, fontWeight: 900 }}>➔</div>
        <div style={{ padding: "6px 10px", background: C.white, borderRadius: 8, border: "1px solid #ddd", fontWeight: 700 }}>
          新ルル・他4商品の最上部に<br />
          <span style={{ fontSize: 11, color: C.navy }}>「先輩のコツ」として自動浮上！</span>
        </div>
      </div>
    </div>
  </AppScene>
);
