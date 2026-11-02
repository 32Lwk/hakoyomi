# Tasks — ハコよみ（prd v2.0 → 提出 2026-11-08 20:00 JST）

改訂 2026-11-02（L-20261102-32）：開発目的の再定義に合わせて全面的に組み直し。v1.x のタスク（T101〜T802）は破棄。
凡例：P0＝提出に必須／P1＝P0 が動いてから順に／P2＝余力。見積はソロ実時間。Claude Code には「T0xx を prd.md / architecture.md / rules.md に従って実装して」と渡す。

## 各タスクのマージ前チェック
推薦系フィールドなし／順位付け・量順ソートなし／緑・赤の可否色なし／判定ボタンなし／`NEXT_PUBLIC_` にキーなし／商品固有の添付文書本文・PDF・製品画像がリポ・seed・画面にない／`data/` がリポに入っていない／Claude 出力が guard を通っている／入力文がログに残らない

## Day 0–1（11/2夜〜11/3）準備・調査・土台
- [ ] **T000** P0 0.5h 【ゆう】都道府県の薬務課に設計を確認（逆引き・バッジ・質問回答が医療機器プログラムや広告規制に当たらないか）。問い合わせ文は Claude が下書き — 完了：回答を memory.md に記録
- [ ] **T-R1** P0 0.5h 通知の権利確認：著作権法13条2号の条文（e-Gov）と厚労省サイトの利用規約を確認し prd §5 に出典を記録 — 完了：出典URLつきで prd Q3 クローズ
- [ ] **T-R2** P0 1h 対象の薬効群を決めて通知の出典を確定：使用上の注意（mhlw.go.jp/content/001742612.pdf）の該当ページ、承認基準の効能・効果（かぜ薬・解熱鎮痛薬・鎮咳去痰薬・鼻炎用内服薬、眠気防止薬は承認基準なし）— 完了：薬効群ごとに出典URL・ページを memory.md に
- [ ] **T-R3** P0 0.5h WADA 禁止表 2026年版（JADA 公開）から OTC に関わる成分を確認 — 完了：`doping_list.ts` の元表（成分・区分・年版・URL）
- [x] **T001** P0 公開リポ・Next.js 足場（2026-11-02 done、origin/main 04fe044）
- [x] **T002** P0 0.5h ESLint/Prettier/vitest、tsconfig strict、`"typecheck": "next typegen && tsc --noEmit"` — 完了：`npm run lint && npm run typecheck && npm test` 通過（2026-11-02 done。`npm run check` で lint・型・テスト・整形を一括。禁止語リスト `src/lib/guard/banwords.ts` と src 全体の禁止語スキャンテストを追加。vitest 5 の peer 要件で `@types/node` を ^24 に更新）
- [ ] **T003** P0 0.5h Supabase プロジェクト、migration（architecture §5、PIIカラムなし） — 完了：テーブル作成済み（2026-11-02：migration `supabase/migrations/20261102000000_init.sql` を作成。zod スキーマに合わせ、全表 RLS 有効、PII カラムなし・CHECK 値と zod の一致をテストで検査、Postgres で適用を確認。残り＝ゆうが Supabase プロジェクトを作って SQL Editor で適用、`.env.local` に SUPABASE_URL・SUPABASE_SERVICE_ROLE_KEY）
- [ ] **T004** P0 0.5h `.env.local`・Vercel 連携（空デプロイ） — 完了：Vercel URL が開く

## Day 1–2（11/3〜11/4）データと中核ロジック
- [x] **T101** P0 1.5h `scripts/notice`：通知PDF → テキスト → Claude で項目・本文・記載条件（条件式 JSON）に構造化 → zod 検証。対象は T-R2 の薬効群＋指定濫用防止（Ⅲ） — 完了：`notice_items` seed 案が出る（2026-11-02 done。`npm run notice:extract` → `npm run notice:structure`。対象＝かぜ薬Ⅰ・解熱鎮痛薬・鎮咳去痰薬・鼻炎用内服薬・眠気防止薬・指定濫用防止Ⅲの「添付文書等に記載すべき事項」、計140項目。本文・記載条件は原文と全件照合済み（離れた箇所をつないだものは指摘に出す）。下書き・検証用 `.review.md` は `data/notices/out/`（リポ外）。照合だけやり直すときは `-- --recheck`）
- [ ] **T102** P0 1h 【ゆう】T101 の出力を通知原文と照らして検証・修正 — 完了：検証済み seed
- [ ] **T103** P0 3h 【ゆう】デモ商品 20〜30品を入力（品名・メーカー・JAN・区分・薬効群・成分・分量・基準・内容量・PMDA URL・改訂日）。バッジの差が出る組み合わせを含める（抗ヒスタミンあり／なし、カフェイン量違い、8成分あり／なし、メチルエフェドリン等の禁止表成分）。Claude は候補の組み合わせを提案 — 完了：`products` / `product_facts` seed
- [ ] **T104** P0 0.5h 架空1店舗の棚マップ（売場ブロック・棚・段・列）と、デモ商品の棚位置 — 完了：`mock_store.json`・`shelf_locations` seed
- [ ] **T105** P0 2h（ロジックとテストは 2026-11-02 実装済み。かぜ薬の通知項目の抜粋と架空品で検証。残り＝T103 のデモ商品全件での照合） `noticeRules.ts`（条件式の評価）＋`badges.ts`（バッジ導出）＋`abuse.ts`（8成分・数量）＋`doping.ts`＋テスト — 完了：デモ商品全件で期待どおりのバッジ（ゆうが実物の添付文書で確認した結果とテストで一致）
- [x] **T106** P0 0.5h `banwords.ts`＋`guard()`（regex）＋`uiCopy.ts`＋テスト — 完了：禁止語入りの文を差し止めるテストが緑（2026-11-02 done）

## Day 2–3（11/4〜11/5）画面（P0）
- [x] **T201** P0 1.5h 画面の骨格：ヘッダの常時表示（JudgeNotice）、下部タブ（読む／比べる／さがす／棚）、中央の JAN ボタン、shadcn/ui 導入 — 完了：スマホ/PCで崩れない（2026-11-02 done。shadcn/ui（base-nova）導入、色は design.md トークンに置換、Noto Sans JP）
- [x] **T202** P0 1h `JanScanner`（@zxing/browser＋手入力＋品名検索） — 完了：スマホでJAN読取、PCで手入力・品名検索（2026-11-02 done。手入力・チェックデジット検証・未登録JAN・品名検索をブラウザで確認。カメラ読取は実機スマホで未確認）
- [x] **T203** P0 1.5h `/api/jan`＋ProductCard／BadgeRow／BadgeSheet（根拠・出典・PMDAリンク） — 完了：読取から3秒以内にバッジ、タップで根拠（2026-11-02 done。架空6品＋通知かぜ薬Ⅰ抜粋で動作。商品データは lib/catalog.ts 経由、T003 で Supabase に差し替え）
- [x] **T204** P0 1.5h `units.ts`＋`/api/compare`＋CompareTable（2〜4品、違う行だけ強調、バッジの差） — 完了：基準をそろえた差分が出る、並べ替えなし（2026-11-02 done。成分の行に加えバッジ・区分・1日最大量・内容量の差も表示）
- [x] **T205** P0 1h `/api/shelf`＋StoreMap／ShelfFront — 完了：選んだ商品（複数可）がマップと正面図でハイライト（2026-11-02 done。棚マップは src/data/mock_store.ts の暫定版、T104 で正式 seed）

## Day 4（11/6）Claude（P0）
- [ ] **T301** P0 3h 質問エージェント `/api/ask`：tool use（`get_product_facts` `get_applicable_notice_items` `search_notice_text` `check_abuse` `check_doping`）→ 出典ID＋抜き出しの配列 → `verifyCitations`（原文と完全一致しない文を捨てる）→ guard（regex＋Claude自己検査）→ AskBox／AnswerQuote（段階表示つき） — 完了：よくある質問10問で、全回答に出典、言い換えなし、根拠なしは「該当する記載が見つかりません」
- [ ] **T302** P0 2h 逆引き `/api/search`：自由入力 → Claude が効能・効果の語と成分条件に対応づけ（JSON）→ コードで絞り込み → 五十音順＋一致根拠 → guard。入力は保存しない — 完了：「鼻水」「眠くならないかぜ薬」「カフェインなし」で順位なしの一覧と根拠
- [ ] **T303** P0 0.5h Claude 自己検査の guard 追加、差し止めログ（出力側のみ） — 完了：全 API 出力が guard 経由（grep で確認）

## Day 5（11/7）P1・公開
- [ ] **T401** P1 2h 指定濫用防止の確認・記録（通知 第4-1(4) ア〜キの順、個数→複数、内容量→大容量）＋販売記録の下書き（Claude→guard） — 完了：記録行がDBに、PIIカラムなし、判定ボタンなし
- [ ] **T402** P1 1h 「相談すること」確認リスト＋困ったときの行き先（医療機関・#7119 等の一般案内） — 完了：商品ごとに通知の「相談すること」由来の確認項目が出る
- [ ] **T403** P1 1.5h ベテランの説明メモ（作成・表示、guard 経由） — 完了：メモが商品を読んだ画面に出る
- [ ] **T501** P0 0.5h Vercel 本番、環境変数、簡易レート制限 — 完了：本番URLでスマホ/PC動作

## Day 6（11/8 20:00 締切）仕上げ・提出
- [ ] **T601** P0 1h 推薦ゼロ検査（デモの全出力を禁止語＋目視で検査）、バッジ正答率、速度の計測 — 完了：結果の表
- [ ] **T602** P0 0.5h Claude なし版（キーワード検索だけ）との比較ログ — 完了：差を示せる
- [ ] **T603** P0 2h 3分の台本（prd §12）・動画収録・書き出し — 完了：YouTube/Loom にアップ
- [ ] **T604** P0 0.5h README（目的・対象・やらないこと・データ3層と出典・HITL）・プロジェクト概要・提出 — 完了：11/8 20:00 までに提出

## P2（余力）
- [ ] **T701** 箱写真OCR（JANが読めないときの補助）
- [ ] **T702** 音声での質問
- [ ] **T703** PC 2カラムの作り込み

合計 P0 ≈ 29h、P1 ≈ 4.5h。毎日の終わりに `main` をデプロイ可能に保つ。
