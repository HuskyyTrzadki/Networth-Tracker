-- Atomically replaces transaction group legs and optionally updates custom annual rate.

create or replace function public.replace_transaction_group_with_custom_rate(
  p_user_id uuid,
  p_group_id uuid,
  p_new_legs jsonb,
  p_custom_instrument_id uuid default null,
  p_custom_annual_rate_pct numeric default null
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
begin
  if p_custom_instrument_id is not null and p_custom_annual_rate_pct is not null then
    update public.custom_instruments
    set
      annual_rate_pct = p_custom_annual_rate_pct,
      updated_at = now()
    where id = p_custom_instrument_id
      and user_id = p_user_id;

    if not found then
      raise exception 'Custom instrument not found or no access.';
    end if;
  end if;

  return query
  select *
  from public.replace_transaction_group(
    p_user_id => p_user_id,
    p_group_id => p_group_id,
    p_new_legs => p_new_legs
  );
end;
$$;

grant execute on function public.replace_transaction_group_with_custom_rate(
  uuid,
  uuid,
  jsonb,
  uuid,
  numeric
) to authenticated;
