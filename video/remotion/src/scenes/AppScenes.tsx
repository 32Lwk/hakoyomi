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
      solution="系列店タイムライン照合 ＆ 10秒で販売記録を作成"
    />
    <FeatureList
      items={[
        {
          badge: "2026年5月施行",
          title: "確認義務フローに現場対応",
          desc: "大容量・複数個購入の確認手順をステップに沿ってスムーズに案内",
          at: "s2b-1",
        },
        {
          badge: "個人情報非保持",
          title: "系列店の記録を瞬時に照合",
          desc: "PIIゼロで他店舗での直近購入歴をリアルタイムに確認・重複販売を防止",
          at: out("S2b", 4.8),
        },
        {
          badge: "10秒で完了",
          title: "販売記録の下書きを自動作成",
          desc: "Claudeが確認内容を自動でまとめ、ワンタップで店間共有が完了",
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
      solution="成分・用量を横並び比較 ＆ 説明の分岐点を整理"
    />
    <FeatureList
      items={[
        {
          badge: "横並び比較表",
          title: "成分と用量の差を一目で把握",
          desc: "1日最大量や有効成分の違いを横並びで瞬時に整理・比較",
          at: "s3-1",
        },
        {
          badge: "ベテランの知見",
          title: "説明の分岐点を自動整理",
          desc: "『どう説明し分けるか』の着眼点をClaudeが要約し、迷いを解消",
          at: out("S3", 30.3),
        },
        {
          badge: "提案力向上",
          title: "迷わず最適な提案が可能に",
          desc: "新人でも自信を持って、お客様一人ひとりの状況に合わせた提案へ",
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
      solution="公的文書からBM25・RAGで正確な根拠だけを抽出"
    />
    <FeatureList
      items={[
        {
          badge: "自然な言葉で",
          title: "チャットで自由に質問",
          desc: "『授乳中について書いてある？』など店頭で受ける相談をそのまま検索",
          at: "s4-1",
        },
        {
          badge: "AI任せにしない",
          title: "公的文書から正確な根拠を抽出",
          desc: "BM25とRAGでPMDA添付文書の該当箇所だけを客観的・ピンポイントに特定",
          at: out("S4", 10.5),
        },
        {
          badge: "接客を止めない",
          title: "判断材料を数秒でお届け",
          desc: "分厚い資料をめくる時間をゼロにし、お客様との対話を止めずに即答",
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
      solution="ワンタップ絞込 ➔ スクロール不要で棚正面図へ直行"
    />
    <FeatureList
      items={[
        {
          badge: "ワンタップ絞込",
          title: "条件から一瞬で在庫を絞込",
          desc: "『眠気注意なし』などよく聞かれる条件チップをタップするだけ",
          at: "s5-1",
        },
        {
          badge: "スクロール不要",
          title: "候補薬を一覧で即座に表示",
          desc: "大きな商品カードでスクロール不要、目的の薬を迷わずすぐ発見",
          at: out("S5", 8.8),
        },
        {
          badge: "棚 6B-5 直通",
          title: "棚正面図でお客様をご案内",
          desc: "売場図と棚の琥珀色ハイライトでお客様をスムーズに棚まで直行案内",
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
      solution="1つの成分メモ ➔ 全対象商品の最上部へ自動反映"
    />

    {/* スライドとして一目瞭然な特大インフォグラフィック（主役） */}
    <div
      style={{
        marginTop: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1.35fr",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {/* 左：1商品のメモ入力 */}
        <div
          style={{
            background: C.white,
            border: `2px solid ${C.navy}`,
            borderRadius: 16,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            boxShadow: "0 8px 24px rgba(30, 58, 95, 0.08)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 18,
              fontWeight: 700,
              color: C.navy,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 4, background: C.navy }} />
            ベテランが1回入力
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>
            パブロンでメモ保存
          </div>
          <div
            style={{
              padding: "10px 14px",
              background: C.base,
              borderRadius: 10,
              fontSize: 18,
              color: C.sub,
              lineHeight: 1.4,
            }}
          >
            「眠気・運転の予定を先に確認」<br />
            <span style={{ fontSize: 15, color: C.muted }}>成分：ジヒドロコデインリン酸塩</span>
          </div>
        </div>

        {/* 中央：自動波及の矢印 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <div style={{ fontSize: 36, color: C.navy, fontWeight: 900 }}>➔</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.navy,
              background: C.navySoft,
              padding: "4px 8px",
              borderRadius: 6,
              whiteSpace: "nowrap",
            }}
          >
            同一成分を検知
          </div>
        </div>

        {/* 右：全商品へ自動共有 */}
        <div
          style={{
            background: C.navySoft,
            border: `2px solid ${C.navy}`,
            borderRadius: 16,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            boxShadow: "0 8px 24px rgba(30, 58, 95, 0.08)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 18,
              fontWeight: 700,
              color: C.navy,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 4, background: C.navy }} />
            全対象商品の最上部へ自動浮上！
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.navy, lineHeight: 1.3 }}>
            新ルル・他4商品の全画面へ即時共有
          </div>
          <div
            style={{
              padding: "10px 14px",
              background: C.white,
              borderRadius: 10,
              fontSize: 18,
              fontWeight: 700,
              color: C.text,
              lineHeight: 1.4,
              border: "1px solid rgba(30, 58, 95, 0.15)",
            }}
          >
            「先輩から受け継がれた接客のコツ」<br />
            <span style={{ fontSize: 15, color: C.sub, fontWeight: 500 }}>
              同じ成分を含む薬を開いた瞬間、最優先で手元に表示
            </span>
          </div>
        </div>
      </div>

      {/* 下部：成果まとめバー */}
      <div
        style={{
          padding: "16px 24px",
          borderRadius: 14,
          background: C.navy,
          color: C.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 26, fontWeight: 700 }}>
          属人化を解消。1人が書いた知恵が、店舗全体の資産へ自然継承。
        </span>
        <span
          style={{
            background: "rgba(255,255,255,0.2)",
            padding: "4px 14px",
            borderRadius: 999,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          新人も安心
        </span>
      </div>
    </div>
  </AppScene>
);
