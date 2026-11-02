# System Architecture — ハコよみ（HakoYomi）

Version 1.2 / 2026-11-02 / 関連：`prd.md` `rules.md`（L-20261102-28：実商品の事実データ＋PMDAリンクアウト、製品画像・Storage廃止）

## 1. High-level Diagram
```mermaid
flowchart LR
  subgraph DEV[開発時（ローカル・ゆう）]
    PMDA[PMDA 添付文書<br/>1件ずつ手で開く] --> EX[Claude: 事実抽出<br/>scripts/extract]
    EX --> VER[ゆうが検証]
    VER --> SEED[seed: 事実データ<br/>出典URL・改訂日つき]
  end
  U[Browser<br/>スマホ / PC] --> N[Next.js App Router<br/>Vercel]
  N --> API[/Route Handlers<br/>/api/jan /api/compare /api/rules /api/record /api/shelf/]
  API --> JAN[JAN解決<br/>@zxing/browser or 手入力・品名検索]
  JAN --> DB
  API --> AL[Claude: 名寄せ<br/>+ コード換算・差分]
  API --> RM[コード: 8成分照合<br/>+ 手順書順 + 個数]
  API --> REC[Claude: 販売記録下書き]
  AL --> G[禁止語ガード<br/>regex + Claude自己検査]
  REC --> G
  G --> API
  SEED --> DB[(Supabase Postgres)]
  API --> DB
```
- 主経路は**JAN → 検証済み事実データ**。箱面OCRは補助（P1）に留める。
- 実行時にPMDAへ自動アクセスしない。添付文書の文言は保存・表示せず、PMDAの該当ページへリンクアウトする。
- 製品画像・カメラフレームは保存しない（Supabase Storage は使わない）。
- Supabase Auth は使わない（MVP）。DBアクセスはサーバー側の service role のみ。

## 2. Technology Stack
| 層 | 技術 | 理由 |
|---|---|---|
| Frontend | Next.js（App Router）+ TypeScript + Tailwind CSS | スマホ/PC両対応、Vercel直結 |
| UI部品 | shadcn/ui（T101で導入、色は design.md トークン） | Accordion/Checkbox等でM3/M5を高速化 |
| JAN読取 | @zxing/browser＋手入力・品名検索を常設 | iOS Safari含めスマホ/PCで安定。箱全文OCRを主にしない |
| 商品データ | 実商品の事実データ seed（開発時に PMDA 添付文書から抽出→ゆう検証）。下地は `data/medicine_data_assets/master` の品名・メーカー・JAN・分類・成分名・PMDA URL | 文言・画像は持たない（prd Q8） |
| Runtime AI | Claude API（名寄せ・販売記録下書き・自己検査） | 判定・数値計算はさせない |
| Dev AI | Claude API（添付文書からの事実抽出。ローカル実行のみ） | 抽出結果はゆうが検証してから seed |
| Validation | zod | 推薦欄なしのスキーマ |
| DB | Supabase Postgres | 商品事実・棚・手順書・記録 |
| Hosting | Vercel | 提出URL |
| Build | Claude Code + GitHub（32Lwk） | 実装 |

モデル名は実装時にAnthropic公式で確認し `.env` 指定【仮】。

## 3. Folder Structure
```
src/
  app/
    page.tsx                 # 単一縦画面（JAN→差→確認先アコーディオン→濫用確認→棚）
    api/jan/route.ts         # JAN解決：seed の事実データを返す
    api/compare/route.ts     # 商品A/B→名寄せ→換算・差分→ガード
    api/rules/route.ts       # 指定濫用照合（コード）+手順書項目
    api/record/route.ts      # 確認記録・販売記録下書き
    api/shelf/route.ts       # 棚番（肝）
  components/  JanCapture, DiffTable, SourceAccordion, AbuseBanner, Checklist, ShelfCard, JudgeNotice
  lib/
    claude/ client.ts, prompts/{align,record,guard}.ts
    schema/ product.ts, diff.ts, rules.ts
    units.ts
    guard/ banwords.ts, uiCopy.ts
    catalog/ janLookup.ts    # seed 参照＋PMDA GTIN/JANリダイレクトURL（コード定数）
    supabase/ server.ts
  data/ abuse_ingredients.ts, mock_sop.md, mock_shelf.json
scripts/
  extract/                   # 開発時の事実抽出（入力の添付文書は data/ 配下=非コミット）
tests/
supabase/migrations/
```

## 4. Data Flow
**開発時：** ゆうがPMDAで添付文書を1件ずつ開く → ローカルで Claude に事実（成分名・分量・基準量・内容量・区分）だけ抽出 → zod 検証 → ゆうが目視検証 → `products` / `product_facts` に seed（出典URL・改訂日つき、文言なし）。
**比較：** JAN読取/手入力（A・B）→ seed の事実 → Claude名寄せ＋`units.ts`換算 → 差分（コード）→ ガード → DiffTable。アコーディオンは欄名・改訂日・PMDAリンクのみ。
**濫用確認：** 事実の成分名＋個数 → 8成分をコード照合 → 手順書項目を `order_no` 順に表示（コード）→ チェック → `/api/record`（Claudeで販売記録下書き→ガード）。
**棚（肝）：** 登販が選んだ商品のJAN/品名 → `shelf_locations`（Claude不使用）。アプリは推薦しない。

## 5. Database Schema
```mermaid
erDiagram
  products ||--o{ shelf_locations : "置き場"
  products ||--o{ product_facts : "事実"
  sop_documents ||--o{ sop_items : "項目"
  checklist_sessions ||--o{ checklist_checks : "確認"
  sop_items ||--o{ checklist_checks : ""
  products { uuid id PK; text jan; text name; text maker; text risk_class; text pmda_url; date doc_revised_on; }
  product_facts { uuid id PK; uuid product_id FK; text field "ingredient|content_qty|basis"; text ingredient; numeric amount; text unit; text basis; text source_field; bool uncertain; text verified_by; }
  shelf_locations { uuid id PK; uuid product_id FK; text store_id "mock-store-1"; text aisle; text shelf; int tier; }
  sop_documents { uuid id PK; text title; text source "mock-JACDS-style"; date version_date; text raw_text; }
  sop_items { uuid id PK; uuid sop_id FK; int order_no; text label; text condition; }
  checklist_sessions { uuid id PK; text staff_alias; text product_label; int quantity; bool abuse_target; timestamptz created_at; }
  checklist_checks { uuid id PK; uuid session_id FK; uuid sop_item_id FK; timestamptz checked_at; }
```
- 客の氏名・健康情報カラムは作らない。添付文書の文言カラムも作らない。
- `abuse_ingredients` は `src/data` 静的定数（出典URL・日付）。

## 6. Key Decisions
| 決定 | 理由 |
|---|---|
| JAN主経路、箱OCRは補助 | 表記ゆれ箱をその場で読むより、添付文書由来の事実で根拠を揃える。撮影はバーコードに寄せて現場速度を出す |
| 事実の抽出は開発時＋人の検証 | PMDAへの自動アクセス・文言の複製をせず、抽出精度もこの検証で測れる |
| 文言はPMDAリンクアウト | 添付文書は製販の著作物（prd Q8）。登販が原文を自分で確認する形はHITLにも合う |
| 換算・差分はコード | 数値をLLMに任せない |
| 8成分判定・手順書順はコード | 揺れ防止。Claudeは名寄せと記録下書きのみ |
| 推薦欄のないスキーマ＋ガード | G6。選定は登販 |
| 棚は静的マスタ | 肝機能。Claude不要 |
| 認証なし | ソロ・期間短。客・担当者は模擬 |
| 画像・フレームを保存しない | 権利・PII リスクと実装量を減らす |

## 7. Security / Safety
- 禁止語ガード必須。UIはホワイトリスト。
- 症状入力・客向けモード・販売可否ボタンなし。
- APIキーはサーバーのみ。RLS有効、書き込みは service role。
- 添付文書の文言・PDF はリポ・DB・公開URLに置かない（ローカルの `data/` のみ、非コミット）。

## 8. Scalability & Future
実店舗棚CSV取込、手順書アップロード、箱OCRフォールバック強化、多店舗＋認証。POS連携は対象外のまま。

## 9. External Services
Anthropic Claude API／Supabase／Vercel／GitHub／PMDA（リンクアウト先、開発時の手動確認）。

## 10. Environment Setup
```
ANTHROPIC_API_KEY=
CLAUDE_MODEL=
CLAUDE_MODEL_GUARD=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```
※ キーは NEXT_PUBLIC_ にしない（サーバ側のみ）。PMDA の GTIN/JAN リダイレクトURLはコード定数（env にしない）。
`create-next-app` → `@anthropic-ai/sdk` `@supabase/supabase-js` zod → migrations → Vercel。

## 11. Conclusion
Claudeは開発時の事実抽出（人が検証）と、実行時の名寄せ・記録下書き・自己検査に限定。差分・濫用判定・手順書順・棚は決定的コードと静的データ。文言はPMDAで人が確認する。推薦は出さない。
