create extension if not exists pgcrypto;

create table if not exists public.stocks (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  market text not null,
  enabled boolean not null default true,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_price_snapshots (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid references public.stocks(id) on delete set null,
  symbol text not null,
  latest_price numeric not null,
  ma20 numeric not null,
  ma60 numeric not null,
  is_below_ma20 boolean not null,
  is_below_ma60 boolean not null,
  should_alert boolean not null,
  checked_at timestamptz not null default now()
);

create table if not exists public.alert_logs (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid references public.stocks(id) on delete set null,
  symbol text not null,
  alert_type text not null,
  message text not null,
  sent_at timestamptz not null default now()
);

create index if not exists stock_price_snapshots_symbol_checked_at_idx
  on public.stock_price_snapshots (symbol, checked_at desc);

create index if not exists alert_logs_symbol_type_sent_at_idx
  on public.alert_logs (symbol, alert_type, sent_at desc);

insert into public.stocks (symbol, name, market, enabled, note)
values
  ('9933.TW', '中鼎', 'TW', true, ''),
  ('2353.TW', '宏碁', 'TW', true, 'User wrote 宏基; mapped to Acer 宏碁'),
  ('0050.TW', '元大台灣50', 'TW', true, ''),
  ('5511.TWO', '德昌', 'TW', true, 'OTC stock; Yahoo Finance uses .TWO'),
  ('PLTR', 'Palantir Technologies Inc.', 'US', true, ''),
  ('GOOG', 'Alphabet Inc.', 'US', true, '')
on conflict (symbol) do update set
  name = excluded.name,
  market = excluded.market,
  enabled = excluded.enabled,
  note = excluded.note,
  updated_at = now();
