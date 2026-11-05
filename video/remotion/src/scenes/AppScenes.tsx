import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { AppScene, FeatureList, ProblemSolutionBanner, SceneHeading } from "../components/AppScene";
import { C, FONT, FPS, LAYOUT } from "../theme";
import { lineTiming } from "../captions";
import { outputSec, scene, sec, type SceneId } from "../timeline";
import { type PipelineProps } from "./Pipeline";

// 画面録画の場面の右側。左側のスマホ実機モックが主役になるよう、文字量を絞り要点キーワードでビシッと整列。

/** 録画の秒 t（cues.json の秒）が場面の何秒目に映るか */
const out = (id: SceneId, t: number) => outputSec(scene(id), t) ?? 0;

/** S2b-0（0〜8.7秒）：画面全体（1920x1080フルスクリーン）に本物のPDF・文書PNGをまばらに散乱させ、大変な記録作業を特大表示して現場の過重負担を圧倒的迫力で主張するキャンバス */
const RealAbuseDocumentChaosCanvas: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, #F8FAFC 0%, #E2E8F0 100%)",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {/* 上部ヘッダー（左に見出し、中央〜右寄りに法改正アラートバッジ：QRカードと絶対に被らない安全位置） */}
      <div
        style={{
          position: "absolute",
          top: 36,
          left: 80,
          right: 440, // QRコードカード（幅400+余白）の左端でしっかり止める
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <SceneHeading id="S2b" title="指定濫用防止医薬品の確認・記録" />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#FEF2F2",
            border: "2px solid #EF4444",
            padding: "8px 20px",
            borderRadius: 999,
            boxShadow: "0 8px 24px rgba(239, 68, 68, 0.2)",
            flexShrink: 0,
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: 5, background: "#DC2626" }} />
          <span style={{ fontSize: 20, fontWeight: 900, color: "#991B1B", letterSpacing: 1 }}>
            2026年5月施行：改正薬機法により確認・記録が義務化
          </span>
        </div>
      </div>

      {/* デスク上の本物文書散乱エリア（本物のPDF/DOC画像PNGをまばらに散乱・記録作業を特大表示！） */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 50,
          right: 50,
          bottom: 20,
        }}
      >
        {/* 背景にチラ見えする販売証票シール台紙（別添8.xls 本物PNG） */}
        <div
          style={{
            position: "absolute",
            top: 260,
            left: 450,
            width: 380,
            transform: "rotate(-6deg)",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.15)",
            borderRadius: 6,
            overflow: "hidden",
            border: "1.5px solid #94A3B8",
            background: C.white,
            zIndex: 1,
            opacity: 0.85,
          }}
        >
          <div style={{ background: "#475569", color: C.white, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>
            販売証票（別添8・シール台紙）
          </div>
          <Img src={staticFile("real/doc-stamp-sheet.png")} style={{ width: "100%", display: "block" }} />
        </div>

        {/* 1. 日本薬剤師会『業務手順書モデル』（20260205_01.pdf 本物PNG） */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 440,
            transform: "rotate(-3.5deg)",
            boxShadow: "0 14px 34px rgba(15, 23, 42, 0.22)",
            borderRadius: 6,
            overflow: "hidden",
            border: "1.5px solid #CBD5E1",
            background: C.white,
            zIndex: 2,
          }}
        >
          <div style={{ background: C.navy, color: C.white, padding: "6px 12px", fontSize: 13, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
            <span>日本薬剤師会 手順書モデル（本物）</span>
            <span style={{ color: "#FDE047" }}>令和8年5月1日施行</span>
          </div>
          <Img
            src={staticFile("real/doc-guideline.png")}
            style={{
              width: "100%",
              display: "block",
            }}
          />
        </div>

        {/* 2. 『［OTC医薬品販売時確認シート］販売者用』（20260205_09.doc 本物PNG） */}
        <div
          style={{
            position: "absolute",
            top: 340,
            left: 20,
            width: 490,
            transform: "rotate(2deg)",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.25)",
            borderRadius: 8,
            overflow: "hidden",
            border: "2px solid #16A34A",
            background: C.white,
            zIndex: 3,
          }}
        >
          <div style={{ background: "#16A34A", color: C.white, padding: "6px 14px", fontSize: 14, fontWeight: 900, display: "flex", justifyContent: "space-between" }}>
            <span>［OTC医薬品販売時確認シート］（本物）</span>
            <span>【濫】必須確認項目</span>
          </div>
          <Img
            src={staticFile("real/doc-checksheet.png")}
            style={{
              width: "100%",
              display: "block",
            }}
          />
          <div style={{ background: "#DC2626", color: C.white, padding: "7px 12px", fontSize: 13, fontWeight: 700, textAlign: "center" }}>
            ※購入者1人あたり10項目以上を店頭でチェック・確認必須！
          </div>
        </div>

        {/* 3. 『医薬品販売記録』（20260205_10.doc 本物PNG） ★ユーザー指示により最も大変な記録作業を中央に特大表示！ */}
        <div
          style={{
            position: "absolute",
            top: 5,
            left: 500,
            width: 730,
            height: 885,
            transform: "rotate(0.5deg)",
            boxShadow: "0 26px 55px rgba(15, 23, 42, 0.35)",
            borderRadius: 10,
            overflow: "hidden",
            border: "3px solid #D97706",
            background: "#FFFDF5",
            zIndex: 6,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ background: "#D97706", color: C.white, padding: "8px 18px", fontSize: 16, fontWeight: 900, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>医薬品販売記録（本物様式例・紙の手書き記録作業）</span>
            <span style={{ background: "#DC2626", padding: "4px 12px", borderRadius: 4, fontSize: 13, fontWeight: 900 }}>法令上必須・2年間保存</span>
          </div>
          <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
            <Img
              src={staticFile("real/doc-record.png")}
              style={{
                width: "100%",
                display: "block",
              }}
            />
            {/* ユーザー提供の本物スタンプ画像を右下にリアルに捺印！ */}
            <div
              style={{
                position: "absolute",
                bottom: 25,
                right: 25,
                transform: "rotate(-3deg)",
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
              }}
            >
              <Img
                src={staticFile("real/stamp-sold.png")}
                style={{
                  width: 250,
                  display: "block",
                  borderRadius: 4,
                  border: "1.5px solid rgba(0,0,0,0.15)",
                }}
              />
            </div>
          </div>
        </div>

        {/* 4. 本日ダウンロードの店頭POP（20260205_04.ppt 本物PNG、QRカードの下から展開） */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 1270,
            right: 20,
            transform: "rotate(-1.5deg)",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.22)",
            borderRadius: 10,
            overflow: "hidden",
            border: "2px solid #DC2626",
            background: C.white,
            zIndex: 4,
          }}
        >
          <div style={{ background: "#DC2626", color: C.white, padding: "5px 14px", fontSize: 13, fontWeight: 900, display: "flex", justifyContent: "space-between" }}>
            <span>店頭掲示用POP文書（本物様式）</span>
            <span>18歳未満複数個販売禁止</span>
          </div>
          <Img
            src={staticFile("real/doc-pop-notice.png")}
            style={{
              width: "100%",
              display: "block",
            }}
          />
        </div>

        {/* 5. 本日ダウンロードの販売・陳列一覧（20260205_06.ppt 本物PNG） */}
        <div
          style={{
            position: "absolute",
            top: 470,
            left: 1290,
            right: 15,
            height: 240,
            transform: "rotate(2deg)",
            boxShadow: "0 16px 36px rgba(15, 23, 42, 0.2)",
            borderRadius: 8,
            overflow: "hidden",
            border: "1.5px solid #2563EB",
            background: C.white,
            zIndex: 3,
          }}
        >
          <div style={{ background: "#2563EB", color: C.white, padding: "5px 12px", fontSize: 13, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
            <span>対面販売・陳列管理規定（本物様式）</span>
            <span>手の届かない陳列義務</span>
          </div>
          <Img
            src={staticFile("real/doc-sales-rules.png")}
            style={{
              width: "100%",
              display: "block",
            }}
          />
        </div>

        {/* 6. 現場の過重負担コールアウト（右下前面、特大赤スタンプ付箋） */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 1255,
            right: 15,
            background: "linear-gradient(135deg, #DC2626, #B91C1C)",
            color: C.white,
            borderRadius: 12,
            padding: "16px 20px",
            transform: "rotate(-1deg)",
            boxShadow: "0 20px 45px rgba(220, 38, 38, 0.5)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            zIndex: 7,
            border: "2px solid #FCA5A5",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 0.5 }}>
            現場の悲鳴：確認・記録がパンク！
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, opacity: 0.98, lineHeight: 1.35 }}>
            ・1人1人これら全てを手書き記録<br />
            ・法令に基づき2年間の紙保管義務<br />
            ・他店での直近購入履歴は紙では確認不能！
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#FEF08A", borderTop: "1px dashed rgba(255,255,255,0.4)", paddingTop: 4 }}>
            ※2026年5月施行：店頭オペレーションが崩壊の危機
          </div>
        </div>
      </div>
    </div>
  );
};

export const S2b: React.FC = () => {
  // s2b-1 ナレーションの開始秒（約 9.16 秒）
  const s2b1StartSec = lineTiming("s2b-1").inScene;

  return (
    <AppScene
      id="S2b"
      phoneStartSec={s2b1StartSec}
      fullWidthContent={<RealAbuseDocumentChaosCanvas />}
    >
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

        {/* 中央：矢印のみ（ユーザー指示により「同成分を検知」バッジを削除しスッキリ統一） */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 40, color: C.navy, fontWeight: 900 }}>➔</div>
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
