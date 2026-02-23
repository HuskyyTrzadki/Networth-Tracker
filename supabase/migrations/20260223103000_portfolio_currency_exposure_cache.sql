create table if not exists public.portfolio_currency_exposure_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope public.portfolio_snapshot_scope not null,
  portfolio_id uuid references public.portfolios(id) on delete cascade,
  holdings_fingerprint text not null,
  prompt_version text not null,
  model text not null,
  as_of timestamptz,
  result_json jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  constraint portfolio_currency_exposure_cache_scope_portfolio_check
    check (
      (scope = 'ALL' and portfolio_id is null)
      or (scope = 'PORTFOLIO' and portfolio_id is not null)
    )
);

comment on table public.portfolio_currency_exposure_cache is
  'Cached per-asset economic currency splits from LLM, keyed by instrument set fingerprint.';

create unique index if not exists portfolio_currency_exposure_cache_all_unique
  on public.portfolio_currency_exposure_cache(
    user_id,
    holdings_fingerprint,
    prompt_version,
    model
  )
  where scope = 'ALL' and portfolio_id is null;

create unique index if not exists portfolio_currency_exposure_cache_portfolio_unique
  on public.portfolio_currency_exposure_cache(
    user_id,
    portfolio_id,
    holdings_fingerprint,
    prompt_version,
    model
  )
  where scope = 'PORTFOLIO' and portfolio_id is not null;

create index if not exists portfolio_currency_exposure_cache_user_fetched_idx
  on public.portfolio_currency_exposure_cache(user_id, fetched_at desc);

alter table public.portfolio_currency_exposure_cache enable row level security;

create policy "Portfolio currency exposure cache: select own"
on public.portfolio_currency_exposure_cache
for select
to authenticated
using (auth.uid() = user_id);

create policy "Portfolio currency exposure cache: insert own"
on public.portfolio_currency_exposure_cache
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Portfolio currency exposure cache: update own"
on public.portfolio_currency_exposure_cache
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
