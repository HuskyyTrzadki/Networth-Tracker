-- Adds cashflow + implicit transfer columns for TWR performance (no history backfill).

alter table public.portfolio_snapshots
  add column if not exists net_external_cashflow_pln numeric,
  add column if not exists net_external_cashflow_usd numeric,
  add column if not exists net_external_cashflow_eur numeric,
  add column if not exists net_implicit_transfer_pln numeric,
  add column if not exists net_implicit_transfer_usd numeric,
  add column if not exists net_implicit_transfer_eur numeric;

comment on column public.portfolio_snapshots.net_external_cashflow_pln is
  'Daily external cashflow (DEPOSIT/WITHDRAWAL) converted to PLN.';
comment on column public.portfolio_snapshots.net_external_cashflow_usd is
  'Daily external cashflow (DEPOSIT/WITHDRAWAL) converted to USD.';
comment on column public.portfolio_snapshots.net_external_cashflow_eur is
  'Daily external cashflow (DEPOSIT/WITHDRAWAL) converted to EUR.';
comment on column public.portfolio_snapshots.net_implicit_transfer_pln is
  'Daily value transfer without cash legs (BUY/SELL with consumeCash=false) converted to PLN.';
comment on column public.portfolio_snapshots.net_implicit_transfer_usd is
  'Daily value transfer without cash legs (BUY/SELL with consumeCash=false) converted to USD.';
comment on column public.portfolio_snapshots.net_implicit_transfer_eur is
  'Daily value transfer without cash legs (BUY/SELL with consumeCash=false) converted to EUR.';

-- External cashflows: real deposits/withdrawals on currency instruments.
create or replace function public.get_external_cashflows_admin(
  p_user_id uuid,
  p_bucket_date date,
  p_portfolio_id uuid default null
)
returns table (
  currency text,
  net_amount numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.currency,
    sum(
      case
        when t.side = 'BUY' then t.quantity * t.price
        else -t.quantity * t.price
      end
    ) as net_amount
  from public.transactions t
  join public.instruments i on i.id = t.instrument_id
  join public.portfolios p on p.id = t.portfolio_id
  where t.user_id = p_user_id
    and t.trade_date = p_bucket_date
    and p.archived_at is null
    and (p_portfolio_id is null or t.portfolio_id = p_portfolio_id)
    and i.instrument_type = 'CURRENCY'
    and t.cashflow_type in ('DEPOSIT', 'WITHDRAWAL')
  group by i.currency;
$$;

revoke all on function public.get_external_cashflows_admin(uuid, date, uuid) from public;
revoke all on function public.get_external_cashflows_admin(uuid, date, uuid) from authenticated;

grant execute on function public.get_external_cashflows_admin(uuid, date, uuid) to service_role;

-- Implicit value transfers: asset legs without any cash leg in the same group.
create or replace function public.get_implicit_transfers_admin(
  p_user_id uuid,
  p_bucket_date date,
  p_portfolio_id uuid default null
)
returns table (
  currency text,
  net_amount numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(i.currency, ci.currency) as currency,
    sum(
      case
        when t.side = 'BUY' then (t.quantity * t.price + coalesce(t.fee, 0))
        else -(t.quantity * t.price - coalesce(t.fee, 0))
      end
    ) as net_amount
  from public.transactions t
  left join public.instruments i on i.id = t.instrument_id
  left join public.custom_instruments ci on ci.id = t.custom_instrument_id
  join public.portfolios p on p.id = t.portfolio_id
  where t.user_id = p_user_id
    and t.trade_date = p_bucket_date
    and p.archived_at is null
    and (p_portfolio_id is null or t.portfolio_id = p_portfolio_id)
    and t.leg_role = 'ASSET'
    and (i.instrument_type is null or i.instrument_type <> 'CURRENCY')
    and not exists (
      select 1
      from public.transactions t2
      where t2.user_id = t.user_id
        and t2.group_id = t.group_id
        and t2.leg_role = 'CASH'
    )
  group by coalesce(i.currency, ci.currency);
$$;

revoke all on function public.get_implicit_transfers_admin(uuid, date, uuid) from public;
revoke all on function public.get_implicit_transfers_admin(uuid, date, uuid) from authenticated;

grant execute on function public.get_implicit_transfers_admin(uuid, date, uuid) to service_role;
