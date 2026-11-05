import React from "react";
import { useCurrentFrame } from "remotion";
import { AppScene, FeatureList, ProblemSolutionBanner } from "../components/AppScene";
import { C, FPS } from "../theme";
import { lineTiming } from "../captions";
import { outputSec, scene, sec, type SceneId } from "../timeline";
import { type PipelineProps } from "./Pipeline";

// 画面録画の場面の右側。左側のスマホ実機モックが主役になるよう、文字量を絞り要点キーワードでビシッと整列。

/** 録画の秒 t（cues.json の秒）が場面の何秒目に映るか */
const out = (id: SceneId, t: number) => outputSec(scene(id), t) ?? 0;

/** S2b-0：厚労省の厳格化通知・紙の確認記録簿・増え続ける対象医薬品が乱雑に散乱するリアル現場ペイン演出 */
const AbuseRegulationChaosBoard: React.FC = () => {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 640,
        borderRadius: 16,
        background: "radial-gradient(ellipse at center, #F8FAFC 0%, #E2E8F0 100%)",
        border: `2px dashed ${C.line}`,
        padding: 24,
        overflow: "hidden",
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* 背景デスク感の透かしラベル */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 20,
          fontSize: 16,
          fontWeight: 700,
          color: C.muted,
          letterSpacing: 2,
        }}
      >
        現場のデスク：増大する紙・確認書類の山
      </div>

      {/* 1. 厚生労働省 通知公文書カード（左上、-2.5度回転） */}
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 20,
          width: 580,
          background: C.white,
          border: `2px solid ${C.line}`,
          borderRadius: 8,
          padding: "18px 24px",
          transform: "rotate(-2.5deg)",
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1.5px solid ${C.line}`, paddingBottom: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.sub }}>厚生労働省 医薬局総務課 通知（医薬安発 第0214号）</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 4 }}>
              指定濫用防止医薬品の販売時における確認・記録義務の厳格化
            </div>
          </div>
          {/* 厚労省 角印風スタンプ */}
          <div
            style={{
              border: "2px solid #DC2626",
              color: "#DC2626",
              borderRadius: 4,
              padding: "4px 8px",
              fontSize: 14,
              fontWeight: 900,
              transform: "rotate(4deg)",
              letterSpacing: 1,
            }}
          >
            厚生労働省印
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6, fontSize: 18, color: C.text, lineHeight: 1.4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#DC2626" }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: "#DC2626" }} />
            2026年5月施行：薬機法施行規則の改正
          </div>
          <div style={{ fontSize: 16, color: C.sub, paddingLeft: 16 }}>
            ・氏名および年齢確認（公的身分証明書の提示）<br />
            ・他店での購入状況および購入理由の聴取<br />
            ・<strong style={{ color: C.text }}>販売記録（品名・数量・確認結果）の作成および保存義務</strong>
          </div>
        </div>
      </div>

      {/* 2. 現場の手書き「適正販売確認記録簿」（右上〜中央、+2.5度回転） */}
      <div
        style={{
          position: "absolute",
          top: 36,
          right: 20,
          width: 530,
          background: "#FEFCE8", // 紙のような薄黄
          border: "2px solid #EAB308",
          borderRadius: 8,
          padding: "16px 20px",
          transform: "rotate(2.5deg)",
          boxShadow: "0 14px 32px rgba(15, 23, 42, 0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #CA8A04", paddingBottom: 8 }}>
          <div style={{ fontSize: 19, fontWeight: 900, color: "#854D0E" }}>
            適正販売確認記録簿（紙・手書き様式例）
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "2px 8px", borderRadius: 4 }}>
            手書き・手入力必須
          </div>
        </div>

        {/* 記録簿の記入テーブル */}
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8, fontSize: 16, color: "#713F12" }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, borderBottom: "1px dashed #EAB308", paddingBottom: 4 }}>
            <span style={{ fontWeight: 700 }}>購入者氏名:</span>
            <span style={{ color: "#1E293B", fontWeight: 500 }}>山田 太郎 殿（28歳）</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, borderBottom: "1px dashed #EAB308", paddingBottom: 4 }}>
            <span style={{ fontWeight: 700 }}>身元確認:</span>
            <span style={{ color: "#1E293B", fontWeight: 500 }}>☑ 運転免許証・保険証確認済</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, borderBottom: "1px dashed #EAB308", paddingBottom: 4 }}>
            <span style={{ fontWeight: 700 }}>他店購入歴:</span>
            <span style={{ color: "#DC2626", fontWeight: 700 }}>他店舗での直近購入状況の確認要</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8 }}>
            <span style={{ fontWeight: 700 }}>販売者印:</span>
            <span style={{ color: "#1E293B", fontWeight: 500 }}>川島（登録販売者）㊞</span>
          </div>
        </div>

        <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: "#B45309", textAlign: "right" }}>
          ※1件あたり数分の手書き記入・ファイリング負担
        </div>
      </div>

      {/* 3. 増え続ける対象医薬品の警告リスト（中央下、-1度回転） */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 40,
          right: 40,
          background: C.white,
          border: `2.5px solid ${C.navy}`,
          borderRadius: 12,
          padding: "16px 22px",
          transform: "rotate(-1deg)",
          boxShadow: "0 16px 36px rgba(30, 58, 95, 0.22)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "#DC2626", color: C.white, fontSize: 16, fontWeight: 900, padding: "4px 10px", borderRadius: 6 }}>
              対象成分拡大
            </span>
            <span style={{ fontSize: 24, fontWeight: 900, color: C.navy }}>
              指定濫用防止医薬品（総合感冒薬・鎮咳薬の多数が該当）
            </span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.sub }}>
            パブロン・新ルル・ブロン・プレコール等
          </span>
        </div>

        {/* 成分バッジの群れ */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {["ジヒドロコデイン", "コデイン", "ブロモバレリル尿素", "エフェドリン", "プソイドエフェドリン", "メチルエフェドリン", "デキストロメトルファン"].map((c, i) => (
            <span
              key={i}
              style={{
                background: C.navySoft,
                border: "1.5px solid #CBD5E1",
                color: C.navy,
                fontSize: 18,
                fontWeight: 700,
                padding: "6px 14px",
                borderRadius: 8,
              }}
            >
              ⚠ {c}
            </span>
          ))}
        </div>
      </div>

      {/* 4. 現場の悲鳴スタンプ（右下手前、+5度回転） */}
      <div
        style={{
          position: "absolute",
          top: 240,
          right: 32,
          background: "#DC2626",
          color: C.white,
          borderRadius: 10,
          padding: "12px 20px",
          transform: "rotate(4deg)",
          boxShadow: "0 10px 24px rgba(220, 38, 38, 0.35)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>
          現場の悲鳴：確認・記録がパンク！
        </div>
        <div style={{ fontSize: 16, fontWeight: 500, opacity: 0.95 }}>
          紙の手書き帳簿では、他店舗の購入履歴も追えない
        </div>
      </div>
    </div>
  );
};

export const S2b: React.FC = () => {
  const frame = useCurrentFrame();
  // s2b-1 ナレーションの開始秒（約 8.8 秒 / 265 フレーム）
  const s2b1StartSec = lineTiming("s2b-1").inScene;
  const isChaosPhase = frame < sec(s2b1StartSec);

  return (
    <AppScene id="S2b">
      {isChaosPhase ? (
        <AbuseRegulationChaosBoard />
      ) : (
        <>
          <ProblemSolutionBanner
            problem="多岐にわたる確認 ＆ 紙の記録"
            solution="系列店照合 ＆ 10秒で記録完了"
            at="s2b-1"
          />
          <FeatureList
            items={[
              {
                badge: "系列店照合",
                title: "重複・多量購入をリアルタイム検知",
                desc: "PII非保持で他店舗の購入履歴を安全かつ瞬時に照合",
                at: "s2b-1",
              },
              {
                badge: "10秒で完了",
                title: "販売記録の下書きをClaudeが自動作成",
                desc: "確認項目をチェックするだけで要約と記録保存が完了",
                at: "s2b-2",
              },
            ]}
          />
        </>
      )}
    </AppScene>
  );
};

export const S3: React.FC = () => (
  <AppScene id="S3">
    <ProblemSolutionBanner
      problem="似た薬の差分暗記に何年もかかる"
      solution="横並び比較 ＆ 着眼点の自動要約"
    />
    <FeatureList
      items={[
        {
          badge: "横並び比較",
          title: "成分と用量の差を一目で把握",
          desc: "1日最大量や有効成分の違いを横並びで瞬時に整理",
          at: "s3-1",
        },
        {
          badge: "着眼点要約",
          title: "説明の分岐点をClaudeが自動整理",
          desc: "ベテランが重視する『どう説明し分けるか』のコツを提示",
          at: out("S3", 30.3),
        },
        {
          badge: "提案力向上",
          title: "新人でも自信を持って店頭で提案",
          desc: "お客様一人ひとりの状況に合わせた最適な提案へ直結",
          at: out("S3", 38.2),
        },
      ]}
    />
  </AppScene>
);

export const S4: React.FC<{ pipeline?: PipelineProps }> = () => (
  <AppScene id="S4">
    <ProblemSolutionBanner
      problem="分厚い添付文書を探しお客様を待たせる"
      solution="公的根拠をBM25・RAGで即座抽出"
    />
    <FeatureList
      items={[
        {
          badge: "チャット検索",
          title: "店頭の疑問を自然な言葉で質問",
          desc: "『授乳中について書いてある？』など店頭の相談を即座に検索",
          at: "s4-1",
        },
        {
          badge: "客観的根拠",
          title: "PMDA添付文書から該当箇所を特定",
          desc: "BM25とRAGで該当箇所だけを客観的・ピンポイントに特定",
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
      problem="薬選びと広い店内での棚迷い"
      solution="ワンタップ絞込 ＆ 棚図へ直行案内"
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
          badge: "一覧即座表示",
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
      problem="接客知恵の属人化・個人の頭に埋没"
      solution="全対象商品へ即時・自動共有"
    />

    {/* 上段の ProblemSolutionBanner と列方向・幅を完全に一致させたインフォグラフィック（gridTemplateColumns: 1fr 50px 1fr） */}
    <div
      style={{
        marginTop: 22,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 50px 1fr",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {/* 左：1商品のメモ入力 */}
        <div
          style={{
            background: C.white,
            border: `2.5px solid ${C.navy}`,
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
              fontSize: 20,
              fontWeight: 700,
              color: C.navy,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 4, background: C.navy }} />
            ベテランが1回入力
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: C.text, lineHeight: 1.2, whiteSpace: "nowrap" }}>
            パブロンでメモ保存
          </div>
          <div
            style={{
              padding: "14px 18px",
              background: C.base,
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>
              「眠気・運転予定を先に確認」
            </div>
            <div style={{ fontSize: 20, color: C.sub, fontWeight: 500, whiteSpace: "nowrap" }}>
              成分：ジヒドロコデインリン酸塩
            </div>
          </div>
        </div>

        {/* 中央：同一成分検知 矢印 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 40, color: C.navy, fontWeight: 900 }}>➔</div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: C.navy,
              background: C.navySoft,
              padding: "6px 8px",
              borderRadius: 6,
              whiteSpace: "nowrap",
            }}
          >
            同成分を検知
          </div>
        </div>

        {/* 右：全商品へ即時共有 */}
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
              fontSize: 20,
              fontWeight: 700,
              color: C.navy,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 4, background: C.navy }} />
            全対象商品へ自動浮上！
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: C.navy, lineHeight: 1.2, whiteSpace: "nowrap" }}>
            新ルル等の全画面へ即時共有
          </div>
          <div
            style={{
              padding: "14px 18px",
              background: C.white,
              borderRadius: 12,
              border: "1.5px solid rgba(30, 58, 95, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 700, color: C.navy, whiteSpace: "nowrap" }}>
              「先輩から受け継がれた接客のコツ」
            </div>
            <div style={{ fontSize: 20, color: C.sub, fontWeight: 500, whiteSpace: "nowrap" }}>
              同成分の薬を開いた瞬間、最優先で手元に表示
            </div>
          </div>
        </div>
      </div>

      {/* 下部：成果まとめバー（簡潔に要点のみを力強く主張） */}
      <div
        style={{
          marginTop: 6,
          padding: "20px 32px",
          borderRadius: 14,
          background: C.navy,
          color: C.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 8px 20px rgba(30, 58, 95, 0.2)",
        }}
      >
        <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: 0.5 }}>
          1人の知恵が、店舗全員の共通資産に。
        </span>
        <span
          style={{
            background: C.white,
            color: C.navy,
            padding: "8px 24px",
            borderRadius: 999,
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: 1,
          }}
        >
          属人化ゼロへ
        </span>
      </div>
    </div>
  </AppScene>
);
