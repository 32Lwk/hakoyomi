# LEDGER

## Open

### L-20261102-38
- asked: 開発を続ける（ゆう 2026-11-02）→ T003 の migration を先に書く
- why: architecture §5 の表と、実装済みの zod スキーマ（src/lib/schema）・T101 の出力がずれている（notice_items の id が uuid、excluded_by・badge・needs_review がない、products に kind・route・efficacy_groups・crude_drug_main・1日最大量がない など）。seed（T102・T103）を zod の形のまま入れられるよう、DB を zod に合わせる
- target: supabase/migrations/20261102000000_init.sql、docs/architecture.md §5、src/lib/schema/schema.test.ts（PII カラムなしの検査）
- owner: Claude Code
- status: done（2026-11-02。Supabase プロジェクトの作成・migration の適用はゆう）
- proof: products・notice_items の id は text（kaze_1-ng-1-3 等）。全表 RLS 有効・ポリシーなし（service role のサーバーからのみ読む）。お客様の氏名・症状・健康情報・質問入力のカラムなしをテストで検査
- notes: 販売記録の下書き（T401）の表は T401 で足す

### L-20261102-38
- asked: 開発を続ける（ゆう 2026-11-02）→ T003 の migration を先に書く
- why: architecture §5 の表と、実装済みの zod スキーマ（src/lib/schema）・T101 の出力がずれている（notice_items の id が uuid、excluded_by・badge・needs_review がない、products に kind・route・efficacy_groups・crude_drug_main・1日最大量がない など）。seed（T102・T103）を zod の形のまま入れられるよう、DB を zod に合わせる
- target: supabase/migrations/20261102000000_init.sql、docs/architecture.md §5、src/lib/schema/schema.test.ts（PII カラムなしの検査）
- owner: Claude Code
- status: done（2026-11-02。Supabase プロジェクトの作成・migration の適用はゆう）
- proof: products・notice_items の id は text（kaze_1-ng-1-3 等）。全表 RLS 有効・ポリシーなし（service role のサーバーからのみ読む）。お客様の氏名・症状・健康情報・質問入力のカラムなしをテストで検査
- notes: 販売記録の下書き（T401）の表は T401 で足す

### L-20261102-37
- asked: 同じ形・同じ種類でも絶妙な違いを出したパッケージを複数つくる（ゆう 2026-11-02）
- why: 同じ種類・同じ形の商品が一覧や比較に並んでも見分けられるようにするため
- target: scripts/gen-illustrations.mjs、public/illustrations/{kind}-{pattern}-v2〜v5.svg（パッケージ6形×12種×4＝288点）、README.md、index.json、src/lib/illustration.ts
- owner: Claude Code
- status: done（2026-11-02）
- proof: v2 濃い色／v3 斜めストライプ／v4 ドット／v5 生成り（白地を薄い色に）。形とモチーフ・種類の色は同じ。xmllint 通過・一覧を目視確認
- notes: v1 は既存ファイル（{kind}-{pattern}.svg）のまま。L-33 と同じく新規作成の図形のみ・実在商品に似せない・「イメージ図」と明示

### L-20261102-36
- asked: パッケージのイラストをもっとさまざまに増やす（ゆう 2026-11-02）
- why: 商品カード・一覧のサムネイルは主にパッケージ型を使うため、同じ種類が並んでも見分けられる形を増やす
- target: scripts/gen-illustrations.mjs、public/illustrations/（12種×11パターン＝132点）、public/illustrations/README.md、src/lib/illustration.ts
- owner: Claude Code
- status: done（2026-11-02）
- proof: 追加パターン slim（縦長スリム箱）／square（正方形の箱・丸窓）／pouch（スタンドパウチ）／carton（フタの開いた箱から中身）。xmllint 通過・一覧を目視確認
- notes: L-33 と同じく Claude が新規作成した図形のみ（外部素材・AI画像生成なし）。実在商品のパッケージに似せない。「イメージ図」と明示する。既存パターンは変えない

### L-20261102-35
- asked: 同じ薬の種類でもイラストの種類を増やす（ゆう 2026-11-02）
- why: 同じ種類の商品が一覧・比較に並んだときに見分けやすくするため。L-33 の3パターンでは種類ごとに絵が1つずつしかない
- target: scripts/gen-illustrations.mjs、public/illustrations/（12種×7パターン＝84点）、public/illustrations/README.md、src/lib/illustration.ts（パターンの型）
- owner: Claude Code
- status: done（2026-11-02）
- proof: 追加パターン box2（横長の箱）／form2（別の剤形）／symbol2（別のモチーフ）／duo（剤形＋シンボル）。xmllint 通過・一覧を目視確認
- notes: L-33 と同じく Claude が新規作成した図形のみ（外部素材・AI画像生成なし）。実在商品のパッケージに似せない。「イメージ図」と明示する。既存3パターンのファイル名は変えない

### L-20261102-34
- asked: UIを分かりやすく（バッジを押せると分かる見た目、品名の下にパッケージ画像）／比較で商品を追加しやすく／棚を店舗らしく（ゆう 2026-11-02）
- why: T201〜T205 の画面を見たうえでの改善依頼
- target: src/components（product-card, badges, compare-view, shelf-view ほか）、src/lib/schema/product.ts（種類＝イラストの kind）、src/data/mock_store.ts
- owner: Claude Code
- status: done（2026-11-02）
- proof: feat/L34-ui-polish（商品カードのイメージ図・バッジのアイコンと「›」、比較の「商品を追加」シート、検索結果の「比べるに追加」、売場図とゴンドラ正面図）
- notes: パッケージ画像は実物の写真を使わず（権利・L-28）、L-33 の「薬の種類イメージ図」を「イメージ図」と明示して表示。比較への追加は品名順の候補一覧から（順位・おすすめなし）。棚はゴンドラ・エンド・通路・レジ・入口のある売場図と、値札レールつきの棚正面図に

### L-20261102-33
- asked: 薬の種類イラスト（12種×3パターン：パッケージ／剤形／シンボル）をSVGとしてリポジトリに書き出す（ゆう 2026-11-02）
- why: 製品写真は権利上使えないため（ガイド「権利を有しない素材は失格」・L-28 製品画像を持たない）。実商品の画像ではなく薬の種類のイメージ図として、一覧・比較・検索で目印に使う
- target: public/illustrations/{kind}-{pattern}.svg（36点）＋ public/illustrations/README.md、scripts/gen-illustrations.mjs
- owner: Claude Code
- status: done（2026-11-02）
- proof: public/illustrations/*.svg（36点・xmllint 通過・一覧を目視確認）、public/illustrations/index.json、public/illustrations/README.md、scripts/gen-illustrations.mjs
- notes: 会期中に Claude が新規作成した図形のみ（外部素材・AI画像生成なし）。実在商品のパッケージに似せない。画面では「イメージ図」と明示する。デザインの元はモックのキャンバス（MedArt 部品）

### L-20261102-32
- asked: 開発目的の再定義を正本にする（ゆう 2026-11-02）。「誰が接客しても同じ水準の説明」を目的に、JAN読取→添付文書情報を手元に表示／2品の差分を瞬時に表示（バッジでビジュアライズ）／RAGで添付文書から詳細・正確に回答／逆引き・成分検索／ドーピング・眠気成分の有無に即答
- why: 現行設計のモックが現場で使いづらく役に立たない、との評価（ゆう）。起点を「禁止事項の回避」から「説明水準のばらつき＝現場ペイン」に戻す
- target: docs/prd.md §1–3・§5・§9, design.md, rules.md, tasks.md, memory.md, CLAUDE.md
- owner: Claude Code → ゆう（不明点は推奨＋理由つきで質問し、回答後に反映）
- status: done（docs 反映済み 2026-11-02）
- proof: docs/prd.md v2.0, rules.md, design.md, DESIGN-project.md, architecture.md v2.0, tasks.md, memory.md, PROJECT.md, ../CLAUDE.md
- notes: 既存ルールと衝突しうる点＝①添付文書の表示・RAG（PMDA規約：無断複製・転載・頒布禁止、クロール禁止、L-28 のリンクアウト方針）②「症状」を聞かれた際の扱い（Hard Ban：症状入力）③逆引き検索が推奨に見えないか（岡本注意③）④ドーピング判定の出典（添付文書にない。JADA等の別出典が要る）。回答で確定してから prd 等を改訂
- 回答（2026-11-02 ゆう）：①公開デモの本文は自作の模擬文書（本番は店内利用想定で実文書）※その後「実商品に全て切り替えたい」→権利整理を再質問中 ②RAG回答は該当欄の抜き出し＋出典（要約・言い換えなし）③逆引きは効能・効果の語で探す・**自由入力**（運営には問題ないことを確認済み、行政＝薬務課の確認を先に入れる）④ドーピングはWADA禁止表（JADA公開・年版つき）の成分照合、「使ってよい」とは言わない ⑤MVP＝JAN→添付文書情報＋バッジ／**複数品**比較／RAG回答／逆引き・成分検索／棚の位置を分かりやすく表示
- 参加者ガイド確認で判明：提出締切は **11/8（日）20:00 JST**（11/10 は最終審査）。作成禁止例に「基本的なRAGアプリケーション」「医療アドバイスを行うAI」。権利のないデータ・素材の使用は失格。既存プロジェクトの再利用不可。審査＝インパクト30／デモ25／Claude活用25／深さと実行20
- 回答2（2026-11-02 ゆう）：⑥デモは**実商品**。文面は厚労省の公的通知（承認基準・使用上の注意の記載要領等、著作権法13条で権利の対象外【要確認】）を成分・薬効分類で商品に紐づけ、商品固有の文面はPMDAリンク ⑦medicine_data_assets は使わず、デモ商品は会期中に手で作る ⑧Claudeは役割分担のエージェント（検索→成分照合→出典検証→ガード、tool use） ⑨追加＝ベテランの説明メモ共有／指定濫用防止の確認・記録／「相談すること」確認リスト＋困ったときの行き先、旧計画の販売記録支援・棚番・出典明示・HITL常時表示も継続 ⑩「原文引用」は公的通知の文面で行い、実商品の添付文書本文は公開デモで複製しない（失格条件「権利のないデータ」回避）
- 調査（2026-11-02）：厚労省「かぜ薬等の添付文書等に記載する使用上の注意について」https://www.mhlw.go.jp/content/001742612.pdf（195頁、承認基準あり16薬効群・なし20薬効群・指定濫用防止）。各項目に「〔○○を含有する製剤に記載すること〕」の記載条件があり、成分事実からバッジ・注意事項をコードで導出できる。v1.x タスク（T101〜T802）は破棄し tasks.md を11/8締切の日程で再編
- 次：T000（薬務課確認、問い合わせ文は Claude が下書き）、T-R1（13条の条文と厚労省サイト利用規約）、T-R2、T-R3、T002

### L-20261102-31
- asked: デモSKU候補の提案（JAN特定済み97件から、8成分あり／なし・基準表記違いの対比が作れる組）
- why: L-28 ⑨
- target: docs/tasks.md T202′ の seed 対象
- owner: Claude Code → ゆう（手元の箱で絞る）
- status: open
- proof:
- notes: 分量はPMDAで1件ずつ手確認

### L-20261102-30
- asked: BWC 提出締切・提出物要件・審査基準を公式ページで調査（prd Q5）
- why: P0/P1 の配分を決めるため（ユーザー回答）
- target: docs/PROJECT.md, docs/tasks.md
- owner: Claude Code → ゆう（Discord／キックオフ内容を共有）
- status: open（公開情報は反映済み）
- proof: https://cerebralvalley.ai/e/built-with-claude-japan2026（会期 11/2 12:00〜11/10 14:00 JST、チーム2名まで、審査員は近日発表）
- notes: 提出物（動画尺・リポ・URL）・審査基準は公開ページに記載なし。ゆうが参加者向け情報を貼る（ユーザー回答）

## Done

### L-20261102-29
- asked: 指定濫用防止医薬品の対象成分・施行日・大容量の定義を厚労省の告示・通知原文で調査（memory Glossary、prd Q4、T401）
- why: デモの核。根拠URL・日付つきで固定するため（ユーザー回答：Claude調査→ゆう確認）
- target: docs/memory.md, docs/prd.md Q4, docs/tasks.md T401
- owner: Claude Code → ゆう確認
- status: done（ゆう確認済み 2026-11-02）
- proof: 令和8年2月13日 医薬発0213第1号（告示第32号）・医薬発0213第2号（告示第33号）・令和7年12月26日 医薬発1226第16号（いずれも原文PDFを読んで確認。掲載元 https://www.pref.toyama.jp/1208/kusuri/20260501.html）。docs/memory.md Glossary、prd M4/M5/Q3/Q4、tasks T401–T403、architecture products
- notes: ユーザー決定：①確定して反映 ②生薬主体は seed に手で印を付け対象外表示 ③A/B同一指定成分は「複数個に該当」を根拠つきで表示（判定なし）④小容量／大容量は開発時にゆうが判定して seed ⑤模擬手順書の確認項目は通知ア〜キをそのまま使う（JACDS風は廃止）。厚労省ウェブマガジンは6成分のままの記載があるため参照しない

### L-20261102-28
- asked: docs の食い違いを修正（Claude Code 全体確認の指摘 1〜8）＋実商品データ方針への転換
- why: ユーザー指示「docsを直す」「改善点・方針は推奨と理由つき選択肢で質問」（2026-11-02、Mac の Claude Code。全項目を AskUserQuestion で確認）
- target: hakoyomi/docs/*.md、hakoyomi/README.md、hakoyomi/src/app/{page,layout}.tsx（名称）、ルート CLAUDE.md / README.md / CLAUDE_PROJECT.txt
- owner: ゆう（Mac の Claude Code）
- status: done
- proof: hakoyomi main（このエントリを含むコミット）
- notes: 決定（すべてユーザー回答）——
  ①デモは**実商品**。画面に出すのは事実（品名・メーカー・JAN・リスク区分・成分名・分量・基準量・内容量）のみ。添付文書の文言（効能・してはいけないこと等）は画面に出さず PMDA へリンクアウト（Q8）。模擬原文は作らない
  ②事実の構造化は**開発時**：ゆうが PMDA の添付文書を1件ずつ開き（一括DLなし）、ローカルで Claude に事実だけ抽出させ、ゆうが検証して seed 化。文書ファイル・文言はリポに入れない。実行時の Claude は名寄せ・販売記録下書き・自己検査。換算・差分・8成分判定・手順書順はコード
  ③M3 は「欄名＋添付文書改訂日＋出典＋PMDAリンク」。要約・見出し生成はしない
  ④ガードの対象は Claude 生成文。seed の事実はコードが表示
  ⑤master の使用列を拡大：品名・メーカー・JAN・分類・成分名・PMDA URL。分量等はPMDAで手確認。効能文・用法・画像URL・症状辞書・safety・clinical は使わない
  ⑥製品画像は取得・保管しない。Supabase Storage・写真TTLを削除。JAN はデコード結果のみ使いフレームは保存しない
  ⑦design.md を JAN 主経路に全面改訂
  ⑧実名をそのまま表示（Q2 クローズ）
  ⑨デモSKU：JAN特定済み97件から Claude が候補提案→ゆうが手元の箱で絞る
  ⑩作品名表記は「ハコよみ」に統一（最終名は Q7）
  ⑪docs 正本は hakoyomi/docs/ に一本化。ルート docs/ は docs_backup_20261102.zip に退避して削除
  ⑫細部：LEDGER の ID 重複解消（Open 側旧-21→-26、旧-22→-27）と Open/Done 整理、T001 チェック、T002 に typecheck、architecture の JAN 行・env 整理、skills-stack に Mac 注記
  ⑬反映は main 直コミット＋push（ユーザー指示）

### L-20261102-27（旧 Open 側 L-20261102-22。ID 重複のため改番）
- asked: T001 の GitHub 公開（Mac で node_modules 入れ直し → gh repo create 32Lwk/hakoyomi --public --push）
- why: T001 完了条件（公開リポ）
- target: GitHub 32Lwk/hakoyomi
- owner: ハッカソン / ゆう
- status: done
- proof: origin/main = 04fe044（git ls-remote で確認 2026-11-02）
- notes: 履歴 rewrite / force-push なし。data/・*.zip・.env* は非公開（git ls-files で確認）

### L-20261102-26（旧 Open 側 L-20261102-21。ID 重複のため改番）
- asked: T001 着手（公開リポ足場：/Users/yuto/ハコよみ/hakoyomi/ に Next.js、docs コピー、data は除外）
- why: tasks.md Phase 0 初日目標
- target: hakoyomi/（GitHub 32Lwk/hakoyomi public）
- owner: ハッカソン / ゆう
- status: done
- proof: hakoyomi/ main 04fe044（T001: scaffold Next.js app）。npm run build・lint 通過、localhost:3000 で 200・常時表示を確認、origin へ push 済み
- notes: shadcn は T101。data/・*.zip・.env* は gitignore（.env.example は追跡）。T002 以降は未着手

### L-20261102-20
- asked: Discord医療アドバイス回答を設計と照合して台帳・prd・PROJECT・memory更新
- why: 失格リスク解消の記録
- target: LEDGER.md, PROJECT.md, prd.md §8/§10, memory.md
- owner: ハッカソン
- status: done
- proof: /home/box/agent-data/projects/bwc-japan-2026/LEDGER.md, /home/box/agent-data/projects/bwc-japan-2026/PROJECT.md, /workspace/contests/bwc_japan_2026/docs/prd.md, /workspace/contests/bwc_japan_2026/docs/memory.md
- notes: 個別承認ではない。Won't・禁止語は弱めない

### L-20261102-19
- asked: キックオフ成果物をチャット送付＋必要スキルをGitHubリンク付きmarkdownでまとめる
- why: voice call終了後の依頼
- target: /workspace/contests/bwc_japan_2026/docs/skills-stack.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/skills-stack.md
- notes: FE/BE/Claude/プレゼン/動画/Playwright/画面収録・既存Grok Bot skillsも含む

### L-20261102-02
- asked: 公開リポ構成（医療アドバイス禁止・新規のみ）を満たす設計
- why: 公式ルール
- target: GitHub 32Lwk/hakoyomi（未作成）
- owner: ハッカソン
- status: done
- proof: n/a
- notes: architecture/rules は docs にあり。repo 作成は tasks T001

### L-20261102-04
- asked: Discord「医療アドバイスAI」禁止範囲の返事待ち／方針更新
- why: 失格リスク
- target: /workspace/contests/bwc_japan_2026/docs/prd.md §8, memory.md
- owner: ゆう / ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md §8
- notes: 2026-11-02回答。Kai(Cerebral Valley)：HITL原則がないものが禁止事例。OTCを扱うこと自体ではなく、事実確認困難・人間を除いて責任追及できないサービスが問題。該当しなければルール上OK。岡本(小児科医アドバイザー)注意6点：個人の病気を判断させない／診断できると宣伝しない／薬・商品を推さない／最終判断は資格者(HITL)／健康情報は慎重・作例のみ・勤務先資料無断使用禁止／根拠と困ったときの行き先を示す。結論：現行設計(推薦ゼロ・HITL・診断なし・PII不保持・出典表示)でルール上OK。ルール範囲の一般回答であり個別作品の承認ではない。Won't厚め維持

### L-20261102-05
- asked: 実装キックオフ Phase 0–2（repo・モックUI・単箱抽出）
- why: tasks.md 初日目標
- target: /workspace/contests/bwc_japan_2026/docs/tasks.md
- owner: ハッカソン / ゆう
- status: done
- proof: n/a
- notes:

### L-20261102-18
- asked: prd §11 Demo Story を JAN主経路に合わせて書き換え
- why: voice review（After・裏側・棚番）
- target: /workspace/contests/bwc_japan_2026/docs/prd.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md
- notes: 0–40・90–130・推薦ゼロ締め・動画注意は維持


### L-20261102-17
- asked: prd §10 に Q8/Q9 追記、PMDA公開データを取得元として明記
- why: voice review（JAN主経路の未決穴）
- target: /workspace/contests/bwc_japan_2026/docs/prd.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md
- notes: Q1–Q7維持。医薬品情報の取得元はPMDA公開データ【仮】


### L-20261102-16
- asked: prd §7 Success Metrics を JAN主経路に合わせて書き換え
- why: voice review（一致率・Claudeなし比較の言い換え、棚/アコーディオン/不確実KPI追加）
- target: /workspace/contests/bwc_japan_2026/docs/prd.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md
- notes: 推薦ゼロ・15秒・濫用一致・現場用KPIは維持


### L-20261102-15
- asked: prd §6 User Stories を JAN主経路の接客フローに書き換え
- why: voice review
- target: /workspace/contests/bwc_japan_2026/docs/prd.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md
- notes: 接客ストーリーは definition 21:40 を参照。UI生成画像の再特定はせず流れを文章化


### L-20261102-14
- asked: prd §3 G1 の「原文」を JAN由来添付文書の文言引用に差し替え
- why: voice / §5整合
- target: /workspace/contests/bwc_japan_2026/docs/prd.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md
- notes: 他要素不変。再生成ではないは維持


### L-20261102-13
- asked: prd §3 G1 の「箱の数値」を JAN→添付文書・製品情報の数値に差し替え
- why: voice / §5整合
- target: /workspace/contests/bwc_japan_2026/docs/prd.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md
- notes: G2–G6・Non-goals 不変


### L-20261102-12
- asked: prd §1 と architecture.md を §5 JAN主経路に追随
- why: voice review
- target: /workspace/contests/bwc_japan_2026/docs/prd.md ; /workspace/contests/bwc_japan_2026/docs/architecture.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/architecture.md
- notes: 一言定義とこれではないは不変。箱OCRは補助


### L-20261102-11
- asked: prd §5 をJAN起点・アコーディオン原文・棚を肝に書き換え（箱OCR主線から変更）
- why: voice review — 方針転換
- target: /workspace/contests/bwc_japan_2026/docs/prd.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md
- notes: AI推薦は出さない。M7は登販が選んだ後の棚案内。architecture等は未追随【要更新】


### L-20261102-10
- asked: prd §4 Target Users の括弧を「特に列とレジが同時の現場・経験の浅い登販」に差し替え
- why: voice review / §2整合
- target: /workspace/contests/bwc_japan_2026/docs/prd.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md
- notes:


### L-20261102-09
- asked: prd §3 G1「同じ材料」を箱の数値・原文・手順書確認項目の具体定義に更新
- why: voice review
- target: /workspace/contests/bwc_japan_2026/docs/prd.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md
- notes: 箱表示起点。添付文書の再生成ではない旨を明記


### L-20261102-08
- asked: prd §3 Goals を §1§2 から全面書き換え
- why: voice review
- target: /workspace/contests/bwc_japan_2026/docs/prd.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md
- notes:


### L-20261102-07
- asked: prd §2 問題3に「あなたにしかない深さ」「本来誰にでも届くべきもの」を追記
- why: voice review
- target: /workspace/contests/bwc_japan_2026/docs/prd.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md
- notes:


### L-20261102-06
- asked: prd.md §2 人手不足の法的誤解を除去し、指定濫用の痛い瞬間を厚くする（BWC出発点と整合）
- why: voice review
- target: /workspace/contests/bwc_japan_2026/docs/prd.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md
- notes: Problem1 unchanged. Problem2/3 rewritten.


### L-20261102-03
- asked: prd.md §1 一言定義・これではないを音声レビューで更新
- why: オーナー指示（voice）
- target: /workspace/contests/bwc_japan_2026/docs/prd.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md
- notes: 一言定義＝説明の質を揃える。これではないから添付文書閲覧・道場を削除

### L-20261102-01
- asked: ハコヨミ本線の確定とキックオフdocs（prd/architecture/rules/design/tasks/memory）
- why: BWC題材・明日開始可能に
- target: /workspace/contests/bwc_japan_2026/docs/
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md
- notes: Instagram vibe-coding 6ファイル枠。定義は hakoyomi_definition_20261101.md

### L-20261102-00
- asked: プロジェクト台帳を新設
- why: 全部移設
- target: /home/box/agent-data/projects/bwc-japan-2026/
- owner: おしゃべり
- status: done
- proof: /home/box/agent-data/projects/bwc-japan-2026/PROJECT.md
- notes:

### L-20261102-21
- asked: PMDA/公式サイト利用可否を規約照合
- why: データ取得元の適法性確認（t209u）
- target: /workspace/contests/bwc_japan_2026/docs/
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/prd.md Q8
- notes: 添付文書は製販著作権・所属薬局等内部使用以外の無断複製/転載/頒布禁止、自動クロール禁止。PDL1.0は添付文書に非適用。GTIN/JANリダイレクトURLでのリンクは許可不要。メーカー公式は各社規約。公開デモは例外非該当。→リンクアウト＋模擬/手動キュレートデモSKU＋出典表示、全文再配布なし

### L-20261102-22
- asked: Discordで固めた設計ルールをPROJECT/DESIGN/prd/rules/memoryへ昇格
- why: ユーザー指示「いただいた貴重なルールを書き加えてください」（t213u）
- target: PROJECT.md, DESIGN.md, /workspace/contests/bwc_japan_2026/docs/{prd,rules,memory}.md
- owner: ハッカソン
- status: done
- proof: PROJECT.md, DESIGN.md, /workspace/contests/bwc_japan_2026/docs/prd.md(§5 M8, §6 US5, §8), rules.md(§4.5), memory.md(Decisions Log)
- notes:

### L-20261102-23
- asked: Claude指摘4点修正＋tasks.md を JAN主経路に改訂
- why: Claudeレビュー結果とPhase0–2計画をユーザー承認（t219u）
- target: docs/tasks.md, hakoyomi-claude-pack/{CLAUDE.md,README.md,docs/}, memory.md, prd.md
- owner: ハッカソン
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/tasks.md, /workspace/hakoyomi-claude-pack/CLAUDE.md
- notes: ①Phase1–2をJAN主・箱OCR補助へ ②正本は docs/design.md（UI）＋docs/DESIGN-project.md（Do/Don't）、DESIGN.mdは参照しない ③medicine_data_assets はローカルのみ・gitignore ④git化はT001で実施

### L-20261102-24
- asked: T001 scaffold（Next.js足場・docsコピー・.gitignore・.env.example・最小page・README）
- why: Phase 0 最初の1手（t219u）
- target: Mac「ハコよみ」/hakoyomi/ → GitHub 32Lwk/hakoyomi（public）
- owner: ゆう（Mac の Claude Code で実施。Grok BotはGitHubを触らない）
- status: done
- proof: L-20261102-26 / -27（origin/main 04fe044）
- notes: 公開リポ作成済み。data/・zip・.env* はコミットしない。.env.example に CLAUDE_MODEL_GUARD 追加（L-25）

### L-20261102-25
- asked: 確定計画のdocs反映（JAN主経路／@zxing/browser／shadcn@T101／design.md正本／data除外／T001はClaude Code）
- why: 選択肢すべて推奨案で確定・ユーザー承認（t228u/t229u）
- target: docs/tasks.md, docs/architecture.md, docs/memory.md, hakoyomi-claude-pack/{CLAUDE.md,docs/}
- owner: ハッカソン（docsのみ。GitHub・コード足場は触らない）
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/tasks.md, /workspace/contests/bwc_japan_2026/docs/architecture.md, /workspace/contests/bwc_japan_2026/docs/memory.md, /workspace/hakoyomi-claude-pack/CLAUDE.md, /workspace/hakoyomi-docs-sync.tgz
- notes: デモデータ=手動キュレートの模擬原文（出典ラベル付き）＋PMDAリンクアウトのみ。Supabase T003はPhase 0。T601-minをPhase 2に前倒し。.env.example に CLAUDE_MODEL_GUARD（NEXT_PUBLIC_禁止）
