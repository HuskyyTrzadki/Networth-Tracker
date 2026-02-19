-- SQL-first custom holdings/anchor reads to avoid app-side transaction scans.

create or replace function public.get_custom_portfolio_holdings(
  p_portfolio_id uuid default null
)
returns table (
  custom_instrument_id uuid,
  name text,
  currency text,
  quantity numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.custom_instrument_id,
    ci.name,
    ci.currency,
    sum(case when t.side = 'BUY' then t.quantity else -t.quantity end) as quantity
  from public.transactions t
  join public.custom_instruments ci on ci.id = t.custom_instrument_id
  join public.portfolios p on p.id = t.portfolio_id
  where t.user_id = auth.uid()
    and ci.user_id = auth.uid()
    and t.leg_role = 'ASSET'
    and t.custom_instrument_id is not null
    and p.archived_at is null
    and (p_portfolio_id is null or t.portfolio_id = p_portfolio_id)
  group by
    t.custom_instrument_id,
    ci.name,
    ci.currency
  having sum(case when t.side = 'BUY' then t.quantity else -t.quantity end) <> 0;
$$;

grant execute on function public.get_custom_portfolio_holdings(uuid) to authenticated;

create or replace function public.get_custom_portfolio_anchors(
  p_portfolio_id uuid default null,
  p_custom_instrument_ids uuid[] default null
)
returns table (
  custom_instrument_id uuid,
  currency text,
  annual_rate_pct numeric,
  trade_date date,
  price numeric,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (t.custom_instrument_id)
    t.custom_instrument_id,
    ci.currency,
    ci.annual_rate_pct,
    t.trade_date,
    t.price,
    t.created_at
  from public.transactions t
  join public.custom_instruments ci on ci.id = t.custom_instrument_id
  join public.portfolios p on p.id = t.portfolio_id
  where t.user_id = auth.uid()
    and ci.user_id = auth.uid()
    and t.leg_role = 'ASSET'
    and t.custom_instrument_id is not null
    and p.archived_at is null
    and (p_portfolio_id is null or t.portfolio_id = p_portfolio_id)
    and (
      p_custom_instrument_ids is null
      or t.custom_instrument_id = any(p_custom_instrument_ids)
    )
  order by
    t.custom_instrument_id,
    t.trade_date desc,
    t.created_at desc;
$$;

grant execute on function public.get_custom_portfolio_anchors(uuid, uuid[]) to authenticated;

create or replace function public.get_custom_portfolio_holdings_admin_as_of(
  p_user_id uuid,
  p_bucket_date date,
  p_portfolio_id uuid default null
)
returns table (
  custom_instrument_id uuid,
  name text,
  currency text,
  quantity numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.custom_instrument_id,
    ci.name,
    ci.currency,
    sum(case when t.side = 'BUY' then t.quantity else -t.quantity end) as quantity
  from public.transactions t
  join public.custom_instruments ci on ci.id = t.custom_instrument_id
  join public.portfolios p on p.id = t.portfolio_id
  where t.user_id = p_user_id
    and ci.user_id = p_user_id
    and t.leg_role = 'ASSET'
    and t.custom_instrument_id is not null
    and t.trade_date <= p_bucket_date
    and p.archived_at is null
    and (p_portfolio_id is null or t.portfolio_id = p_portfolio_id)
  group by
    t.custom_instrument_id,
    ci.name,
    ci.currency
  having sum(case when t.side = 'BUY' then t.quantity else -t.quantity end) <> 0;
$$;

revoke all on function public.get_custom_portfolio_holdings_admin_as_of(uuid, date, uuid) from public;
revoke all on function public.get_custom_portfolio_holdings_admin_as_of(uuid, date, uuid) from authenticated;
grant execute on function public.get_custom_portfolio_holdings_admin_as_of(uuid, date, uuid) to service_role;

create or replace function public.get_custom_portfolio_anchors_admin_as_of(
  p_user_id uuid,
  p_bucket_date date,
  p_portfolio_id uuid default null,
  p_custom_instrument_ids uuid[] default null
)
returns table (
  custom_instrument_id uuid,
  currency text,
  annual_rate_pct numeric,
  trade_date date,
  price numeric,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (t.custom_instrument_id)
    t.custom_instrument_id,
    ci.currency,
    ci.annual_rate_pct,
    t.trade_date,
    t.price,
    t.created_at
  from public.transactions t
  join public.custom_instruments ci on ci.id = t.custom_instrument_id
  join public.portfolios p on p.id = t.portfolio_id
  where t.user_id = p_user_id
    and ci.user_id = p_user_id
    and t.leg_role = 'ASSET'
    and t.custom_instrument_id is not null
    and t.trade_date <= p_bucket_date
    and p.archived_at is null
    and (p_portfolio_id is null or t.portfolio_id = p_portfolio_id)
    and (
      p_custom_instrument_ids is null
      or t.custom_instrument_id = any(p_custom_instrument_ids)
    )
  order by
    t.custom_instrument_id,
    t.trade_date desc,
    t.created_at desc;
$$;

revoke all on function public.get_custom_portfolio_anchors_admin_as_of(uuid, date, uuid, uuid[]) from public;
revoke all on function public.get_custom_portfolio_anchors_admin_as_of(uuid, date, uuid, uuid[]) from authenticated;
grant execute on function public.get_custom_portfolio_anchors_admin_as_of(uuid, date, uuid, uuid[]) to service_role;

create index if not exists transactions_user_custom_asset_anchor_idx
  on public.transactions(user_id, custom_instrument_id, trade_date desc, created_at desc, portfolio_id)
  include (side, quantity, price)
  where leg_role = 'ASSET' and custom_instrument_id is not null;
