-- Portfolios: allow multiple portfolios per user.
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) <= 120),
  base_currency text not null default 'PLN' check (char_length(base_currency) = 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

comment on table public.portfolios is 'User portfolios (multiple per account).';
comment on column public.portfolios.name is 'User-facing portfolio name.';
comment on column public.portfolios.base_currency is 'Reporting currency for valuations.';

create unique index if not exists portfolios_user_name_key
  on public.portfolios(user_id, name);

create index if not exists portfolios_user_created_at_idx
  on public.portfolios(user_id, created_at);

-- Transactions now belong to a portfolio (multi-portfolio support).
alter table public.transactions
  add column if not exists portfolio_id uuid references public.portfolios(id) on delete restrict;

comment on column public.transactions.portfolio_id is 'Owning portfolio for this transaction.';

-- This assumes an empty DB (MVP reset). If data exists, backfill before setting NOT NULL.
alter table public.transactions
  alter column portfolio_id set not null;

create index if not exists transactions_user_portfolio_idx
  on public.transactions(user_id, portfolio_id);

-- RLS: portfolios are per-user.
alter table public.portfolios enable row level security;

create policy "Portfolios: select own"
on public.portfolios
for select
to authenticated
using (user_id = auth.uid());

create policy "Portfolios: insert own"
on public.portfolios
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Portfolios: update own"
on public.portfolios
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Tighten transaction insert/update to require portfolio ownership.
drop policy if exists "Transactions: insert own" on public.transactions;
drop policy if exists "Transactions: update own" on public.transactions;

create policy "Transactions: insert own"
on public.transactions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.portfolios
    where portfolios.id = transactions.portfolio_id
      and portfolios.user_id = auth.uid()
  )
);

create policy "Transactions: update own"
on public.transactions
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.portfolios
    where portfolios.id = transactions.portfolio_id
      and portfolios.user_id = auth.uid()
  )
);
