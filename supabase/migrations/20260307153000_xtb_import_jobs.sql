create table if not exists public.xtb_import_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed', 'blocked')),
  total_rows integer not null default 0 check (total_rows >= 0),
  completed_rows integer not null default 0 check (completed_rows >= 0),
  deduped_rows integer not null default 0 check (deduped_rows >= 0),
  failed_rows integer not null default 0 check (failed_rows >= 0),
  blocked_rows integer not null default 0 check (blocked_rows >= 0),
  message text,
  source_summary jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.xtb_import_runs is
  'Persistent XTB import job state used by the async preview/review/commit flow.';

create index if not exists xtb_import_runs_user_created_at_idx
  on public.xtb_import_runs(user_id, created_at desc);

create index if not exists xtb_import_runs_user_status_updated_at_idx
  on public.xtb_import_runs(user_id, status, updated_at desc);

create index if not exists xtb_import_runs_portfolio_created_at_idx
  on public.xtb_import_runs(portfolio_id, created_at desc);

create table if not exists public.xtb_import_run_rows (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.xtb_import_runs(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  row_index integer not null check (row_index >= 0),
  source_file_name text not null,
  xtb_row_id text not null,
  source_type text not null,
  trade_date date not null,
  status text not null default 'pending'
    check (status in ('pending', 'done', 'failed', 'blocked')),
  requires_instrument boolean not null default false,
  error_message text,
  asset_transaction_id uuid references public.transactions(id) on delete set null,
  was_deduped boolean not null default false,
  row_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint xtb_import_run_rows_run_row_index_key unique (run_id, row_index)
);

comment on table public.xtb_import_run_rows is
  'Normalized per-row payloads and outcomes for each async XTB import job.';

create index if not exists xtb_import_run_rows_run_status_row_index_idx
  on public.xtb_import_run_rows(run_id, status, row_index);

create index if not exists xtb_import_run_rows_user_status_updated_at_idx
  on public.xtb_import_run_rows(user_id, status, updated_at desc);

alter table public.xtb_import_runs enable row level security;
alter table public.xtb_import_run_rows enable row level security;

drop policy if exists "XTB import runs: select own" on public.xtb_import_runs;
create policy "XTB import runs: select own"
on public.xtb_import_runs
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "XTB import runs: insert own" on public.xtb_import_runs;
create policy "XTB import runs: insert own"
on public.xtb_import_runs
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "XTB import run rows: select own" on public.xtb_import_run_rows;
create policy "XTB import run rows: select own"
on public.xtb_import_run_rows
for select
to authenticated
using (user_id = auth.uid());
