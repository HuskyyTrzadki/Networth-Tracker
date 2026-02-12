create table if not exists public.instrument_fundamental_time_series_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'yahoo',
  provider_key text not null,
  metric text not null,
  period_end_date date not null,
  period_type text not null,
  value numeric,
  source text not null,
  fetched_at timestamptz not null default now()
);

comment on table public.instrument_fundamental_time_series_cache is
  'Global cache of normalized fundamentals time-series used by stocks overlays (EPS TTM, Revenue TTM).';

create unique index if not exists instrument_fundamental_time_series_cache_unique_key
  on public.instrument_fundamental_time_series_cache(provider, provider_key, metric, period_end_date);

create index if not exists instrument_fundamental_time_series_cache_lookup_idx
  on public.instrument_fundamental_time_series_cache(provider, provider_key, metric, period_end_date desc);

create index if not exists instrument_fundamental_time_series_cache_fetched_idx
  on public.instrument_fundamental_time_series_cache(provider, provider_key, metric, fetched_at desc);

alter table public.instrument_fundamental_time_series_cache enable row level security;

create policy "Instrument fundamentals time series cache: select all"
on public.instrument_fundamental_time_series_cache
for select
to authenticated
using (true);
