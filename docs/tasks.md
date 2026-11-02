# Tasks — ハコよみ（キックオフ 2026-11-02 12:00 JST → MVP）

凡例：P0＝デモに必須／P1＝余力。見積はソロ実時間。Claude Code には「T0xx を prd.md / architecture.md / rules.md に従って実装して」と渡す。
**主経路は JAN（バーコード／手入力／品名検索）。箱写真OCRは補助（P1以降）。**（改訂 2026-11-02, L-20261102-23）

## 各Phaseのマージ前チェック
推薦系フィールドなし／症状入力欄なし／緑・赤の可否色なし／判定ボタンなし／`NEXT_PUBLIC_` にキーなし／原文は要約しない／`data/` がリポに入っていない

## Phase 0 Setup
- [ ] **T001** P0 0.5h 【担当：ゆう／Mac の Claude Code】「ハコよみ」フォルダ内に `hakoyomi/` を新規作成し公開リポ（GitHub 32Lwk/hakoyomi）、create-next-app（TS/Tailwind/App Router/src、`@/*`）、docsコピー、`.gitignore`（`data/`・`*.zip`・`.env*`、`.env.example`は残す）、`.env.example`（ANTHROPIC_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / CLAUDE_MODEL / CLAUDE_MODEL_GUARD、NEXT_PUBLIC_禁止）、最小page（作品名【仮】＋「判断は販売者が行ってください」）、README（対象／やらないこと／データ方針／HITL） — 完了：localhost表示・build通過・docsあり・dataなし
- [ ] **T002** P0 0.5h ESLint/Prettier/vitest、tsconfig strict、禁止語テスト雛形 — 完了：`npm run lint && npm test` 通過
- [ ] **T003** P0 0.5h Supabaseプロジェクト、migration（architecture §5、PIIカラムなし） — 完了：テーブル作成済み
- [ ] **T004** P0 0.5h `.env.local`・Vercel連携（空デプロイ） — 完了：Vercel URLが開く

## Phase 1 静的モックUI（固定JSON）
- [ ] **T101** P0 2h 単一縦画面レイアウト（design §2）、shadcn/ui をここで導入（色は design.md トークン）、固定JSONで DiffTable / SourceAccordion / AbuseBanner / Checklist / ShelfCard — 完了：スマホ/PCで崩れない
- [ ] **T102** P0 0.5h `uiCopy.ts` ホワイトリスト＋`JudgeNotice`（「判断は販売者が行ってください」常時表示） — 完了：画面文言が全てホワイトリスト由来
- [ ] **T103′** P0 1h `JanCapture`（@zxing/browser でカメラJAN読取＋手入力＋品名検索）※旧CaptureBarを置換 — 完了：スマホでJAN読取、PCで手入力・品名検索

## Phase 2 JAN→構造化（旧「単箱抽出」を置換）
- [ ] **T201′** P0 1h `schema/product.ts`（zod。推薦欄なし、項目ごとに出典・confidence・uncertain） — 完了：型生成
- [ ] **T202′** P0 1.5h `catalog/janLookup.ts`（手動キュレートの模擬デモSKU＋PMDA GTIN/JANリダイレクトURL＝リンクアウト専用。全文キャッシュ・一括クロールなし） — 完了：デモJANで製品と出典URLが返る
- [ ] **T203′** P0 2h `/api/jan`：Claude tool use で構造化 → zod検証 → guard、失敗時エラー — 完了：かぜ薬AのJANで成分・分量・原文引用・出典が返る
- [ ] **T601-min** P0 0.5h（前倒し）`banwords.ts`＋最小 regex `guard()`。rules §4-2「Claude出力は必ずguard経由」をPhase 2から守る — 完了：禁止語入り文字列を差し止めるテスト緑
- [ ] **T204** P1 0.5h `product_docs_cache`（JANキー、出典メタのみ） — 完了：同一JAN 2回目が即時
- [ ] **T205** P1 1h（補助）箱写真OCR：JAN読めない時のみ品名候補を出す — 完了：主経路に影響なし

## Phase 3 2品アライン＋差分
- [ ] **T301** P0 1.5h `units.ts` 基準量換算（1日量／○錠中）＋テスト — 完了：テスト緑
- [ ] **T302** P0 2h `/api/compare` A/B `Promise.all`、Claude名寄せ、コードで差分行 — 完了：違う行のみ強調
- [ ] **T303** P0 0.5h SourceAccordion（値タップで原文引用・出典リンク） — 完了：全値に出典
- [ ] **T304** P0 0.5h 不確実値のグレー表示・差分除外 — 完了：低確信値が「添付文書で確認」

## Phase 4 指定濫用照合＋チェック＋記録
- [ ] **T401** P0 0.5h `abuse_ingredients.ts`（8成分、出典URL・日付） — 完了：定数＋テスト
- [ ] **T402** P0 1h 模擬手順書【仮】`mock_sop.md`→`sop_items` seed — 完了：項目が順番どおりDBに
- [ ] **T403** P0 2h `/api/rules` コード一次判定＋Claudeで手順書項目順・除外理由、個数→複数 — 完了：かぜ薬Bで対象・根拠成分表示
- [ ] **T404** P0 1h Checklist（判定ボタンなし）＋`/api/record` 販売記録作成支援（項目・時刻・担当仮名のみ） — 完了：記録行がDBに、PIIカラムなし

## Phase 5 棚
- [ ] **T501** P0 1h `mock_shelf.json`（架空1店舗）【仮】seed＋`/api/shelf`＋ShelfCard — 完了：A/Bの棚番・段表示

## Phase 6 禁止語ガード（本実装）
- [ ] **T601** P0 0.5h T601-minを拡充＋テスト — 完了：禁止語リスト網羅
- [ ] **T602** P0 1h Claude自己検査（因果表現）をguardに追加、ログ保存 — 完了：全API出力がguard経由（grepで確認）
- [ ] **T603** P0 0.5h 推薦ゼロ検査スクリプト（10組の出力を一括検査） — 完了：0件レポート

## Phase 7 Polish＋デモ
- [ ] **T701** P0 1h 模擬SKU10組で精度・秒数計測 — 完了：表にまとめる
- [ ] **T702** P1 1h Claudeなし版比較画面/ログ — 完了：差を示せる
- [ ] **T703** P0 1h 裏側ログビュー（A/Bサブエージェント・照合・ガード） — 完了：デモ130–155秒で見せられる
- [ ] **T704** P0 1.5h 180秒台本（prd §11）・動画 — 完了：書き出し済み
- [ ] **T705** P1 0.5h 禁止パターン目視チェック（rules §5） — 完了：全OK

## Phase 8 Deploy
- [ ] **T801** P0 0.5h Vercel本番、環境変数、簡易レート制限 — 完了：本番URLでスマホ/PC動作
- [ ] **T802** P0 0.5h README・提出物 — 完了：提出

## データ方針
- デモSKU：期間中に手動キュレートした**模擬原文**（模擬と明示・出典ラベル付き）。PMDAはリダイレクトURLでリンクアウトのみ（全文取得・再配布・クロールなし）。
- `data/` と zip はコミットしない（.gitignore）。
- `data/medicine_data_assets/` はローカル参照のみ（既存「Medicine Recommend System」由来・症状辞書含む）。リポに入れない（.gitignore）。使うのは master の JAN・品名・PMDA URL 参照のみ、症状辞書・推薦ロジックは使わない。

合計 P0 ≈ 27h。初日目標：Phase 0–2。
