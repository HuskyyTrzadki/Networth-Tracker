-- Historical daily market caches + snapshot rebuild state for past-dated transactions.

create table if not exists public.instrument_daily_prices_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_key text not null,
  price_date date not null,
  exchange_timezone text not null,
  currency text not null check (char_length(currency) = 3),
  open numeric,
  high numeric,
  low numeric,
  close numeric not null check (close >= 0),
  volume numeric,
  as_of timestamptz not null,
  fetched_at timestamptz not null default now()
);

comment on table public.instrument_daily_prices_cache is
  'Global cache of real trading-session daily candles (no synthetic weekend rows).';

create unique index if not exists instrument_daily_prices_cache_unique_key
  on public.instrument_daily_prices_cache(provider, provider_key, price_date);

create index if not exists instrument_daily_prices_cache_lookup_idx
  on public.instrument_daily_prices_cache(provider, provider_key, price_date desc);

create table if not exists public.fx_daily_rates_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'yahoo',
  base_currency text not null check (char_length(base_currency) = 3),
  quote_currency text not null check (char_length(quote_currency) = 3),
  rate_date date not null,
  source_timezone text not null default 'UTC',
  rate numeric not null check (rate > 0),
  as_of timestamptz not null,
  fetched_at timestamptz not null default now()
);

comment on table public.fx_daily_rates_cache is
  'Global cache of real daily FX closes per currency pair (no synthetic weekend rows).';

create unique index if not exists fx_daily_rates_cache_unique_key
  on public.fx_daily_rates_cache(provider, base_currency, quote_currency, rate_date);

create index if not exists fx_daily_rates_cache_lookup_idx
  on public.fx_daily_rates_cache(provider, base_currency, quote_currency, rate_date desc);

-- Tracks dirty-range rebuild progress per user scope.
create table if not exists public.portfolio_snapshot_rebuild_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope public.portfolio_snapshot_scope not null,
  portfolio_id uuid references public.portfolios(id) on delete cascade,
  dirty_from date,
  status text not null default 'idle' check (status in ('idle', 'queued', 'running', 'failed')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_snapshot_rebuild_state_scope_check check (
    (scope = 'ALL' and portfolio_id is null)
    or (scope = 'PORTFOLIO' and portfolio_id is not null)
  )
);

comment on table public.portfolio_snapshot_rebuild_state is
  'Dirty-range rebuild state for snapshot history updates after past-dated transaction changes.';

create unique index if not exists portfolio_snapshot_rebuild_state_user_all_key
  on public.portfolio_snapshot_rebuild_state(user_id, scope)
  where scope = 'ALL';

create unique index if not exists portfolio_snapshot_rebuild_state_user_portfolio_key
  on public.portfolio_snapshot_rebuild_state(user_id, scope, portfolio_id)
  where scope = 'PORTFOLIO';

alter table public.instrument_daily_prices_cache enable row level security;
alter table public.fx_daily_rates_cache enable row level security;
alter table public.portfolio_snapshot_rebuild_state enable row level security;

create policy "Instrument daily prices cache: select all"
on public.instrument_daily_prices_cache
for select
to authenticated
using (true);

create policy "FX daily rates cache: select all"
on public.fx_daily_rates_cache
for select
to authenticated
using (true);

create policy "Snapshot rebuild state: select own"
on public.portfolio_snapshot_rebuild_state
for select
to authenticated
using (user_id = auth.uid());

-- Admin RPC: holdings as of a day (inclusive) for historical snapshot recompute.
create or replace function public.get_portfolio_holdings_admin_as_of(
  p_user_id uuid,
  p_bucket_date date,
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
    and t.trade_date <= p_bucket_date
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

revoke all on function public.get_portfolio_holdings_admin_as_of(uuid, date, uuid) from public;
revoke all on function public.get_portfolio_holdings_admin_as_of(uuid, date, uuid) from authenticated;

grant execute on function public.get_portfolio_holdings_admin_as_of(uuid, date, uuid) to service_role;
