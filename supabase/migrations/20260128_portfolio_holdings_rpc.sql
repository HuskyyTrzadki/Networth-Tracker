-- RPC: Aggregate holdings per instrument using net BUY/SELL quantity.
-- We keep this in SQL for performance and avoid pulling every transaction row.

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
  quantity numeric
)
language sql
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
    sum(case when t.side = 'BUY' then t.quantity else -t.quantity end) as quantity
  from public.transactions t
  join public.instruments i on i.id = t.instrument_id
  where t.user_id = auth.uid()
    and (p_portfolio_id is null or t.portfolio_id = p_portfolio_id)
  group by
    t.instrument_id,
    i.symbol,
    i.name,
    i.currency,
    i.exchange,
    i.provider,
    i.provider_key,
    i.logo_url
  having sum(case when t.side = 'BUY' then t.quantity else -t.quantity end) <> 0;
$$;

comment on function public.get_portfolio_holdings(uuid) is
  'Aggregates net holdings per instrument (BUY minus SELL) for the current user; null portfolio means all.';

grant execute on function public.get_portfolio_holdings(uuid) to authenticated;
