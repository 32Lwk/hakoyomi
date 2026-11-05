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

/** 公式モデル様式『医薬品販売記録』をピクセルパーフェクトに描画するコンポーネント（崩れ・文字重なり・はみ出しゼロ） */
const OfficialSalesRecordTable: React.FC = () => {
  const cellStyle: React.CSSProperties = {
    border: "1px solid #1E293B",
    padding: "5px 8px",
    fontSize: 12.5,
    color: "#0F172A",
    fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
    lineHeight: 1.35,
  };
  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    background: "#F1F5F9",
    fontWeight: 700,
    width: "24%",
  };

  return (
    <div
      style={{
        padding: "18px 24px",
        background: "#FFFDF9",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
      }}
    >
      {/* 文書見出し */}
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 4, color: "#0F172A" }}>
          医 薬 品 販 売 記 録
        </div>
        <div style={{ fontSize: 10.5, color: "#334155", marginTop: 4, lineHeight: 1.4 }}>
          ◇薬局医薬品・要指導医薬品・第一類医薬品は、法令上、販売記録が必須。<br />
          ◇指定濫用防止医薬品は、頻回購入・多量購入の防止対応のため、法令上の定めに関わらず記録を行うこととする。<br />
          <span style={{ fontWeight: 700 }}>※印：法令上記録必須事項【薬局医薬品・要指導医薬品・第１類医薬品】（記載日より２年間保存）</span>
        </div>
      </div>

      {/* 上段テーブル：法令上記録必須事項 */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1.5px solid #0F172A" }}>
        <tbody>
          <tr>
            <td style={headerCellStyle}>販売した製品※</td>
            <td style={cellStyle}>
              <div>□薬局医薬品　□薬局製剤　□要指導医薬品　□第一類　□第二類　□第三類</div>
              <div style={{ fontWeight: 700, color: "#DC2626", marginTop: 2 }}>☑ 指定濫用防止医薬品に該当</div>
              <div style={{ marginTop: 2 }}>製品名（ パブロンゴールドA微粒 / ブロン錠　　　　　　　　）</div>
              <div style={{ marginTop: 2 }}>当該製品の使用経験　□ 無　・☑ 有（いつごろ： 1ヶ月前　　）</div>
            </td>
          </tr>
          <tr>
            <td style={headerCellStyle}>販売個数※</td>
            <td style={cellStyle}>1 個</td>
          </tr>
          <tr>
            <td style={headerCellStyle}>販売日時※</td>
            <td style={cellStyle}>2026 年　5 月　12 日（火）　14 時　30 分ごろ</td>
          </tr>
          <tr>
            <td style={headerCellStyle}>販売・情報提供者※</td>
            <td style={cellStyle}>
              薬剤師氏名※　　　　　　　　（登録販売者氏名： 日薬 太郎　　）
            </td>
          </tr>
          <tr>
            <td style={headerCellStyle}>理解の確認※</td>
            <td style={cellStyle}>☑ 理解したことを確認済</td>
          </tr>
          <tr>
            <td style={{ ...headerCellStyle, verticalAlign: "top" }}>その他特記事項<br /><span style={{ fontSize: 10, fontWeight: 400 }}>（濫用頻回防止）</span></td>
            <td style={{ ...cellStyle, height: 46 }}>
              <div>● 年齢確認：☑ 身分証確認　□ 自己申告等</div>
              <div style={{ color: "#475569", marginTop: 2 }}>他店での購入状況：他店舗での購入履歴なしと回答</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 仕切り文言 */}
      <div style={{ fontSize: 10, color: "#475569", margin: "4px 0", fontWeight: 700 }}>
        ◇以下については、法令上記録必須事項ではないが、可能な限り医薬品の適正使用のために記録する。
      </div>

      {/* 中段テーブル：購入者・使用者情報 */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1.5px solid #0F172A" }}>
        <tbody>
          <tr>
            <td style={{ ...headerCellStyle, width: "18%" }}>購入者氏名</td>
            <td style={{ ...cellStyle, width: "32%" }}>☑ 使用者本人</td>
            <td style={{ ...headerCellStyle, width: "14%" }}>年齢 / 性別</td>
            <td style={{ ...cellStyle, width: "16%" }}>34 歳（男）</td>
            <td style={{ ...headerCellStyle, width: "10%" }}>連絡先</td>
            <td style={{ ...cellStyle, width: "10%" }}>携帯等</td>
          </tr>
          <tr>
            <td style={headerCellStyle}>使用者氏名</td>
            <td style={cellStyle}>（購入者と使用者が異なる場合）</td>
            <td style={headerCellStyle}>年齢 / 性別</td>
            <td style={cellStyle}>　　歳（男・女）</td>
            <td style={headerCellStyle}>連絡先</td>
            <td style={cellStyle}></td>
          </tr>
        </tbody>
      </table>

      {/* 下段テーブル：使用者の基礎情報の確認 */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1.5px solid #0F172A", marginTop: 4 }}>
        <tbody>
          <tr>
            <td
              rowSpan={7}
              style={{
                ...headerCellStyle,
                width: "8%",
                textAlign: "center",
                verticalAlign: "middle",
                letterSpacing: 2,
                writingMode: "vertical-rl",
                padding: "8px 4px",
                fontSize: 11.5,
              }}
            >
              使用者の基礎情報の確認
            </td>
            <td style={{ ...headerCellStyle, width: "20%" }}>症　状</td>
            <td style={cellStyle}>
              【主症状】せき、のどの痛み、微熱<br />
              【随伴・期間】昨日夜から悪化
            </td>
          </tr>
          <tr>
            <td style={headerCellStyle}>医師の受診</td>
            <td style={cellStyle}>☑ 受診なし　・□ 受診あり</td>
          </tr>
          <tr>
            <td style={headerCellStyle}>お薬手帳</td>
            <td style={cellStyle}>□ 持っていない　・☑ 持っている（持参）</td>
          </tr>
          <tr>
            <td style={headerCellStyle}>併用薬・サプリ</td>
            <td style={cellStyle}>☑ 使用なし　・□ 使用あり</td>
          </tr>
          <tr>
            <td style={headerCellStyle}>既往歴・副作用</td>
            <td style={cellStyle}>既往歴：☑ なし　/ 副作用歴：☑ なし</td>
          </tr>
          <tr>
            <td style={headerCellStyle}>アレルギー</td>
            <td style={cellStyle}>☑ なし　・□ あり</td>
          </tr>
          <tr>
            <td style={headerCellStyle}>妊娠・授乳</td>
            <td style={cellStyle}>☑ 該当なし</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

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
          top: 140,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {/* === 背景の公文書・書類の山（大量に散乱させて現場の過酷さを演出） === */}

        {/* 背景1: 手順書モデル 表紙 (20260205_01 p1) */}
        <div style={{ position: "absolute", top: -30, left: 20, width: 380, transform: "rotate(-8deg)", boxShadow: "0 10px 25px rgba(0,0,0,0.12)", zIndex: 1, opacity: 0.85 }}>
          <Img src={staticFile("real/doc-01-p1.png")} style={{ width: "100%", display: "block" }} />
        </div>

        {/* 背景2: 手順書モデル 2ページ目 (20260205_01 p2) */}
        <div style={{ position: "absolute", top: 220, left: -60, width: 360, transform: "rotate(6deg)", boxShadow: "0 10px 25px rgba(0,0,0,0.12)", zIndex: 1, opacity: 0.8 }}>
          <Img src={staticFile("real/doc-01-p2.png")} style={{ width: "100%", display: "block" }} />
        </div>

        {/* 背景3: 指針モデル 表紙 (20260205_03 p1) */}
        <div style={{ position: "absolute", top: 520, left: -20, width: 360, transform: "rotate(-5deg)", boxShadow: "0 10px 25px rgba(0,0,0,0.12)", zIndex: 1, opacity: 0.75 }}>
          <Img src={staticFile("real/doc-03-p1.png")} style={{ width: "100%", display: "block" }} />
        </div>

        {/* 背景4: 販売証票シール台紙 (別添8.xls) */}
        <div style={{ position: "absolute", top: 160, left: 350, width: 370, transform: "rotate(-10deg)", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", zIndex: 2, opacity: 0.9 }}>
          <div style={{ background: "#475569", color: "#fff", padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
            別添8：販売証票（シール台紙）
          </div>
          <Img src={staticFile("real/doc-stamp-sheet.png")} style={{ width: "100%", display: "block" }} />
        </div>

        {/* 背景5: 指定濫用防止医薬品 注意喚起 (20260205_08) */}
        <div style={{ position: "absolute", top: 10, left: 1150, width: 440, transform: "rotate(7deg)", boxShadow: "0 10px 25px rgba(0,0,0,0.14)", zIndex: 1, opacity: 0.85 }}>
          <Img src={staticFile("real/doc-abuse-warn.png")} style={{ width: "100%", display: "block" }} />
        </div>

        {/* 背景6: 指定第二類POP (20260205_07) */}
        <div style={{ position: "absolute", top: 320, left: 1320, width: 400, transform: "rotate(-6deg)", boxShadow: "0 10px 25px rgba(0,0,0,0.12)", zIndex: 1, opacity: 0.8 }}>
          <Img src={staticFile("real/doc-second-notice.png")} style={{ width: "100%", display: "block" }} />
        </div>

        {/* 背景7: 指針モデル 本文 (20260205_03 p2) */}
        <div style={{ position: "absolute", top: 560, left: 1180, width: 380, transform: "rotate(5deg)", boxShadow: "0 10px 25px rgba(0,0,0,0.12)", zIndex: 1, opacity: 0.75 }}>
          <Img src={staticFile("real/doc-03-p2.png")} style={{ width: "100%", display: "block" }} />
        </div>


        {/* === 中景・前面の実務資料 === */}

        {/* 1. 左手前：『［OTC医薬品販売時確認シート］販売者用』（20260205_09 本物様式） */}
        <div
          style={{
            position: "absolute",
            top: 140,
            left: 50,
            width: 470,
            transform: "rotate(-2deg)",
            boxShadow: "0 20px 45px rgba(15, 23, 42, 0.28)",
            borderRadius: 8,
            overflow: "hidden",
            border: "2px solid #16A34A",
            background: C.white,
            zIndex: 4,
          }}
        >
          <div style={{ background: "#16A34A", color: C.white, padding: "7px 14px", fontSize: 14, fontWeight: 900, display: "flex", justifyContent: "space-between" }}>
            <span>［OTC医薬品販売時確認シート］（本物様式）</span>
            <span>【濫】必須確認項目</span>
          </div>
          <Img src={staticFile("real/doc-checksheet.png")} style={{ width: "100%", display: "block" }} />
          <div style={{ background: "#DC2626", color: C.white, padding: "8px 12px", fontSize: 13, fontWeight: 700, textAlign: "center" }}>
            ※1人あたり10項目以上を店頭でチェック必須！
          </div>
        </div>

        {/* 2. 右手中段：本日ダウンロードの店頭POP（20260205_04 本物様式、QRカードの下から展開） */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 1340,
            right: 25,
            transform: "rotate(2deg)",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.22)",
            borderRadius: 10,
            overflow: "hidden",
            border: "2px solid #DC2626",
            background: C.white,
            zIndex: 4,
          }}
        >
          <div style={{ background: "#DC2626", color: C.white, padding: "6px 14px", fontSize: 13, fontWeight: 900, display: "flex", justifyContent: "space-between" }}>
            <span>店頭掲示用POP（本物様式）</span>
            <span>18歳未満複数個販売禁止</span>
          </div>
          <Img src={staticFile("real/doc-pop-notice.png")} style={{ width: "100%", display: "block" }} />
        </div>

        {/* 3. 右手前：本日ダウンロードの販売・陳列規定（20260205_06 本物様式） */}
        <div
          style={{
            position: "absolute",
            top: 480,
            left: 1350,
            right: 20,
            transform: "rotate(-1.5deg)",
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
          <Img src={staticFile("real/doc-sales-rules.png")} style={{ width: "100%", display: "block" }} />
        </div>


        {/* === 4. 中央【主役・特大】『医薬品販売記録』（本物モデル様式・崩れゼロ完全版） === */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 540,
            width: 760,
            height: 900,
            transform: "rotate(0.5deg)",
            boxShadow: "0 28px 65px rgba(15, 23, 42, 0.38)",
            borderRadius: 10,
            overflow: "hidden",
            border: "3px solid #D97706",
            background: "#FFFDF9",
            zIndex: 8,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ background: "#D97706", color: C.white, padding: "8px 18px", fontSize: 16, fontWeight: 900, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>医薬品販売記録（本物モデル様式・紙の手書き記録作業）</span>
            <span style={{ background: "#DC2626", padding: "4px 12px", borderRadius: 4, fontSize: 13, fontWeight: 900 }}>法令上必須・2年間紙保存</span>
          </div>
          <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
            {/* ピクセルパーフェクトな完全版テーブル（文字化け・重なり・はみ出しゼロ） */}
            <OfficialSalesRecordTable />

            {/* ユーザー提供の本物スタンプ画像を右下にリアルに捺印！ */}
            <div
              style={{
                position: "absolute",
                bottom: 18,
                right: 25,
                transform: "rotate(-3deg)",
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                zIndex: 15,
              }}
            >
              <Img
                src={staticFile("real/stamp-sold.png")}
                style={{
                  width: 255,
                  display: "block",
                  borderRadius: 4,
                  border: "1.5px solid rgba(0,0,0,0.15)",
                }}
              />
            </div>
          </div>
        </div>


        {/* === 5. 主張すべきことをスライド真上に大胆に重ねて配置！（ユーザー要望対応） === */}
        <div
          style={{
            position: "absolute",
            top: 420,
            left: 490,
            width: 860,
            transform: "rotate(-3.5deg)",
            background: "linear-gradient(135deg, rgba(220, 38, 38, 0.96), rgba(185, 28, 28, 0.96))",
            color: C.white,
            padding: "16px 28px",
            borderRadius: 14,
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5)",
            border: "3px solid #FEF08A",
            zIndex: 30,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 2, color: "#FEF08A" }}>
            毎回の紙手書きは、現場の限界！
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, marginTop: 4, letterSpacing: 1 }}>
            他店での購入履歴は、紙では絶対に追えない
          </div>
        </div>


        {/* === 6. 右下の赤バッジ（短く言いたいことのみに絞り込み！） === */}
        <div
          style={{
            position: "absolute",
            bottom: 15,
            right: 25,
            background: "#DC2626",
            color: C.white,
            borderRadius: 10,
            padding: "12px 22px",
            transform: "rotate(1deg)",
            boxShadow: "0 16px 36px rgba(220, 38, 38, 0.45)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            zIndex: 25,
            border: "2px solid #FCA5A5",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 900, color: "#FEF08A", letterSpacing: 0.5 }}>
            2026年5月施行：法定義務化
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, opacity: 0.98 }}>
            店頭オペレーション崩壊の危機
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
