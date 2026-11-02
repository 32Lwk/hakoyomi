-- ハコよみ 初期スキーマ（architecture §5、L-20261102-38）。
-- 形は src/lib/schema の zod に合わせる。お客様の氏名・症状・健康情報、質問・逆引きの入力のカラムは作らない（rules）。
-- 商品固有の添付文書本文のカラムは作らない。notice_items.body は厚労省通知の本文のみ。
-- 全表 RLS 有効・ポリシーなし：読み書きはサーバーの service role からのみ（キーは NEXT_PUBLIC_ にしない）。

-- 層②：厚労省通知「使用上の注意」の薬効群
create table notice_groups (
  id text primary key, -- kaze_1 等
  name text not null,
  source_url text not null,
  source_page int check (source_page > 0),
  fetched_on date not null
);

-- 層②：通知の項目。id は T101 の項目 id（例 kaze_1-ng-1-3）
create table notice_items (
  id text primary key,
  group_id text not null references notice_groups (id) on delete cascade,
  section text not null check (section in ('してはいけないこと', '相談すること', 'その他')),
  item_no text not null,
  body text not null check (body <> ''), -- 通知の本文
  condition jsonb not null default '{"always": true}', -- 記載条件の式（notice.ts の Condition）
  condition_text text, -- 記載条件の原文
  excluded_by text[] not null default '{}', -- 「ただし、○○を記載した製剤にあっては記載しない」の項目 id
  badge text check (
    badge in ('abuse', 'drive', 'breastfeeding', 'under15', 'under12', 'alcohol', 'caffeine', 'doping')
  ),
  needs_review boolean not null default false,
  position int not null default 0 -- 通知の記載順
);
create index notice_items_group_id on notice_items (group_id, position);

-- 層①：商品の事実（ゆうが箱と PMDA を見て入力）。推薦・順位の欄は作らない
create table products (
  id text primary key,
  jan text not null unique check (jan ~ '^(\d{8}|\d{13})$'),
  name text not null,
  maker text not null,
  risk_class text not null check (risk_class in ('要指導', '第1類', '指定第2類', '第2類', '第3類')),
  kind text not null check (
    kind in (
      'cold', 'fever', 'cough', 'rhinitis', 'nasal', 'stomach',
      'eye', 'topical', 'vitamin', 'sleep', 'kampo', 'motion'
    )
  ),
  notice_group_id text not null references notice_groups (id),
  efficacy_groups text[] not null default '{}',
  route text not null check (route in ('internal', 'external')),
  crude_drug_main boolean not null default false,
  daily_max_units numeric not null check (daily_max_units > 0),
  times_per_day int not null check (times_per_day > 0),
  content_qty numeric not null check (content_qty > 0),
  content_unit text not null,
  pmda_url text,
  doc_revised_on date,
  entered_by text not null,
  verified_on date
);

-- 層①：成分・分量（1日最大量あたり。生薬は原生薬換算）
create table product_facts (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products (id) on delete cascade,
  ingredient text not null,
  ingredient_classes text[] not null default '{}',
  amount_per_day numeric check (amount_per_day >= 0),
  unit text check (unit in ('mg', 'g', 'mL', 'µg')),
  uncertain boolean not null default false,
  position int not null default 0 -- 箱の成分表の記載順
);
create index product_facts_product_id on product_facts (product_id, position);

-- 棚マップ上の置き場（架空店舗 mock-store-1）
create table shelf_locations (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products (id) on delete cascade,
  store_id text not null default 'mock-store-1',
  shelf_id text not null,
  tier int not null check (tier > 0), -- 上から1
  "column" int not null check ("column" > 0), -- 左から1
  unique (store_id, product_id)
);

-- ベテランの説明メモ（P1、T403）。商品・成分・薬効群のどれかに付く
create table memos (
  id uuid primary key default gen_random_uuid(),
  product_id text references products (id) on delete cascade,
  ingredient text,
  group_id text references notice_groups (id) on delete cascade,
  body text not null check (body <> ''),
  author_alias text not null,
  created_at timestamptz not null default now(),
  check (num_nonnulls(product_id, ingredient, group_id) >= 1)
);

-- 指定濫用防止の確認（P1、T401）。お客様の情報は持たない。販売可否の判定欄は作らない
create table checklist_sessions (
  id uuid primary key default gen_random_uuid(),
  staff_alias text not null,
  product_id text not null references products (id),
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create table checklist_checks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references checklist_sessions (id) on delete cascade,
  item_code text not null check (item_code in ('ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ')),
  checked_at timestamptz not null default now(),
  unique (session_id, item_code)
);

alter table notice_groups enable row level security;
alter table notice_items enable row level security;
alter table products enable row level security;
alter table product_facts enable row level security;
alter table shelf_locations enable row level security;
alter table memos enable row level security;
alter table checklist_sessions enable row level security;
alter table checklist_checks enable row level security;
