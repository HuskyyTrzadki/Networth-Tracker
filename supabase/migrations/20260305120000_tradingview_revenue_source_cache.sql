create table if not exists public.instrument_revenue_source_breakdown_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'yahoo',
  provider_key text not null,
  source text not null default 'tradingview_dom',
  latest_by_source jsonb not null default '{}'::jsonb,
  history_by_source jsonb not null default '{}'::jsonb,
  series_order text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);

comment on table public.instrument_revenue_source_breakdown_cache is
  'Global cache of TradingView revenue source/segment breakdown (latest + displayed history by label).';

create unique index if not exists instrument_revenue_source_breakdown_cache_unique_key
  on public.instrument_revenue_source_breakdown_cache(provider, provider_key, source);

create index if not exists instrument_revenue_source_breakdown_cache_fetched_idx
  on public.instrument_revenue_source_breakdown_cache(provider, fetched_at desc);

alter table public.instrument_revenue_source_breakdown_cache enable row level security;

create policy "Instrument revenue source breakdown cache: select all"
on public.instrument_revenue_source_breakdown_cache
for select
to authenticated
using (true);

create or replace function public.list_tradingview_revenue_source_backfill_candidates(
  p_provider text default 'yahoo',
  p_stale_before timestamptz default (now() - interval '90 days'),
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
  select
    i.provider,
    i.provider_key,
    i.symbol,
    i.name,
    i.exchange,
    i.instrument_type,
    i.updated_at,
    c.fetched_at as cache_fetched_at
  from public.instruments i
  left join public.instrument_revenue_source_breakdown_cache c
    on c.provider = i.provider
   and c.provider_key = i.provider_key
   and c.source = 'tradingview_dom'
  where i.provider = p_provider
    and i.instrument_type = 'EQUITY'
    and (
      c.id is null
      or c.fetched_at < p_stale_before
    )
  order by c.fetched_at asc nulls first, i.updated_at desc
  limit greatest(coalesce(p_limit, 25), 1);
$$;

comment on function public.list_tradingview_revenue_source_backfill_candidates(text, timestamptz, integer) is
  'Returns Yahoo equity instruments with missing or stale TradingView revenue source breakdown cache.';

create or replace function public.count_tradingview_revenue_source_backfill_candidates(
  p_provider text default 'yahoo',
  p_stale_before timestamptz default (now() - interval '90 days')
)
returns bigint
language sql
set search_path = public
as $$
  select count(*)::bigint
  from public.instruments i
  left join public.instrument_revenue_source_breakdown_cache c
    on c.provider = i.provider
   and c.provider_key = i.provider_key
   and c.source = 'tradingview_dom'
  where i.provider = p_provider
    and i.instrument_type = 'EQUITY'
    and (
      c.id is null
      or c.fetched_at < p_stale_before
    );
$$;

comment on function public.count_tradingview_revenue_source_backfill_candidates(text, timestamptz) is
  'Counts Yahoo equity instruments with missing or stale TradingView revenue source breakdown cache.';
