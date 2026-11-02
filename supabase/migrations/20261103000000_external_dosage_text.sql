-- 外用薬の「1日数回」「適量」（L-20261103-25）。回数・最大量に上限がない品は数値を null にし、添付文書の表記を持つ
alter table products alter column daily_max_units drop not null;
alter table products alter column times_per_day drop not null;
alter table products add column times_per_day_text text;
alter table products add column daily_max_text text;

-- 数値が null にできるのは外用だけ。null のときは表記を必須にする
alter table products add constraint products_dosage_text_check check (
  (times_per_day is not null or (route = 'external' and times_per_day_text is not null))
  and (daily_max_units is not null or (route = 'external' and daily_max_text is not null))
);
