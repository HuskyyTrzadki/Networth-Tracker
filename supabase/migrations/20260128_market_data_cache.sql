-- Cache-first market data (quotes + FX) per user to keep the UI fast and stable.
-- TTL is enforced in application code; DB stores last fetched values.

create table if not exists public.instrument_quotes_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  instrument_id uuid not null references public.instruments(id) on delete cascade,
  provider text not null,
  provider_key text not null,
  currency text not null check (char_length(currency) = 3),
  price numeric not null check (price >= 0),
  as_of timestamptz not null,
  fetched_at timestamptz not null default now()
);

comment on table public.instrument_quotes_cache is
  'Per-user cache of quote prices with as_of timestamp.';
comment on column public.instrument_quotes_cache.as_of is
  'Timestamp of the market data (not the fetch time).';
comment on column public.instrument_quotes_cache.fetched_at is
  'When the quote was fetched and stored (for TTL checks).';

create unique index if not exists instrument_quotes_cache_user_instrument_provider_key
  on public.instrument_quotes_cache(user_id, instrument_id, provider);

create index if not exists instrument_quotes_cache_user_fetched_idx
  on public.instrument_quotes_cache(user_id, fetched_at desc);

create table if not exists public.fx_rates_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  provider text not null default 'yahoo',
  base_currency text not null check (char_length(base_currency) = 3),
  quote_currency text not null check (char_length(quote_currency) = 3),
  rate numeric not null check (rate > 0),
  as_of timestamptz not null,
  fetched_at timestamptz not null default now()
);

comment on table public.fx_rates_cache is
  'Per-user cache of FX rates (base -> quote) with as_of timestamp.';

create unique index if not exists fx_rates_cache_user_pair_provider_key
  on public.fx_rates_cache(user_id, base_currency, quote_currency, provider);

create index if not exists fx_rates_cache_user_fetched_idx
  on public.fx_rates_cache(user_id, fetched_at desc);

-- RLS: cache data is per-user.
alter table public.instrument_quotes_cache enable row level security;
alter table public.fx_rates_cache enable row level security;

create policy "Quotes cache: select own"
on public.instrument_quotes_cache
for select
to authenticated
using (user_id = auth.uid());

create policy "Quotes cache: insert own"
on public.instrument_quotes_cache
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Quotes cache: update own"
on public.instrument_quotes_cache
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "FX cache: select own"
on public.fx_rates_cache
for select
to authenticated
using (user_id = auth.uid());

create policy "FX cache: insert own"
on public.fx_rates_cache
for insert
to authenticated
with check (user_id = auth.uid());

create policy "FX cache: update own"
on public.fx_rates_cache
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
