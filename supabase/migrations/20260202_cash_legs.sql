-- Adds transaction grouping + cash leg metadata for settlement/cashflows.

do $$
begin
  create type public.transaction_leg_role as enum ('ASSET', 'CASH');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.cashflow_type as enum (
    'DEPOSIT',
    'WITHDRAWAL',
    'DIVIDEND',
    'INTEREST',
    'FEE',
    'TAX',
    'TRADE_SETTLEMENT'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.transactions
  add column if not exists group_id uuid,
  add column if not exists leg_role public.transaction_leg_role,
  add column if not exists leg_key text,
  add column if not exists cashflow_type public.cashflow_type,
  add column if not exists settlement_fx_rate numeric,
  add column if not exists settlement_fx_as_of timestamptz,
  add column if not exists settlement_fx_provider text;

comment on column public.transactions.group_id is
  'Groups legs that belong to one user action (trade, cashflow).';
comment on column public.transactions.leg_role is
  'ASSET = primary intent, CASH = settlement/fees.';
comment on column public.transactions.leg_key is
  'Stable idempotency key per leg within the group.';
comment on column public.transactions.cashflow_type is
  'Categorizes manual cashflows; settlement legs use TRADE_SETTLEMENT.';
comment on column public.transactions.settlement_fx_rate is
  'FX rate used to compute cash leg for mismatched currencies.';
comment on column public.transactions.settlement_fx_as_of is
  'Timestamp of FX rate used for cash settlement.';
comment on column public.transactions.settlement_fx_provider is
  'Provider used for cash settlement FX.';

update public.transactions
set group_id = client_request_id
where group_id is null;

update public.transactions
set leg_role = 'ASSET'
where leg_role is null;

update public.transactions
set leg_key = 'ASSET'
where leg_key is null;

alter table public.transactions
  alter column group_id set not null,
  alter column leg_role set not null,
  alter column leg_key set not null,
  alter column settlement_fx_provider set default 'yahoo';

drop index if exists transactions_user_client_request_id_key;
create unique index if not exists transactions_user_client_request_leg_key
  on public.transactions(user_id, client_request_id, leg_key);

create index if not exists transactions_user_group_id_idx
  on public.transactions(user_id, group_id);

-- RPC: cash balances per portfolio (auth.uid).
create or replace function public.get_cash_balances(
  p_portfolio_ids uuid[] default null
)
returns table (
  portfolio_id uuid,
  currency text,
  quantity numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.portfolio_id,
    i.currency,
    sum(case when t.side = 'BUY' then t.quantity else -t.quantity end) as quantity
  from public.transactions t
  join public.instruments i on i.id = t.instrument_id
  join public.portfolios p on p.id = t.portfolio_id
  where t.user_id = auth.uid()
    and p.archived_at is null
    and i.instrument_type = 'CURRENCY'
    and (p_portfolio_ids is null or t.portfolio_id = any(p_portfolio_ids))
  group by t.portfolio_id, i.currency;
$$;

grant execute on function public.get_cash_balances(uuid[]) to authenticated;
