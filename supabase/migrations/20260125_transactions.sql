-- Transactions + instruments (per-user cache).
-- This is MVP-safe: no global instruments, RLS per user.

-- Explicit enum keeps values consistent with UI (BUY/SELL).
do $$
begin
  create type public.transaction_side as enum ('BUY', 'SELL');
exception
  when duplicate_object then null;
end $$;

-- Per-user instruments cache for Yahoo (or other providers).
create table if not exists public.instruments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_key text,
  identity_key text not null,
  symbol text not null,
  name text not null,
  currency text not null check (char_length(currency) = 3),
  exchange text,
  region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.instruments is 'Per-user cache of instruments selected from providers (e.g. Yahoo).';
comment on column public.instruments.identity_key is 'Stable per-user key used for upserts (provider + provider_key or provider+symbol+exchange).';

create unique index if not exists instruments_user_identity_key_key
  on public.instruments(user_id, identity_key);

-- Transactions belong to a user and reference an instrument row.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  instrument_id uuid not null references public.instruments(id) on delete restrict,
  side public.transaction_side not null,
  trade_date date not null,
  quantity numeric not null check (quantity > 0),
  price numeric not null check (price >= 0),
  fee numeric not null default 0 check (fee >= 0),
  notes text check (char_length(notes) <= 500),
  client_request_id uuid not null,
  created_at timestamptz not null default now()
);

comment on table public.transactions is 'User transactions with idempotency support via client_request_id.';
comment on column public.transactions.client_request_id is 'Client-generated UUID to prevent duplicate inserts on retries.';

create unique index if not exists transactions_user_client_request_id_key
  on public.transactions(user_id, client_request_id);

create index if not exists transactions_user_trade_date_idx
  on public.transactions(user_id, trade_date desc);

create index if not exists transactions_user_instrument_idx
  on public.transactions(user_id, instrument_id);

-- RLS: instruments are per-user.
alter table public.instruments enable row level security;

create policy "Instruments: select own"
on public.instruments
for select
to authenticated
using (user_id = auth.uid());

create policy "Instruments: insert own"
on public.instruments
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Instruments: update own"
on public.instruments
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- RLS: transactions are per-user.
alter table public.transactions enable row level security;

create policy "Transactions: select own"
on public.transactions
for select
to authenticated
using (user_id = auth.uid());

create policy "Transactions: insert own"
on public.transactions
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Transactions: update own"
on public.transactions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
