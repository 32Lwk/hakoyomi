import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { FONT } from "../theme";

// YouTubeサムネイル用コンポーネント集（1920x1080）
// 一覧で縮小表示されたときでも一瞬で目を惹く特大フォント、高いコントラスト、明快な訴求

/** パターンA: 【社会課題・インパクト特化型】毎回の紙手書き、Claudeで10秒へ。 */
export const ThumbnailA: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #090D16 0%, #172033 50%, #0F172A 100%)",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {/* 背景の公文書・書類の山（左側にドラマチックに配置） */}
      <div style={{ position: "absolute", left: -60, top: -40, width: 850, height: 1160, opacity: 0.3, filter: "blur(0.5px)" }}>
        <div style={{ position: "absolute", top: 40, left: 30, width: 440, transform: "rotate(-10deg)" }}>
          <Img src={staticFile("real/doc-checksheet.png")} style={{ width: "100%", borderRadius: 8 }} />
        </div>
        <div style={{ position: "absolute", top: 380, left: 0, width: 480, transform: "rotate(6deg)" }}>
          <Img src={staticFile("real/doc-sales-rules.png")} style={{ width: "100%", borderRadius: 8 }} />
        </div>
        <div style={{ position: "absolute", top: 680, left: 60, width: 450, transform: "rotate(-5deg)" }}>
          <Img src={staticFile("real/doc-01-p1.png")} style={{ width: "100%", borderRadius: 8 }} />
        </div>
        <div style={{ position: "absolute", top: 300, left: 340, width: 280, transform: "rotate(-12deg)" }}>
          <Img src={staticFile("real/stamp-sold.png")} style={{ width: "100%" }} />
        </div>
      </div>

      {/* 左側の強烈なテキストエリア */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 60,
          width: 1160,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          zIndex: 10,
        }}
      >
        {/* 上部アラートピル */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              background: "#DC2626",
              color: "#FFFFFF",
              fontSize: 28,
              fontWeight: 900,
              padding: "10px 24px",
              borderRadius: 8,
              letterSpacing: 2,
              boxShadow: "0 8px 24px rgba(220,38,38,0.5)",
            }}
          >
            2026年5月施行 改正薬機法
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              color: "#E2E8F0",
              fontSize: 26,
              fontWeight: 700,
              padding: "10px 22px",
              borderRadius: 8,
              letterSpacing: 1,
            }}
          >
            指定濫用防止医薬品の確認・記録義務化
          </div>
        </div>

        {/* メイン巨大キャッチコピー */}
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 900,
              color: "#F87171",
              letterSpacing: -1.5,
              lineHeight: 1.15,
              textShadow: "0 6px 20px rgba(0,0,0,0.8)",
            }}
          >
            毎回の紙手書き、
          </div>
          <div
            style={{
              fontSize: 102,
              fontWeight: 900,
              color: "#FEF08A",
              letterSpacing: -1.5,
              lineHeight: 1.15,
              textShadow: "0 8px 30px rgba(0,0,0,0.9)",
            }}
          >
            Claudeで10秒へ。
          </div>
        </div>

        {/* 赤い警告スタンプ風帯 */}
        <div
          style={{
            marginTop: 10,
            background: "linear-gradient(90deg, rgba(220, 38, 38, 0.98) 0%, rgba(185, 28, 28, 0.98) 100%)",
            color: "#FFFFFF",
            padding: "16px 32px",
            borderRadius: 14,
            fontSize: 38,
            fontWeight: 900,
            letterSpacing: 2,
            boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
            border: "2px solid #FCA5A5",
            alignSelf: "flex-start",
          }}
        >
          現場の記録崩壊をゼロにするOTC支援AI「ハコよみ」
        </div>

        {/* 下部タグ */}
        <div style={{ marginTop: 24, display: "flex", gap: 14 }}>
          {["系列店照合で即時検知", "販売記録の下書き自動生成", "現役登録販売者が開発"].map((txt, i) => (
            <div
              key={i}
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                border: "2px solid #38BDF8",
                color: "#F0F9FF",
                fontSize: 24,
                fontWeight: 700,
                padding: "10px 22px",
                borderRadius: 999,
              }}
            >
              ✓ {txt}
            </div>
          ))}
        </div>
      </div>

      {/* 右側の特大スマホ実機モック（完璧に収まる位置に調整） */}
      <div
        style={{
          position: "absolute",
          right: 120,
          top: 25,
          width: 420,
          transform: "rotate(2.5deg)",
          filter: "drop-shadow(-20px 30px 60px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 45px rgba(56, 189, 248, 0.35))",
          zIndex: 20,
        }}
      >
        <Img src={staticFile("thumbnails/phone_s2b.png")} style={{ width: "100%", display: "block" }} />
      </div>

      {/* 左下のロゴバッジ */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 80,
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: "rgba(15, 23, 42, 0.9)",
          padding: "10px 24px",
          borderRadius: 999,
          border: "1.5px solid rgba(255,255,255,0.25)",
        }}
      >
        <span style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF" }}>ハコよみ (hakoyomi)</span>
        <span style={{ color: "#94A3B8", fontSize: 22 }}>×</span>
        <span style={{ fontSize: 26, fontWeight: 800, color: "#F59E0B" }}>Built with Claude 2026</span>
      </div>
    </AbsoluteFill>
  );
};

/** パターンB: 【プロダクト・先進性特化型】バーコード1秒。接客の全材料が集約する。 */
export const ThumbnailB: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at 75% 30%, #1E3A5F 0%, #0F172A 60%, #020617 100%)",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {/* 鮮やかな光彩背景 */}
      <div
        style={{
          position: "absolute",
          top: -200,
          right: 250,
          width: 700,
          height: 700,
          borderRadius: 350,
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(56, 189, 248, 0) 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* 左側の訴求テキスト */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 70,
          width: 1140,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          zIndex: 10,
        }}
      >
        {/* コンテスト公認バッジ */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            background: "linear-gradient(90deg, #D97706 0%, #B45309 100%)",
            color: "#FFFFFF",
            padding: "8px 24px",
            borderRadius: 999,
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: 2,
            boxShadow: "0 6px 20px rgba(217, 119, 6, 0.4)",
            alignSelf: "flex-start",
          }}
        >
          ★ Built with Claude Japan 2026 応募作
        </div>

        {/* メインタイトル */}
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              fontSize: 98,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: -2,
              lineHeight: 1.1,
              textShadow: "0 6px 20px rgba(0,0,0,0.6)",
            }}
          >
            バーコード1秒。
          </div>
          <div
            style={{
              fontSize: 82,
              fontWeight: 900,
              color: "#38BDF8",
              letterSpacing: -1,
              lineHeight: 1.15,
            }}
          >
            接客の全材料が集約する。
          </div>
        </div>

        {/* サブタイトル */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#E2E8F0",
            lineHeight: 1.4,
            marginTop: 4,
          }}
        >
          ドラッグストア店頭DX「ハコよみ」<br />
          <span style={{ color: "#FCD34D", fontWeight: 900 }}>分厚い添付文書の捜索・手書き記録をゼロに</span>
        </div>

        {/* 3つの主要機能ピル */}
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { num: "01", title: "指定濫用防止医薬品の10秒自動記録", tag: "2026年改正薬機法対応" },
            { num: "02", title: "2〜4品の添付文書を1秒横断比較", tag: "Claudeが違いを整理" },
            { num: "03", title: "ベテランの接客知恵を全商品に共有", tag: "属人化ゼロへ" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                background: "rgba(30, 41, 59, 0.75)",
                backdropFilter: "blur(10px)",
                border: "1.5px solid rgba(255, 255, 255, 0.15)",
                padding: "14px 26px",
                borderRadius: 14,
                width: 860,
              }}
            >
              <span style={{ fontSize: 34, fontWeight: 900, color: "#38BDF8" }}>{item.num}</span>
              <span style={{ fontSize: 32, fontWeight: 700, color: "#FFFFFF", flex: 1 }}>{item.title}</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#FCD34D", background: "rgba(252, 211, 77, 0.15)", padding: "4px 14px", borderRadius: 6 }}>{item.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 右側のスマホ画面（比較画面） */}
      <div
        style={{
          position: "absolute",
          right: 120,
          top: 25,
          width: 420,
          transform: "rotate(-2deg)",
          filter: "drop-shadow(0 25px 70px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 50px rgba(56, 189, 248, 0.4))",
          zIndex: 20,
        }}
      >
        <Img src={staticFile("thumbnails/phone_s3.png")} style={{ width: "100%", display: "block" }} />
      </div>
    </AbsoluteFill>
  );
};

/** パターンC: 【劇的ビフォーアフター型】毎回の紙手書きは現場の限界！ ➔ 10秒で記録完了 */
export const ThumbnailC: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "#0F172A",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {/* 画面を左右に2分割 */}
      {/* 左半分：BEFORE */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 930,
          height: 1080,
          background: "linear-gradient(135deg, #1E1B4B 0%, #450A0A 100%)",
          borderRight: "6px solid #FEF08A",
          overflow: "hidden",
          padding: "50px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: 0.25, filter: "grayscale(30%)" }}>
          <Img src={staticFile("real/doc-checksheet.png")} style={{ position: "absolute", top: 120, left: -40, width: 500, transform: "rotate(-12deg)" }} />
          <Img src={staticFile("real/doc-sales-rules.png")} style={{ position: "absolute", bottom: 40, left: 100, width: 450, transform: "rotate(8deg)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 10 }}>
          <div
            style={{
              display: "inline-block",
              background: "#DC2626",
              color: "#FFFFFF",
              fontSize: 32,
              fontWeight: 900,
              padding: "8px 24px",
              borderRadius: 8,
              letterSpacing: 2,
            }}
          >
            BEFORE : 店頭の現実
          </div>
          <div style={{ fontSize: 74, fontWeight: 900, color: "#FFFFFF", marginTop: 20, lineHeight: 1.2 }}>
            毎回の紙手書きは<br />
            <span style={{ color: "#F87171", fontSize: 86 }}>現場の限界！</span>
          </div>
          <div style={{ marginTop: 24, color: "#E2E8F0", fontSize: 30, lineHeight: 1.6, fontWeight: 600 }}>
            ✕ 1人10項目の紙手書きチェック<br />
            ✕ 分厚い添付文書の捜索<br />
            ✕ 2年間の紙保存の山
          </div>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 10,
            background: "rgba(0,0,0,0.65)",
            padding: "16px 24px",
            borderRadius: 12,
            color: "#FCA5A5",
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          2026年5月施行：改正薬機法で義務化
        </div>
      </div>

      {/* 右半分：AFTER */}
      <div
        style={{
          position: "absolute",
          left: 930,
          top: 0,
          right: 0,
          height: 1080,
          background: "linear-gradient(135deg, #064E3B 0%, #0F172A 100%)",
          padding: "50px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        <div style={{ position: "relative", zIndex: 10 }}>
          <div
            style={{
              display: "inline-block",
              background: "#10B981",
              color: "#FFFFFF",
              fontSize: 32,
              fontWeight: 900,
              padding: "8px 24px",
              borderRadius: 8,
              letterSpacing: 2,
            }}
          >
            AFTER : ハコよみ
          </div>
          <div style={{ fontSize: 74, fontWeight: 900, color: "#FFFFFF", marginTop: 20, lineHeight: 1.2 }}>
            系列店照合 ＆<br />
            <span style={{ color: "#34D399", fontSize: 86 }}>10秒で記録完了</span>
          </div>
          <div style={{ marginTop: 24, color: "#E2E8F0", fontSize: 30, lineHeight: 1.6, fontWeight: 600 }}>
            ◯ バーコード1秒スキャン<br />
            ◯ Claudeが記録下書きを即座生成<br />
            ◯ 2〜4品の横断比較も一瞬
          </div>
        </div>

        {/* 右下に浮き出るスマホ画面 */}
        <div
          style={{
            position: "absolute",
            right: 40,
            bottom: -80,
            width: 380,
            transform: "rotate(3deg)",
            filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.8))",
            zIndex: 15,
          }}
        >
          <Img src={staticFile("thumbnails/phone_s2b.png")} style={{ width: "100%", display: "block" }} />
        </div>
      </div>

      {/* 中央の VS バッジ */}
      <div
        style={{
          position: "absolute",
          left: 930,
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 130,
          height: 130,
          borderRadius: 65,
          background: "#FEF08A",
          color: "#0F172A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 54,
          fontWeight: 900,
          boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
          border: "6px solid #0F172A",
          zIndex: 30,
        }}
      >
        VS
      </div>
    </AbsoluteFill>
  );
};

/** パターンD: 【理念・信頼性特化型】誰が接客しても、同じ高水準の説明を。 */
export const ThumbnailD: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 80,
          width: 1100,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", gap: 14 }}>
          <div
            style={{
              background: "#38BDF8",
              color: "#0F172A",
              fontSize: 26,
              fontWeight: 900,
              padding: "8px 22px",
              borderRadius: 8,
              letterSpacing: 1.5,
            }}
          >
            現役登録販売者が開発
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#FFFFFF",
              fontSize: 26,
              fontWeight: 700,
              padding: "8px 20px",
              borderRadius: 8,
            }}
          >
            Claude 3.5 Sonnet 実装
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 94, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.15 }}>
            誰が接客しても、
          </div>
          <div style={{ fontSize: 94, fontWeight: 900, color: "#FDE047", lineHeight: 1.15 }}>
            同じ高水準の説明を。
          </div>
        </div>

        <div style={{ fontSize: 38, color: "#E2E8F0", fontWeight: 700, lineHeight: 1.4, marginTop: 8 }}>
          医薬品接客・濫用防止確認支援アプリ<br />
          <span style={{ fontSize: 48, color: "#38BDF8", fontWeight: 900 }}>「ハコよみ (hakoyomi)」</span>
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 16 }}>
          {[
            "JAN 1秒スキャン",
            "濫用防止 10秒記録",
            "添付文書 横断比較",
            "ベテランの知恵継承",
          ].map((txt, i) => (
            <div
              key={i}
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                border: "2px solid rgba(255,255,255,0.3)",
                color: "#FFFFFF",
                fontSize: 26,
                fontWeight: 700,
                padding: "10px 22px",
                borderRadius: 12,
              }}
            >
              ✓ {txt}
            </div>
          ))}
        </div>
      </div>

      {/* 右側の特大スマホ実機モック */}
      <div
        style={{
          position: "absolute",
          right: 120,
          top: 25,
          width: 420,
          transform: "rotate(2deg)",
          filter: "drop-shadow(0 30px 70px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 50px rgba(56, 189, 248, 0.4))",
          zIndex: 20,
        }}
      >
        <Img src={staticFile("thumbnails/phone_s2.png")} style={{ width: "100%", display: "block" }} />
      </div>
    </AbsoluteFill>
  );
};
