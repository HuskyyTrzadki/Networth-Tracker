-- Portfolio tax profile + dividend booking idempotency primitives.

alter table public.portfolios
  add column if not exists is_tax_advantaged boolean not null default false;

comment on column public.portfolios.is_tax_advantaged is
  'True for tax-advantaged accounts (IKE/IKZE) used for dividend smart-default hints.';

alter table public.transactions
  add column if not exists dividend_event_key text;

comment on column public.transactions.dividend_event_key is
  'Idempotency key for booked dividend events (example: AAPL_2026-02-15).';

create unique index if not exists transactions_user_portfolio_dividend_event_key_key
  on public.transactions(user_id, portfolio_id, dividend_event_key)
  where cashflow_type = 'DIVIDEND'
    and leg_role = 'ASSET'
    and dividend_event_key is not null;
