c sobie te cron -- Base schema reset: profiles, portfolios, instruments (global), custom instruments, transactions.

-- Enums

do $$
begin
  create type public.transaction_side as enum ('BUY', 'SELL');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.instrument_type as enum (
    'EQUITY',
    'ETF',
    'CRYPTOCURRENCY',
    'MUTUALFUND',
    'CURRENCY',
    'INDEX',
    'OPTION',
    'FUTURE',
    'MONEYMARKET',
    'ECNQUOTE',
    'ALTSYMBOL'
  );
exception
  when duplicate_object then null;
end $$;

-- Profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  upgraded_at timestamptz
);

alter table public.profiles enable row level security;

create policy "Profiles: select own"
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

create policy "Profiles: insert own"
on public.profiles
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Profiles: update own"
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Portfolios
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) <= 120),
  base_currency text not null default 'PLN' check (char_length(base_currency) = 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

comment on table public.portfolios is 'User portfolios (multiple per account).';

create unique index if not exists portfolios_user_name_key
  on public.portfolios(user_id, name);

create index if not exists portfolios_user_created_at_idx
  on public.portfolios(user_id, created_at);

alter table public.portfolios enable row level security;

create policy "Portfolios: select own"
on public.portfolios
for select
to authenticated
using (user_id = auth.uid());

create policy "Portfolios: insert own"
on public.portfolios
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Portfolios: update own"
on public.portfolios
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Global instruments (market data)
create table if not exists public.instruments (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_key text not null,
  symbol text not null,
  name text not null,
  currency text not null check (char_length(currency) = 3),
  exchange text,
  region text,
  logo_url text,
  instrument_type public.instrument_type,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.instruments is 'Global cache of market instruments (provider-backed).';
comment on column public.instruments.provider_key is 'Provider identifier (Yahoo symbol).';

create unique index if not exists instruments_provider_key_key
  on public.instruments(provider, provider_key);

create index if not exists instruments_symbol_idx
  on public.instruments(symbol);

alter table public.instruments enable row level security;

create policy "Instruments: select all"
on public.instruments
for select
to authenticated
using (true);

-- No insert/update policies: only service role writes.

-- Custom instruments (per-user manual assets)
create table if not exists public.custom_instruments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) <= 200),
  currency text not null check (char_length(currency) = 3),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.custom_instruments is 'Per-user manual assets (e.g. недвиж).';

alter table public.custom_instruments enable row level security;

create policy "Custom instruments: select own"
on public.custom_instruments
for select
to authenticated
using (user_id = auth.uid());

create policy "Custom instruments: insert own"
on public.custom_instruments
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Custom instruments: update own"
on public.custom_instruments
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  instrument_id uuid references public.instruments(id) on delete restrict,
  custom_instrument_id uuid references public.custom_instruments(id) on delete restrict,
  side public.transaction_side not null,
  trade_date date not null,
  quantity numeric not null check (quantity > 0),
  price numeric not null check (price >= 0),
  fee numeric not null default 0 check (fee >= 0),
  notes text check (char_length(notes) <= 500),
  client_request_id uuid not null,
  created_at timestamptz not null default now(),
  constraint transactions_instrument_choice check (
    num_nonnulls(instrument_id, custom_instrument_id) = 1
  )
);

comment on table public.transactions is 'User transactions; instrument can be global or custom.';

create unique index if not exists transactions_user_client_request_id_key
  on public.transactions(user_id, client_request_id);

create index if not exists transactions_user_trade_date_idx
  on public.transactions(user_id, trade_date desc);

create index if not exists transactions_user_portfolio_idx
  on public.transactions(user_id, portfolio_id);

alter table public.transactions enable row level security;

create policy "Transactions: select own"
on public.transactions
for select
to authenticated
using (user_id = auth.uid());

create policy "Transactions: insert own"
on public.transactions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.portfolios
    where portfolios.id = transactions.portfolio_id
      and portfolios.user_id = auth.uid()
  )
);

create policy "Transactions: update own"
on public.transactions
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.portfolios
    where portfolios.id = transactions.portfolio_id
      and portfolios.user_id = auth.uid()
  )
);

-- RPC: user holdings (auth.uid)
create or replace function public.get_portfolio_holdings(
  p_portfolio_id uuid default null
)
returns table (
  instrument_id uuid,
  symbol text,
  name text,
  currency text,
  exchange text,
  provider text,
  provider_key text,
  logo_url text,
  instrument_type public.instrument_type,
  quantity numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.instrument_id,
    i.symbol,
    i.name,
    i.currency,
    i.exchange,
    i.provider,
    i.provider_key,
    i.logo_url,
    i.instrument_type,
    sum(case when t.side = 'BUY' then t.quantity else -t.quantity end) as quantity
  from public.transactions t
  join public.instruments i on i.id = t.instrument_id
  join public.portfolios p on p.id = t.portfolio_id
  where t.user_id = auth.uid()
    and p.archived_at is null
    and (p_portfolio_id is null or t.portfolio_id = p_portfolio_id)
  group by
    t.instrument_id,
    i.symbol,
    i.name,
    i.currency,
    i.exchange,
    i.provider,
    i.provider_key,
    i.logo_url,
    i.instrument_type
  having sum(case when t.side = 'BUY' then t.quantity else -t.quantity end) <> 0;
$$;

grant execute on function public.get_portfolio_holdings(uuid) to authenticated;

-- RPC: admin holdings (service role only)
create or replace function public.get_portfolio_holdings_admin(
  p_user_id uuid,
  p_portfolio_id uuid default null
)
returns table (
  instrument_id uuid,
  symbol text,
  name text,
  currency text,
  exchange text,
  provider text,
  provider_key text,
  logo_url text,
  instrument_type public.instrument_type,
  quantity numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.instrument_id,
    i.symbol,
    i.name,
    i.currency,
    i.exchange,
    i.provider,
    i.provider_key,
    i.logo_url,
    i.instrument_type,
    sum(case when t.side = 'BUY' then t.quantity else -t.quantity end) as quantity
  from public.transactions t
  join public.instruments i on i.id = t.instrument_id
  join public.portfolios p on p.id = t.portfolio_id
  where t.user_id = p_user_id
    and p.archived_at is null
    and (p_portfolio_id is null or t.portfolio_id = p_portfolio_id)
  group by
    t.instrument_id,
    i.symbol,
    i.name,
    i.currency,
    i.exchange,
    i.provider,
    i.provider_key,
    i.logo_url,
    i.instrument_type
  having sum(case when t.side = 'BUY' then t.quantity else -t.quantity end) <> 0;
$$;

revoke all on function public.get_portfolio_holdings_admin(uuid, uuid) from public;
revoke all on function public.get_portfolio_holdings_admin(uuid, uuid) from authenticated;

grant execute on function public.get_portfolio_holdings_admin(uuid, uuid) to service_role;
-- Global cache-first market data (quotes + FX).

create table if not exists public.instrument_quotes_cache (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references public.instruments(id) on delete cascade,
  provider text not null,
  provider_key text not null,
  currency text not null check (char_length(currency) = 3),
  price numeric not null check (price >= 0),
  as_of timestamptz not null,
  fetched_at timestamptz not null default now()
);

comment on table public.instrument_quotes_cache is
  'Global cache of quote prices with as_of timestamp.';

create unique index if not exists instrument_quotes_cache_provider_instrument_key
  on public.instrument_quotes_cache(provider, instrument_id);

create index if not exists instrument_quotes_cache_fetched_idx
  on public.instrument_quotes_cache(fetched_at desc);

create table if not exists public.fx_rates_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'yahoo',
  base_currency text not null check (char_length(base_currency) = 3),
  quote_currency text not null check (char_length(quote_currency) = 3),
  rate numeric not null check (rate > 0),
  as_of timestamptz not null,
  fetched_at timestamptz not null default now()
);

comment on table public.fx_rates_cache is
  'Global cache of FX rates (base -> quote) with as_of timestamp.';

create unique index if not exists fx_rates_cache_pair_provider_key
  on public.fx_rates_cache(provider, base_currency, quote_currency);

create index if not exists fx_rates_cache_fetched_idx
  on public.fx_rates_cache(fetched_at desc);

alter table public.instrument_quotes_cache enable row level security;
alter table public.fx_rates_cache enable row level security;

create policy "Quotes cache: select all"
on public.instrument_quotes_cache
for select
to authenticated
using (true);

create policy "FX cache: select all"
on public.fx_rates_cache
for select
to authenticated
using (true);
-- Daily portfolio snapshots for charting portfolio value over time.

do $$
begin
  create type public.portfolio_snapshot_scope as enum ('PORTFOLIO', 'ALL');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope public.portfolio_snapshot_scope not null,
  portfolio_id uuid references public.portfolios(id) on delete cascade,
  bucket_date date not null,
  captured_at timestamptz not null default now(),
  total_value_pln numeric,
  total_value_usd numeric,
  total_value_eur numeric,
  is_partial_pln boolean not null default false,
  missing_quotes_pln int not null default 0,
  missing_fx_pln int not null default 0,
  as_of_pln timestamptz,
  is_partial_usd boolean not null default false,
  missing_quotes_usd int not null default 0,
  missing_fx_usd int not null default 0,
  as_of_usd timestamptz,
  is_partial_eur boolean not null default false,
  missing_quotes_eur int not null default 0,
  missing_fx_eur int not null default 0,
  as_of_eur timestamptz,
  constraint portfolio_snapshots_scope_portfolio_check
    check (
      (scope = 'ALL' and portfolio_id is null)
      or (scope = 'PORTFOLIO' and portfolio_id is not null)
    )
);

comment on table public.portfolio_snapshots is
  'Daily portfolio value snapshots for charting (PLN/USD/EUR).';
comment on column public.portfolio_snapshots.bucket_date is
  'UTC date bucket for the snapshot.';
comment on column public.portfolio_snapshots.captured_at is
  'When the snapshot was computed and stored.';

create unique index if not exists portfolio_snapshots_user_portfolio_day_key
  on public.portfolio_snapshots(user_id, portfolio_id, bucket_date)
  where scope = 'PORTFOLIO';

create unique index if not exists portfolio_snapshots_user_all_day_key
  on public.portfolio_snapshots(user_id, bucket_date)
  where scope = 'ALL';

create index if not exists portfolio_snapshots_user_scope_portfolio_day_idx
  on public.portfolio_snapshots(user_id, scope, portfolio_id, bucket_date desc);

create index if not exists portfolio_snapshots_user_scope_day_idx
  on public.portfolio_snapshots(user_id, scope, bucket_date desc);

create index if not exists portfolio_snapshots_bucket_date_idx
  on public.portfolio_snapshots(bucket_date);

alter table public.portfolio_snapshots enable row level security;

create policy "Portfolio snapshots: select own"
on public.portfolio_snapshots
for select
to authenticated
using (user_id = auth.uid());
-- Tracks daily cron progress for portfolio snapshots.

create table if not exists public.cron_portfolio_snapshots_state (
  job_date date primary key,
  cursor_user_id uuid,
  done boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.cron_portfolio_snapshots_state is
  'State table for portfolio snapshot cron runs (daily cursor + completion flag).';

alter table public.cron_portfolio_snapshots_state enable row level security;
