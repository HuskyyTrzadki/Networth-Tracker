create table if not exists public.instrument_companiesmarketcap_slug_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'yahoo',
  provider_key text not null,
  source text not null default 'companiesmarketcap_html',
  slug text not null,
  resolved_from text not null default 'heuristic',
  source_url text not null,
  metadata jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);

comment on table public.instrument_companiesmarketcap_slug_cache is
  'Cached CompaniesMarketCap slug mapping per instrument for async annual fundamentals ingestion.';

create unique index if not exists instrument_companiesmarketcap_slug_cache_unique_key
  on public.instrument_companiesmarketcap_slug_cache(provider, provider_key, source);

create index if not exists instrument_companiesmarketcap_slug_cache_fetched_idx
  on public.instrument_companiesmarketcap_slug_cache(provider, fetched_at desc);

alter table public.instrument_companiesmarketcap_slug_cache enable row level security;

create policy "CompaniesMarketCap slug cache: select all"
on public.instrument_companiesmarketcap_slug_cache
for select
to anon, authenticated
using (true);

create table if not exists public.instrument_companiesmarketcap_metric_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'yahoo',
  provider_key text not null,
  source text not null default 'companiesmarketcap_html',
  metric text not null
    check (metric in ('revenue', 'earnings', 'pe_ratio', 'ps_ratio')),
  slug text not null,
  source_url text not null,
  ttm_value double precision,
  ttm_label text,
  annual_history jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);

comment on table public.instrument_companiesmarketcap_metric_cache is
  'Annual/TTM CompaniesMarketCap fundamentals fallback cache for report widgets and valuation context.';

create unique index if not exists instrument_companiesmarketcap_metric_cache_unique_key
  on public.instrument_companiesmarketcap_metric_cache(provider, provider_key, source, metric);

create index if not exists instrument_companiesmarketcap_metric_cache_fetched_idx
  on public.instrument_companiesmarketcap_metric_cache(provider, fetched_at desc);

alter table public.instrument_companiesmarketcap_metric_cache enable row level security;

create policy "CompaniesMarketCap metric cache: select all"
on public.instrument_companiesmarketcap_metric_cache
for select
to anon, authenticated
using (true);

create or replace function public.list_companiesmarketcap_backfill_candidates(
  p_provider text default 'yahoo',
  p_stale_before timestamptz default (now() - interval '7 days'),
  p_limit integer default 25
)
returns table (
  provider text,
  provider_key text,
  symbol text,
  name text,
  exchange text,
  instrument_type public.instrument_type,
  updated_at timestamptz,
  cache_fetched_at timestamptz
)
language sql
set search_path = public
as $$
  with slug_state as (
    select
      c.provider,
      c.provider_key,
      max(c.fetched_at) as fetched_at
    from public.instrument_companiesmarketcap_slug_cache c
    where c.source = 'companiesmarketcap_html'
    group by c.provider, c.provider_key
  ),
  metric_state as (
    select
      c.provider,
      c.provider_key,
      count(distinct c.metric) as metrics_count,
      min(c.fetched_at) as oldest_fetched_at
    from public.instrument_companiesmarketcap_metric_cache c
    where c.source = 'companiesmarketcap_html'
    group by c.provider, c.provider_key
  )
  select
    i.provider,
    i.provider_key,
    i.symbol,
    i.name,
    i.exchange,
    i.instrument_type,
    i.updated_at,
    coalesce(
      least(s.fetched_at, m.oldest_fetched_at),
      s.fetched_at,
      m.oldest_fetched_at
    ) as cache_fetched_at
  from public.instruments i
  left join slug_state s
    on s.provider = i.provider
   and s.provider_key = i.provider_key
  left join metric_state m
    on m.provider = i.provider
   and m.provider_key = i.provider_key
  where i.provider = p_provider
    and i.instrument_type = 'EQUITY'
    and (
      s.provider_key is null
      or m.provider_key is null
      or coalesce(m.metrics_count, 0) < 4
      or s.fetched_at < p_stale_before
      or m.oldest_fetched_at < p_stale_before
    )
  order by cache_fetched_at asc nulls first, i.updated_at desc
  limit greatest(coalesce(p_limit, 25), 1);
$$;

comment on function public.list_companiesmarketcap_backfill_candidates(text, timestamptz, integer) is
  'Returns Yahoo equity instruments with missing or stale CompaniesMarketCap annual fundamentals cache.';

create or replace function public.count_companiesmarketcap_backfill_candidates(
  p_provider text default 'yahoo',
  p_stale_before timestamptz default (now() - interval '7 days')
)
returns bigint
language sql
set search_path = public
as $$
  with slug_state as (
    select
      c.provider,
      c.provider_key,
      max(c.fetched_at) as fetched_at
    from public.instrument_companiesmarketcap_slug_cache c
    where c.source = 'companiesmarketcap_html'
    group by c.provider, c.provider_key
  ),
  metric_state as (
    select
      c.provider,
      c.provider_key,
      count(distinct c.metric) as metrics_count,
      min(c.fetched_at) as oldest_fetched_at
    from public.instrument_companiesmarketcap_metric_cache c
    where c.source = 'companiesmarketcap_html'
    group by c.provider, c.provider_key
  )
  select count(*)::bigint
  from public.instruments i
  left join slug_state s
    on s.provider = i.provider
   and s.provider_key = i.provider_key
  left join metric_state m
    on m.provider = i.provider
   and m.provider_key = i.provider_key
  where i.provider = p_provider
    and i.instrument_type = 'EQUITY'
    and (
      s.provider_key is null
      or m.provider_key is null
      or coalesce(m.metrics_count, 0) < 4
      or s.fetched_at < p_stale_before
      or m.oldest_fetched_at < p_stale_before
    );
$$;

comment on function public.count_companiesmarketcap_backfill_candidates(text, timestamptz) is
  'Counts Yahoo equity instruments with missing or stale CompaniesMarketCap annual fundamentals cache.';
