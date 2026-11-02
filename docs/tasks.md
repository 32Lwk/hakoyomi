# Tasks — ハコよみ（キックオフ 2026-11-02 12:00 JST → MVP）

凡例：P0＝デモに必須／P1＝余力。見積はソロ実時間。Claude Code には「T0xx を prd.md / architecture.md / rules.md に従って実装して」と渡す。
**主経路は JAN（バーコード／手入力／品名検索）。箱写真OCRは補助（P1以降）。**（改訂 2026-11-02, L-20261102-23）
**デモは実商品の事実データ＋PMDAリンクアウト。添付文書の文言・製品画像は持たない。事実の抽出は開発時（Claude抽出→ゆう検証）。**（改訂 2026-11-02, L-20261102-28）

## 各Phaseのマージ前チェック
推薦系フィールドなし／症状入力欄なし／緑・赤の可否色なし／判定ボタンなし／`NEXT_PUBLIC_` にキーなし／添付文書の文言・PDF・製品画像がリポ・seed・画面にない／`data/` がリポに入っていない

## Phase 0 Setup
- [x] **T001** P0 0.5h 【担当：ゆう／Mac の Claude Code】「ハコよみ」フォルダ内に `hakoyomi/` を新規作成し公開リポ（GitHub 32Lwk/hakoyomi）、create-next-app（TS/Tailwind/App Router/src、`@/*`）、docsコピー、`.gitignore`（`data/`・`*.zip`・`.env*`、`.env.example`は残す）、`.env.example`（ANTHROPIC_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / CLAUDE_MODEL / CLAUDE_MODEL_GUARD、NEXT_PUBLIC_禁止）、最小page（作品名【仮】＋「判断は販売者が行ってください」）、README（対象／やらないこと／データ方針／HITL） — 完了：localhost表示・build通過・docsあり・dataなし（2026-11-02 done、origin/main 04fe044）
- [ ] **T002** P0 0.5h ESLint/Prettier/vitest、tsconfig strict、禁止語テスト雛形、`"typecheck": "next typegen && tsc --noEmit"`（tsc 単体だと `LayoutProps` 未定義で落ちるため） — 完了：`npm run lint && npm run typecheck && npm test` 通過
- [ ] **T003** P0 0.5h Supabaseプロジェクト、migration（architecture §5、PIIカラムなし） — 完了：テーブル作成済み
- [ ] **T004** P0 0.5h `.env.local`・Vercel連携（空デプロイ） — 完了：Vercel URLが開く

## Phase 1 静的モックUI（固定JSON）
- [ ] **T101** P0 2h 単一縦画面レイアウト（design §2）、shadcn/ui をここで導入（色は design.md トークン）、固定JSONで DiffTable / SourceAccordion / AbuseBanner / Checklist / ShelfCard — 完了：スマホ/PCで崩れない
- [ ] **T102** P0 0.5h `uiCopy.ts` ホワイトリスト＋`JudgeNotice`（「判断は販売者が行ってください」常時表示） — 完了：画面文言が全てホワイトリスト由来
- [ ] **T103′** P0 1h `JanCapture`（@zxing/browser でカメラJAN読取＋手入力＋品名検索）※旧CaptureBarを置換 — 完了：スマホでJAN読取、PCで手入力・品名検索

## Phase 2 JAN→構造化（旧「単箱抽出」を置換）
- [ ] **T201′** P0 1h `schema/product.ts`（zod。推薦欄なし・文言欄なし、項目ごとに出典欄名・添付文書改訂日・PMDA URL・uncertain・verified_by） — 完了：型生成
- [ ] **T202′** P0 1.5h デモSKU選定（JAN特定済み97件から Claude が候補提案→ゆうが手元の箱で絞る。8成分あり／なし・基準表記違いの対比を含む10組、L-20261102-31）＋`catalog/janLookup.ts`（seed 参照＋PMDA GTIN/JANリダイレクトURL＝リンクアウト専用、コード定数） — 完了：デモJANで製品と出典URLが返る
- [ ] **T203′** P0 2h `scripts/extract`（開発時・ローカルのみ）：ゆうが1件ずつ開いた添付文書から Claude tool use で事実だけ抽出 → zod検証 → ゆうが検証 → seed。入力文書は `data/`（非コミット）、出力に文言を含めない。`/api/jan` は seed を返す — 完了：デモSKUの成分・分量・基準量・内容量・区分・出典がJANで返り、文言がどこにも無い
- [ ] **T601-min** P0 0.5h（前倒し）`banwords.ts`＋最小 regex `guard()`。rules §4-2「Claude出力は必ずguard経由」をPhase 2から守る — 完了：禁止語入り文字列を差し止めるテスト緑
- [ ] **T204** P1 0.5h（廃止）実行時取得をしないためキャッシュ不要。`product_facts` seed で代替（L-20261102-28）
- [ ] **T205** P1 1h（補助）箱写真OCR：JAN読めない時のみ品名候補を出す — 完了：主経路に影響なし

## Phase 3 2品アライン＋差分
- [ ] **T301** P0 1.5h `units.ts` 基準量換算（1日量／○錠中）＋テスト — 完了：テスト緑
- [ ] **T302** P0 2h `/api/compare` A/B、Claude名寄せ（実行時）、コードで換算・差分行 → guard — 完了：違う行のみ強調
- [ ] **T303** P0 0.5h SourceAccordion（欄名・添付文書改訂日・PMDAリンク。文言・要約は出さない）＋値タップで出典表示 — 完了：全値に出典、文言が画面に無い
- [ ] **T304** P0 0.5h 不確実値のグレー表示・差分除外 — 完了：低確信値が「添付文書で確認」

## Phase 4 指定濫用照合＋チェック＋記録
- [ ] **T401** P0 0.5h `abuse_ingredients.ts`（8成分＋水和物・塩類、外用剤除外、成分ごとの日数＝5日／7日の条件。出典＝告示第32号・第33号と適用通知、memory.md Glossary） — 完了：定数＋テスト（8成分一致、生薬主体フラグで対象外、同一成分2品で複数個）、出典URLあり
- [ ] **T402** P0 1h 模擬手順書 `mock_sop.md`（確認項目＝医薬発1226第16号 第4-1(4) ア〜キ、各項目に出典）→`sop_items` seed — 完了：項目が順番どおりDBに
- [ ] **T403** P0 2h `/api/rules` 対象成分照合（コード、生薬主体は対象外）＋seed の小容量／大容量と根拠を表示＋A/B同一指定成分なら複数個に該当と表示＋手順書項目を `order_no` 順（コード）、個数→複数個 — 完了：対象成分を含むデモSKUで対象・根拠成分表示、判定ボタンなし
- [ ] **T404** P0 1h Checklist（判定ボタンなし）＋`/api/record` 販売記録作成支援（Claudeで下書き→guard。保存は項目・時刻・担当仮名のみ） — 完了：記録行がDBに、PIIカラムなし

## Phase 5 棚
- [ ] **T501** P0 1h `mock_shelf.json`（架空1店舗）【仮】seed＋`/api/shelf`＋ShelfCard — 完了：A/Bの棚番・段表示

## Phase 6 禁止語ガード（本実装）
- [ ] **T601** P0 0.5h T601-minを拡充＋テスト — 完了：禁止語リスト網羅
- [ ] **T602** P0 1h Claude自己検査（因果表現）をguardに追加、ログ保存 — 完了：全API出力がguard経由（grepで確認）
- [ ] **T603** P0 0.5h 推薦ゼロ検査スクリプト（10組の出力を一括検査） — 完了：0件レポート

## Phase 7 Polish＋デモ
- [ ] **T701** P0 1h デモSKU10組で抽出精度（Claude抽出 vs ゆう検証値）・秒数計測 — 完了：表にまとめる
- [ ] **T702** P1 1h Claudeなし版（master単独＝分量なし）比較画面/ログ — 完了：差を示せる
- [ ] **T703** P0 1h 裏側ログビュー（A/Bサブエージェント・照合・ガード） — 完了：デモ130–155秒で見せられる
- [ ] **T704** P0 1.5h 180秒台本（prd §11）・動画 — 完了：書き出し済み
- [ ] **T705** P1 0.5h 禁止パターン目視チェック（rules §5） — 完了：全OK

## Phase 8 Deploy
- [ ] **T801** P0 0.5h Vercel本番、環境変数、簡易レート制限 — 完了：本番URLでスマホ/PC動作
- [ ] **T802** P0 0.5h README・提出物 — 完了：提出

## データ方針（改訂 2026-11-02, L-20261102-28）
- デモSKU：**実商品**（実名表示）。画面・seed・リポに載せるのは事実（品名・メーカー・JAN・リスク区分・成分名・分量・基準量・内容量）と出典（PMDA URL・欄名・添付文書改訂日）のみ。
- 事実は開発時に、ゆうがPMDAの添付文書を1件ずつ開き、ローカルで Claude に抽出させ、ゆうが検証して seed 化。一括DL・クロール・実行時の自動取得はしない。
- 添付文書の文言・PDF・製品画像はリポ・DB・公開URL・動画に載せない（文言は PMDA リンクアウトで登販が確認）。
- `data/` と zip はコミットしない（.gitignore）。
- `data/medicine_data_assets/` はローカル参照のみ（既存「Medicine Recommend System」由来・症状辞書含む）。使う列は master の品名・メーカー・JAN・分類・成分名・PMDA URL。効能文・用法・画像URL・症状辞書・safety・clinical・推薦ロジックは使わない。master は古い可能性があるため、分量等は最新の添付文書で確認する。
- 客・担当者・手順書・棚は模擬。

合計 P0 ≈ 27h。初日目標：Phase 0–2。
