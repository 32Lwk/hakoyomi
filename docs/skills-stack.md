# ハコヨミ【仮】 スキル・技術スタック一覧（BWC Japan 2026）

- 作成日: 2026-11-02
- 目的: 実装（FE/BE）・Claude連携・プレゼン・動画・画面収録/E2E に必要なスキルとライブラリを一覧化し、入れる順番を決める。
- 前提: Next.js + TypeScript + Tailwind / Supabase + Vercel / Claude API + Claude Code / 認証なしMVP。主経路は JAN撮影・手入力・品名検索 → PMDA公開データ（添付文書・製品情報）→ 構造化 → 比較 → アコーディオン原文 → 濫用確認 → 棚番。推薦はしない。
- GitHubリンクは 2026-11-02 に curl で HTTP 200 を確認済み（スター数等は記載しない）。

## 優先度サマリ

| 優先 | 項目 |
|---|---|
| Must（すぐ） | project-ledger, code-changes, source-control, supabase skill, Next.js, Tailwind, shadcn/ui, supabase-js, Anthropic TS SDK, @zxing/browser, Playwright, Claude Code, PMDA（自前取得） |
| Nice-to-have | html5-qrcode（代替）, Vercel AI SDK, Remotion, slides / html-slides-one-pager / office-pptx, PptxGenJS, Marp, canvas, box-desktop, skill-authoring, anthropics/skills, nextjs-on-cloudflare（代替ホスティング） |

## A. このBotですでに使えるスキル（Cursor-managed / workflows）

| 名前 | ハコヨミでの用途 | 場所 | 状態 |
|---|---|---|---|
| project-ledger | PRD/DESIGN/LEDGERを全Botで共有・指示記録 | sand-workflow:project-ledger（/home/box/agent-data/workflows/project-ledger） | 利用可・Must |
| code-changes | リポジトリでの実装作業全般 | Cursor-managed skill | 利用可・Must |
| source-control | GitHubリポジトリ作成・PR・push | Cursor-managed skill | 利用可・Must |
| supabase | DB設計（SKU・棚番・記録）、RLS、Edge Functions | Cursor-managed skill + Supabase MCP | 利用可・Must |
| supabase-postgres-best-practices | スキーマ/インデックス設計 | Cursor-managed skill | 利用可・Nice |
| slides / slides-executor | ピッチ資料の作成 | Cursor-managed skill | 利用可・Nice（ピッチ時Must） |
| office-pptx | .pptx出力・編集 | Cursor-managed skill | 利用可・Nice |
| html-slides-one-pager | 1枚フライヤー・提出用PNG/PDF | /home/box/agent-data/workflows/html-slides-one-pager | 利用可・Nice |
| canvas | 説明ページ・レビュー用Page | Cursor-managed（WriteCanvas） | 利用可・Nice |
| box-desktop | ブラウザでのデモ確認・画面確認 | Cursor-managed skill | 利用可・Nice |
| skill-authoring | 「PMDA取得」「デモ撮影」等の独自スキル化 | Cursor-managed skill | 利用可・必要時 |
| nextjs-on-cloudflare | Vercel不可時の代替ホスティング（主ではない） | Cursor-managed skill | 利用可・代替のみ |
| Figma / Canva MCP | 画面モック・資料ビジュアル | MCP接続済み | 利用可・Nice |

## B. アプリ実装のライブラリ・SDK（GitHub）

| 名前 | 用途 | リンク | 状態 |
|---|---|---|---|
| Next.js | アプリ本体・API Routes | https://github.com/vercel/next.js | npm・Must |
| Tailwind CSS | スタイリング | https://github.com/tailwindlabs/tailwindcss | npm・Must |
| shadcn/ui | アコーディオン・テーブル・グレー表示UI | https://github.com/shadcn-ui/ui | CLIで導入・Must |
| supabase-js | SKU/棚番/確認記録の読み書き | https://github.com/supabase/supabase-js | npm・Must |
| Supabase（本体/CLI参照） | ローカル開発・マイグレーション | https://github.com/supabase/supabase | 参照・Must |
| @zxing/browser | カメラからJAN（EAN-13）読取 | https://github.com/zxing-js/browser | npm・Must |
| @zxing/library | zxingのコア（browserの依存） | https://github.com/zxing-js/library | npm・Must（間接） |
| html5-qrcode | JAN読取の代替（UI同梱） | https://github.com/mebjas/html5-qrcode | npm・Nice（代替） |
| Vercel AI SDK | Claudeのストリーミング/構造化出力を簡易化 | https://github.com/vercel/ai | npm・Nice |
| PMDA 医薬品情報検索（OTC） | 添付文書・製品情報の取得元 | https://www.pmda.go.jp/PmdaSearch/otcSearch/ | 公式サイト。定番OSSスクレイパーは未確認→自前取得＋キャッシュ。利用規約はPRD Q8で確認 |

## C. プレゼン・資料

| 名前 | 用途 | リンク | 状態 |
|---|---|---|---|
| slides / office-pptx スキル | ピッチデッキ | A参照 | 利用可 |
| html-slides-one-pager | 1枚サマリ | A参照 | 利用可 |
| PptxGenJS | コードでpptx生成（必要時） | https://github.com/gitbrent/PptxGenJS | npm・Nice |
| Marp CLI | Markdown→スライド（PDF/HTML） | https://github.com/marp-team/marp-cli | npm・Nice |

## D. 動画・画面収録・E2E

| 名前 | 用途 | リンク | 状態 |
|---|---|---|---|
| Playwright | E2E（JAN手入力→差分→棚番）と画面録画（recordVideo）でデモ素材 | https://github.com/microsoft/playwright | npm・Must |
| Remotion | 180秒動画をReactで組む（字幕・テロップ・素材合成） | https://github.com/remotion-dev/remotion | npm・Nice（商用ライセンス条件は要確認） |
| GenerateVideo / GenerateImage（Grok Bot） | 実写風カット・挿絵（客役に症状を言わせない、差は緑/赤にしない） | Bot内蔵ツール | 利用可・Nice |
| ffmpeg | 収録素材の結合・ナレーション（ゆう）合成 | apt等で導入 | 推奨インストール |

## E. Claude / Anthropic

| 名前 | 用途 | リンク | 状態 |
|---|---|---|---|
| Anthropic TypeScript SDK | 添付文書の構造化・差分整形・禁止語ガード | https://github.com/anthropics/anthropic-sdk-typescript | npm・Must |
| Claude Code | 実装の主作業環境（審査の「Claude活用」説明にも） | https://github.com/anthropics/claude-code | 推奨インストール・Must |
| Anthropic Skills | Claude Code用スキル集（docx/pptx等）の参考 | https://github.com/anthropics/skills | 参照・Nice |

## F. 推奨の入れ方（いつ・誰が）

| いつ | 何を | 誰が |
|---|---|---|
| Day1（今） | project-ledger運用、GitHubリポジトリ作成（source-control）、`create-next-app`＋Tailwind＋shadcn/ui | Grok Bot（code-changes）/ゆう確認 |
| Day1–2 | Supabaseプロジェクト＋supabase-js、SKU・棚番テーブル、Anthropic SDK、PMDA取得スクリプト（デモSKU分をキャッシュ） | Grok Bot＋Claude Code |
| Day2 | @zxing/browser でJAN読取（失敗時グレー＋手入力） | Claude Code |
| Day3 | Playwright E2E＋録画、禁止語ガードのテスト | Grok Bot |
| 提出前 | 動画（Playwright録画＋GenerateVideo、必要ならRemotion、ゆう読み上げ）、ピッチ（slides/office-pptx）、1枚サマリ | Grok Bot／ナレーションはゆう |
