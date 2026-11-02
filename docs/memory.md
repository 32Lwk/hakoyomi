# Memory — ハコよみ プロジェクト文脈（AIツール用・随時更新）

## Who / Why / Contest
- ゆう（川嶋宥翔）、ソロ、ドラッグストア勤務の登録販売者、GitHub 32Lwk
- 現場の課題感（箱の読み方と知識で答えが人により違う／一人勤務／濫用防止確認の漏れ）から作る
- Built with Claude Japan 2026、キックオフ 2026-11-02 12:00 JST

## Decisions Log
| 日付(JST) | 決定 |
|---|---|
| 2026-11-01 | 定義確定：箱起点・推薦なし（hakoyomi_definition_20261101.md）。旧PRD破棄 |
| 2026-11-01 | Discordで禁止範囲を質問 |
| 2026-11-02 | Discord回答：Kai「HITLなしが禁止、OTC取扱い自体は問題でない」＋岡本注意6点。現行設計でルール上OK（個別承認ではない）。Won't厚め維持 |
| 2026-11-02 | PMDA規約確認：添付文書は製販著作権・無断複製転載禁止（所属薬局等の内部使用のみ例外、公開デモは非該当）、クロール禁止。方針＝PMDAリダイレクト/リンクアウト＋模擬/手動キュレートのデモSKU＋出典常時表示、全文再配布なし（prd.md Q8） |
| 2026-11-02 | Discord #質問へ確定設計を共有（想定=登販のみ／やること・やらないこと／データ=PMDA＋製品公式／SaMD該当性は薬務課にも確認方針）。販売記録作成支援をMust(M8)に追加。ルールをPROJECT/DESIGN/prd/rules/memoryへ昇格。個別承認ではない |
| 2026-11-02 | 作品名 ハコヨミ【仮】、ソロ、デモはスマホ＋PC両方、模擬手順書【仮】、棚番Must（架空1店舗【仮】）、Claude API＋Claude Code、認証なし、カメラ＋アップロード、Next.js、Supabase＋Vercel、デモ箱は「かぜ薬A／B」【仮】、動画はClaude側生成主体・読み上げは必要時ゆう |
| 2026-11-02 | tasks.md をJAN主経路に改訂（箱OCRは補助）。medicine_data_assets はリポに入れない（gitignore・ローカルのみ）。正本DESIGNは design.md＋DESIGN-project.md |
| 2026-11-02 | 確定計画（全て推奨案）：JAN読取=@zxing/browser＋手入力／shadcn/uiはT101導入／design.md正本・DESIGN-project.md補足／デモ=手動キュレート模擬原文＋PMDAリンクアウト／data・zipは非コミット／Supabase T003はPhase 0／T601-minをPhase 2へ前倒し／.env.example に CLAUDE_MODEL_GUARD（NEXT_PUBLIC_禁止）／T001はゆうがMacのClaude Codeで実施（L-20261102-25） |
| 2026-11-02 | docs整合（L-20261102-28、すべてユーザー回答）：デモは**実商品**・実名表示。画面に出すのは事実（成分名・分量・基準量・内容量・区分）のみ、添付文書の文言はPMDAリンクアウト。事実抽出は開発時（Claude抽出→ゆう検証、1件ずつ・自動取得なし）。実行時Claude＝名寄せ・販売記録下書き・自己検査。8成分判定・手順書順はコード。製品画像・Storage廃止。design.md をJAN主経路に全面改訂。作品名表記は「ハコよみ」。docs正本は hakoyomi/docs/ に一本化 |

## Hard Bans
医療アドバイスAI／効く・効果が高い／量が多い＝効く／過剰摂取を煽る文言／勧薬・おすすめ・代わりにこれ／飲んでよい／用法の個人計算／併用・受診・販売可否の自動判定／症状入力／客向けモード／客の健康PII保存。

## Glossary
- **登録販売者**：第2類・第3類の一般用医薬品を販売できる専門家。判断はこの人が行う
- **指定濫用防止医薬品**：2026-05-01施行改正の区分【要確認：告示・通知原文で成分・施行日・大容量の定義を確定する（L-20261102-29）】。8成分（エフェドリン、コデイン、ジヒドロコデイン、ジフェンヒドラミン、デキストロメトルファン、プソイドエフェドリン、ブロモバレリル尿素、メチルエフェドリン）。年齢・他の薬・18歳未満の氏名・他店購入・複数/大容量の理由を確認
- **JAN**：商品バーコード番号。マスタ照合・棚引きに使う
- **自店手順書**：指定濫用防止医薬品の販売等手順書。店が作成・運用義務。MVPは模擬【仮】

## What changed from 道場 / MedNavi
- 道場（試験・トレーニング）とMedNaviは本作品の**対象外**。`../medical_advice_boundary.md` は道場前提の旧整理（境界の考え方のみ参照）
- 旧PRDの「成分タップで効能」「類似在庫」「日数目安を主役」「Claude=要約」は破棄

## Open Risks
- （closed 2026-11-02）Discord禁止範囲：ルール解釈は取得済み。個別書面承認ではないので推薦・診断に寄る変更はしない
- （closed 2026-11-02）実名表示：実名をそのまま表示（L-20261102-28）。デモSKUは L-20261102-31 で選定
- 実店舗手順書 未入手、大容量の告示値 未確認
- BWC審査基準・提出要件 未確認
- 抽出精度：開発時の Claude 抽出をゆうが検証（T701 で計測）
- master（medicine_data_assets）は別プロジェクト由来で古い可能性。分量等は最新の添付文書で確認

## Links
※ 以下の `../` 資料はこの Mac には無い（別環境 /workspace/contests/bwc_japan_2026/ にあった一次資料）。必要なら取り寄せる。
- `../hakoyomi_definition_20261101.md`（一次定義）
- `../hakoyomi_research_competitors_20261101.md`
- `../hakoyomi_safety_line.md`
- `../registered_seller_job_pain_research.md`
- `../medical_advice_boundary.md`（旧・道場前提）
