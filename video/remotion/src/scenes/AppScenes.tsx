import React from "react";
import { AppScene, FeatureList, ProblemSolutionBanner } from "../components/AppScene";
import { C } from "../theme";
import { outputSec, scene, type SceneId } from "../timeline";
import { type PipelineProps } from "./Pipeline";

// 画面録画の場面の右側。左側のスマホ実機モックが主役になるよう、文字量を絞り要点キーワードでビシッと整列。

/** 録画の秒 t（cues.json の秒）が場面の何秒目に映るか */
const out = (id: SceneId, t: number) => outputSec(scene(id), t) ?? 0;

export const S2b: React.FC = () => (
  <AppScene id="S2b">
    <ProblemSolutionBanner
      problem="多岐にわたる確認 ＆ 紙・手入力の記録"
      solution="系列店照合 ＆ 10秒で販売記録を作成"
      at="s2b-0"
    />
    <FeatureList
      items={[
        {
          badge: "2026年5月施行",
          title: "法改正・確認義務の厳格化に対応",
          desc: "若年者・他店購入・理由確認など多岐にわたる確認フローを案内",
          at: "s2b-0",
        },
        {
          badge: "系列店照合",
          title: "重複・多量購入をリアルタイム検知",
          desc: "個人情報非保持（PIIゼロ）で他店舗の購入履歴を安全に照合",
          at: "s2b-1",
        },
        {
          badge: "10秒で完了",
          title: "販売記録の下書きをClaudeが自動作成",
          desc: "確認内容を自動要約し、ワンタップで店間共有と記録保存が完了",
          at: "s2b-2",
        },
      ]}
    />
  </AppScene>
);

export const S3: React.FC = () => (
  <AppScene id="S3">
    <ProblemSolutionBanner
      problem="似た薬の違い・覚えるのに何年もかかる"
      solution="横並び比較 ＆ ベテランの着眼点を要約"
    />
    <FeatureList
      items={[
        {
          badge: "横並び比較",
          title: "成分・用量の違いを一目で把握",
          desc: "添付文書を行き来する手間をゼロにし、差分を瞬時に整理",
          at: "s3-1",
        },
        {
          badge: "着眼点要約",
          title: "説明の分岐点をClaudeが自動整理",
          desc: "ベテランが重視する『どう説明し分けるか』の着眼点を提示",
          at: out("S3", 30.3),
        },
        {
          badge: "提案力向上",
          title: "新人でも自信を持って店頭で提案",
          desc: "お客様一人ひとりの状況に合わせた最適な提案へ",
          at: out("S3", 38.2),
        },
      ]}
    />
  </AppScene>
);

export const S4: React.FC<{ pipeline?: PipelineProps }> = () => (
  <AppScene id="S4">
    <ProblemSolutionBanner
      problem="複雑な質問のたびに分厚い資料をめくる"
      solution="公的文書からBM25・RAGで正確抽出"
    />
    <FeatureList
      items={[
        {
          badge: "チャット検索",
          title: "店頭の疑問をいつもの言葉で質問",
          desc: "『授乳中について書いてある？』など店頭で受ける相談をそのまま検索",
          at: "s4-1",
        },
        {
          badge: "AI任せにしない",
          title: "PMDA添付文書から客観的根拠を特定",
          desc: "BM25とRAGで該当箇所だけをピンポイントに抽出",
          at: out("S4", 10.5),
        },
        {
          badge: "即答サポート",
          title: "接客を止めずに数秒で手元にお届け",
          desc: "分厚い資料を探す時間をゼロにし、お客様との対話に集中",
          at: out("S4", 12),
        },
      ]}
    />
  </AppScene>
);

export const S5: React.FC = () => (
  <AppScene id="S5">
    <ProblemSolutionBanner
      problem="相談されても薬や棚の場所で迷う"
      solution="ワンタップ絞込 ➔ 棚正面図へ直行案内"
    />
    <FeatureList
      items={[
        {
          badge: "ワンタップ絞込",
          title: "よくある相談条件から一瞬で絞込",
          desc: "『眠気注意なし』などよく聞かれる条件チップをタップするだけ",
          at: "s5-1",
        },
        {
          badge: "スクロール不要",
          title: "候補薬を大きなカードで一覧表示",
          desc: "大きな商品カードでスクロール不要、目的の薬を迷わずすぐ発見",
          at: out("S5", 8.8),
        },
        {
          badge: "棚 6B-5 直通",
          title: "棚正面図でお客様をスムーズ案内",
          desc: "売場図と琥珀色ハイライトでお客様をスムーズに棚まで直行案内",
          at: out("S5", 14.1),
        },
      ]}
    />
  </AppScene>
);

export const S6: React.FC = () => (
  <AppScene id="S6">
    <ProblemSolutionBanner
      problem="ベテランの接客知恵が頭の中に埋もれる"
      solution="1商品メモ ➔ 全対象商品へ自動共有"
    />

    {/* スライドとして一目瞭然な特大インフォグラフィック（大文字 26px〜32px で統一） */}
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
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            boxShadow: "0 8px 24px rgba(30, 58, 95, 0.08)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 22,
              fontWeight: 700,
              color: C.navy,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 5, background: C.navy }} />
            ベテランが1回入力
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.text, lineHeight: 1.25 }}>
            パブロンでメモ保存
          </div>
          <div
            style={{
              padding: "12px 16px",
              background: C.base,
              borderRadius: 12,
              fontSize: 26,
              color: C.sub,
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            「眠気・運転の予定を先に確認」<br />
            <span style={{ fontSize: 22, color: C.muted }}>成分：ジヒドロコデインリン酸塩</span>
          </div>
        </div>

        {/* 中央：自動波及の矢印 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 44, color: C.navy, fontWeight: 900 }}>➔</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: C.navy,
              background: C.navySoft,
              padding: "6px 12px",
              borderRadius: 8,
              whiteSpace: "nowrap",
            }}
          >
            同一成分を検知
          </div>
        </div>

        {/* 右：全商品へ自動共有（青いところの文字サイズを28pxに拡大改善） */}
        <div
          style={{
            background: C.navySoft,
            border: `2.5px solid ${C.navy}`,
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            boxShadow: "0 8px 24px rgba(30, 58, 95, 0.12)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 22,
              fontWeight: 700,
              color: C.navy,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 5, background: C.navy }} />
            全対象商品の最上部へ自動浮上！
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.navy, lineHeight: 1.25 }}>
            新ルルなど全画面へ即時共有
          </div>
          <div
            style={{
              padding: "12px 16px",
              background: C.white,
              borderRadius: 12,
              fontSize: 28,
              fontWeight: 700,
              color: C.text,
              lineHeight: 1.4,
              border: "1.5px solid rgba(30, 58, 95, 0.2)",
            }}
          >
            「先輩から受け継がれた接客のコツ」<br />
            <span style={{ fontSize: 24, color: C.sub, fontWeight: 500 }}>
              同じ成分を含む薬を開いた瞬間、最優先で表示
            </span>
          </div>
        </div>
      </div>

      {/* 下部：成果まとめバー */}
      <div
        style={{
          padding: "18px 28px",
          borderRadius: 14,
          background: C.navy,
          color: C.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 28, fontWeight: 700 }}>
          属人化を解消。1人が書いた知恵が、店舗全体の資産へ自然継承。
        </span>
        <span
          style={{
            background: "rgba(255,255,255,0.22)",
            padding: "6px 18px",
            borderRadius: 999,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          新人も安心
        </span>
      </div>
    </div>
  </AppScene>
);
