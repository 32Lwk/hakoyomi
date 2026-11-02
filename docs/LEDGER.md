# LEDGER

## Open

### L-20261102-21
- asked: T001 着手（公開リポ足場：/Users/yuto/ハコよみ/hakoyomi/ に Next.js、docs コピー、data は除外）
- why: tasks.md Phase 0 初日目標
- target: hakoyomi/（GitHub 32Lwk/hakoyomi public）
- owner: ハッカソン / ゆう
- status: in-progress
- proof: n/a
- notes: shadcn は T101。data/・*.zip・.env* は gitignore。T002 以降は未着手

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

## Done

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
- status: open
- proof:
- notes: 公開リポ作成待ち。data/・zip・.env* はコミットしない。.env.example に CLAUDE_MODEL_GUARD 追加（L-25）

### L-20261102-25
- asked: 確定計画のdocs反映（JAN主経路／@zxing/browser／shadcn@T101／design.md正本／data除外／T001はClaude Code）
- why: 選択肢すべて推奨案で確定・ユーザー承認（t228u/t229u）
- target: docs/tasks.md, docs/architecture.md, docs/memory.md, hakoyomi-claude-pack/{CLAUDE.md,docs/}
- owner: ハッカソン（docsのみ。GitHub・コード足場は触らない）
- status: done
- proof: /workspace/contests/bwc_japan_2026/docs/tasks.md, /workspace/contests/bwc_japan_2026/docs/architecture.md, /workspace/contests/bwc_japan_2026/docs/memory.md, /workspace/hakoyomi-claude-pack/CLAUDE.md, /workspace/hakoyomi-docs-sync.tgz
- notes: デモデータ=手動キュレートの模擬原文（出典ラベル付き）＋PMDAリンクアウトのみ。Supabase T003はPhase 0。T601-minをPhase 2に前倒し。.env.example に CLAUDE_MODEL_GUARD（NEXT_PUBLIC_禁止）
