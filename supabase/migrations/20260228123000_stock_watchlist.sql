create table if not exists public.stock_watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  provider_key text not null check (char_length(trim(provider_key)) > 0),
  symbol text not null check (char_length(trim(symbol)) > 0),
  name text not null check (char_length(trim(name)) > 0),
  currency text not null check (char_length(currency) = 3),
  logo_url text,
  created_at timestamptz not null default now()
);

comment on table public.stock_watchlist is 'User-pinned stocks shown in screener even without portfolio holdings.';

create unique index if not exists stock_watchlist_user_provider_key_key
  on public.stock_watchlist(user_id, provider_key);

create index if not exists stock_watchlist_user_created_at_idx
  on public.stock_watchlist(user_id, created_at desc);

alter table public.stock_watchlist enable row level security;

drop policy if exists "Stock watchlist: select own" on public.stock_watchlist;
create policy "Stock watchlist: select own"
on public.stock_watchlist
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Stock watchlist: insert own" on public.stock_watchlist;
create policy "Stock watchlist: insert own"
on public.stock_watchlist
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Stock watchlist: delete own" on public.stock_watchlist;
create policy "Stock watchlist: delete own"
on public.stock_watchlist
for delete
to authenticated
using (user_id = auth.uid());
