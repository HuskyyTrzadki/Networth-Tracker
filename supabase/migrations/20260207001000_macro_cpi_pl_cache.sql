create table if not exists public.macro_cpi_pl_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  metric text not null,
  period_date date not null,
  value numeric(14,6) not null,
  as_of timestamptz not null default now(),
  fetched_at timestamptz not null default now()
);

comment on table public.macro_cpi_pl_cache is
  'Global cache for Polish CPI macro series (NBP). Stored monthly to support real-return overlays.';

create unique index if not exists macro_cpi_pl_cache_unique_key
  on public.macro_cpi_pl_cache(provider, metric, period_date);

create index if not exists macro_cpi_pl_cache_lookup_idx
  on public.macro_cpi_pl_cache(provider, metric, period_date desc);

alter table public.macro_cpi_pl_cache enable row level security;

drop policy if exists "Authenticated users can read CPI macro cache"
on public.macro_cpi_pl_cache;

create policy "Authenticated users can read CPI macro cache"
on public.macro_cpi_pl_cache
for select
to authenticated
using (true);
