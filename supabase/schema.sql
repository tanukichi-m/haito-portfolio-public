-- ユーザーテーブル
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamp default now()
);

-- 保有銘柄テーブル
create table if not exists holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  stock_code varchar(10) not null,
  company_name text not null,
  sector text not null,
  shares integer not null check (shares > 0),
  purchase_price numeric not null check (purchase_price > 0),
  created_at timestamp default now(),
  unique(user_id, stock_code)
);

-- 業種マスターテーブル
create table if not exists sectors (
  sector_name text primary key,
  rank text not null,
  target_ratio numeric not null,
  max_ratio numeric not null,
  weight integer not null
);

-- 推奨銘柄テーブル
create table if not exists recommended_stocks (
  stock_code varchar(10) primary key,
  company_name text not null,
  sector text not null,
  priority integer not null default 1
);

-- 業種マスターデータ投入
insert into sectors (sector_name, rank, target_ratio, max_ratio, weight) values
  ('情報・通信業', 'S', 0.15, 0.25, 10),
  ('銀行業', 'S', 0.12, 0.20, 10),
  ('卸売業', 'A', 0.08, 0.15, 8),
  ('小売業', 'A', 0.07, 0.15, 7),
  ('医薬品', 'A', 0.08, 0.15, 8),
  ('食料品', 'A', 0.07, 0.15, 7),
  ('不動産業', 'B', 0.05, 0.12, 6),
  ('REIT', 'B', 0.05, 0.12, 6),
  ('電気機器', 'A', 0.08, 0.15, 8),
  ('輸送用機器', 'B', 0.05, 0.12, 6),
  ('化学', 'B', 0.05, 0.12, 5),
  ('建設業', 'B', 0.05, 0.12, 5),
  ('サービス業', 'B', 0.05, 0.12, 5),
  ('保険業', 'B', 0.05, 0.12, 6),
  ('証券・商品先物取引業', 'C', 0.03, 0.08, 4),
  ('電力・ガス業', 'C', 0.03, 0.08, 4),
  ('陸運業', 'C', 0.03, 0.08, 3),
  ('機械', 'C', 0.03, 0.08, 3),
  ('その他金融業', 'C', 0.02, 0.06, 3)
on conflict (sector_name) do nothing;

-- 推奨銘柄データ投入
insert into recommended_stocks (stock_code, company_name, sector, priority) values
  ('4502', '武田薬品工業', '医薬品', 1),
  ('4519', '中外製薬', '医薬品', 2),
  ('4507', '塩野義製薬', '医薬品', 3),
  ('9432', '日本電信電話(NTT)', '情報・通信業', 1),
  ('9433', 'KDDI', '情報・通信業', 2),
  ('9434', 'ソフトバンク', '情報・通信業', 3),
  ('8306', '三菱UFJフィナンシャル・グループ', '銀行業', 1),
  ('8316', '三井住友フィナンシャルグループ', '銀行業', 2),
  ('8411', 'みずほフィナンシャルグループ', '銀行業', 3),
  ('2914', '日本たばこ産業(JT)', '食料品', 1),
  ('2503', 'キリンホールディングス', '食料品', 2),
  ('2502', 'アサヒグループホールディングス', '食料品', 3),
  ('3283', '日本プロロジスリート投資法人', 'REIT', 1),
  ('8951', '日本ビルファンド投資法人', 'REIT', 2),
  ('8952', 'ジャパンリアルエステイト投資法人', 'REIT', 3),
  ('6758', 'ソニーグループ', '電気機器', 1),
  ('6501', '日立製作所', '電気機器', 2),
  ('6702', '富士通', '電気機器', 3),
  ('8031', '三井物産', '卸売業', 1),
  ('8058', '三菱商事', '卸売業', 2),
  ('8001', '伊藤忠商事', '卸売業', 3),
  ('8750', '第一生命ホールディングス', '保険業', 1),
  ('8725', 'MS&ADインシュアランスグループ', '保険業', 2),
  ('8801', '三井不動産', '不動産業', 1),
  ('8802', '三菱地所', '不動産業', 2)
on conflict (stock_code) do nothing;

-- Row Level Security
alter table holdings enable row level security;

create policy "Users can manage their own holdings"
  on holdings for all
  using (auth.uid() = user_id);
