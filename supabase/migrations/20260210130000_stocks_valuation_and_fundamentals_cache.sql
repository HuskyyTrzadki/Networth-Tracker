alter table public.instrument_daily_prices_cache
  add column if not exists adj_close numeric;

create table if not exists public.instrument_valuation_summary_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'yahoo',
  provider_key text not null,
  market_cap numeric,
  pe_ttm numeric,
  price_to_sales numeric,
  ev_to_ebitda numeric,
  price_to_book numeric,
  profit_margin numeric,
  operating_margin numeric,
  quarterly_earnings_yoy numeric,
  quarterly_revenue_yoy numeric,
  cash numeric,
  debt numeric,
  dividend_yield numeric,
  payout_ratio numeric,
  payout_date date,
  as_of timestamptz,
  fetched_at timestamptz not null default now()
);

comment on table public.instrument_valuation_summary_cache is
  'Global cache of normalized stock valuation summary metrics used by /stocks details.';

create unique index if not exists instrument_valuation_summary_cache_unique_key
  on public.instrument_valuation_summary_cache(provider, provider_key);

create index if not exists instrument_valuation_summary_cache_fetched_idx
  on public.instrument_valuation_summary_cache(provider, fetched_at desc);

create table if not exists public.instrument_eps_ttm_events_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'yahoo',
  provider_key text not null,
  period_end_date date not null,
  eps_ttm numeric,
  source text not null default 'fundamentalsTimeSeries',
  fetched_at timestamptz not null default now()
);

comment on table public.instrument_eps_ttm_events_cache is
  'Global cache of EPS TTM events (period end date -> EPS) for PE history overlays.';

create unique index if not exists instrument_eps_ttm_events_cache_unique_key
  on public.instrument_eps_ttm_events_cache(provider, provider_key, period_end_date);

create index if not exists instrument_eps_ttm_events_cache_fetched_idx
  on public.instrument_eps_ttm_events_cache(provider, provider_key, fetched_at desc);

alter table public.instrument_valuation_summary_cache enable row level security;
alter table public.instrument_eps_ttm_events_cache enable row level security;

create policy "Instrument valuation summary cache: select all"
on public.instrument_valuation_summary_cache
for select
to authenticated
using (true);

create policy "Instrument EPS TTM events cache: select all"
on public.instrument_eps_ttm_events_cache
for select
to authenticated
using (true);
