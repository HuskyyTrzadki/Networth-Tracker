-- Atomically replaces all transaction legs in a group.

create or replace function public.replace_transaction_group(
  p_user_id uuid,
  p_group_id uuid,
  p_new_legs jsonb
)
returns table (
  portfolio_id uuid,
  old_trade_date date,
  new_trade_date date,
  group_id uuid,
  replaced_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_count integer;
  inserted_count integer;
  resolved_portfolio_id uuid;
  resolved_old_trade_date date;
  resolved_new_trade_date date;
begin
  if jsonb_typeof(p_new_legs) <> 'array' then
    raise exception 'Payload must be a JSON array.';
  end if;

  expected_count := jsonb_array_length(p_new_legs);
  if expected_count = 0 then
    raise exception 'Payload cannot be empty.';
  end if;

  select t.portfolio_id, t.trade_date
  into resolved_portfolio_id, resolved_old_trade_date
  from public.transactions t
  where t.user_id = p_user_id
    and t.group_id = p_group_id
    and t.leg_key = 'ASSET'
  for update;

  if not found then
    raise exception 'Transaction group not found or no access.';
  end if;

  delete from public.transactions t
  where t.user_id = p_user_id
    and t.group_id = p_group_id;

  with payload as (
    select *
    from jsonb_to_recordset(p_new_legs) as x(
      user_id uuid,
      instrument_id uuid,
      custom_instrument_id uuid,
      portfolio_id uuid,
      side public.transaction_side,
      trade_date date,
      quantity numeric,
      price numeric,
      fee numeric,
      notes text,
      client_request_id uuid,
      group_id uuid,
      leg_role public.transaction_leg_role,
      leg_key text,
      cashflow_type public.cashflow_type,
      settlement_fx_rate numeric,
      settlement_fx_as_of timestamptz,
      settlement_fx_provider text
    )
  )
  insert into public.transactions (
    user_id,
    instrument_id,
    custom_instrument_id,
    portfolio_id,
    side,
    trade_date,
    quantity,
    price,
    fee,
    notes,
    client_request_id,
    group_id,
    leg_role,
    leg_key,
    cashflow_type,
    settlement_fx_rate,
    settlement_fx_as_of,
    settlement_fx_provider
  )
  select
    payload.user_id,
    payload.instrument_id,
    payload.custom_instrument_id,
    payload.portfolio_id,
    payload.side,
    payload.trade_date,
    payload.quantity,
    payload.price,
    payload.fee,
    payload.notes,
    payload.client_request_id,
    payload.group_id,
    payload.leg_role,
    payload.leg_key,
    payload.cashflow_type,
    payload.settlement_fx_rate,
    payload.settlement_fx_as_of,
    payload.settlement_fx_provider
  from payload
  where payload.user_id = p_user_id
    and payload.group_id = p_group_id
    and payload.portfolio_id = resolved_portfolio_id;

  get diagnostics inserted_count = row_count;

  if inserted_count <> expected_count then
    raise exception 'Payload rows must match current group ownership and portfolio.';
  end if;

  select t.trade_date
  into resolved_new_trade_date
  from public.transactions t
  where t.user_id = p_user_id
    and t.group_id = p_group_id
    and t.leg_key = 'ASSET'
  limit 1;

  if resolved_new_trade_date is null then
    raise exception 'Replaced group is missing ASSET leg.';
  end if;

  return query
  select
    resolved_portfolio_id,
    resolved_old_trade_date,
    resolved_new_trade_date,
    p_group_id,
    inserted_count;
end;
$$;

grant execute on function public.replace_transaction_group(uuid, uuid, jsonb) to authenticated;
