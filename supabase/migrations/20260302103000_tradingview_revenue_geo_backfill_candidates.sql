create index if not exists instruments_provider_type_updated_idx
  on public.instruments(provider, instrument_type, updated_at desc);

create or replace function public.list_tradingview_revenue_geo_backfill_candidates(
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
  left join public.instrument_revenue_geo_breakdown_cache c
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

comment on function public.list_tradingview_revenue_geo_backfill_candidates(text, timestamptz, integer) is
  'Returns Yahoo equity instruments with missing or stale TradingView revenue geography cache.';

create or replace function public.count_tradingview_revenue_geo_backfill_candidates(
  p_provider text default 'yahoo',
  p_stale_before timestamptz default (now() - interval '90 days')
)
returns bigint
language sql
set search_path = public
as $$
  select count(*)::bigint
  from public.instruments i
  left join public.instrument_revenue_geo_breakdown_cache c
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

comment on function public.count_tradingview_revenue_geo_backfill_candidates(text, timestamptz) is
  'Counts Yahoo equity instruments with missing or stale TradingView revenue geography cache.';
