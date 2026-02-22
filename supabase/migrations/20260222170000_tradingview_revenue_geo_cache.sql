create table if not exists public.instrument_revenue_geo_breakdown_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'yahoo',
  provider_key text not null,
  source text not null default 'tradingview_dom',
  latest_by_country jsonb not null default '{}'::jsonb,
  history_by_country jsonb not null default '{}'::jsonb,
  series_order text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);

comment on table public.instrument_revenue_geo_breakdown_cache is
  'Global cache of TradingView revenue geography breakdown (latest + displayed history by country).';

create unique index if not exists instrument_revenue_geo_breakdown_cache_unique_key
  on public.instrument_revenue_geo_breakdown_cache(provider, provider_key, source);

create index if not exists instrument_revenue_geo_breakdown_cache_fetched_idx
  on public.instrument_revenue_geo_breakdown_cache(provider, fetched_at desc);

alter table public.instrument_revenue_geo_breakdown_cache enable row level security;

create policy "Instrument revenue geo breakdown cache: select all"
on public.instrument_revenue_geo_breakdown_cache
for select
to authenticated
using (true);
