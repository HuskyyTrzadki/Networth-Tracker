do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'xtb_import_runs'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'broker_import_runs'
  ) then
    alter table public.xtb_import_runs rename to broker_import_runs;
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'xtb_import_run_rows'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'broker_import_run_rows'
  ) then
    alter table public.xtb_import_run_rows rename to broker_import_run_rows;
  end if;
end $$;

alter table if exists public.broker_import_runs
  add column if not exists provider text not null default 'xtb';

alter table if exists public.broker_import_run_rows
  rename column xtb_row_id to source_row_id;

update public.broker_import_runs
set provider = 'xtb'
where provider is null;

alter table if exists public.broker_import_runs
  rename constraint xtb_import_runs_portfolio_id_fkey to broker_import_runs_portfolio_id_fkey;

alter table if exists public.broker_import_run_rows
  rename constraint xtb_import_run_rows_asset_transaction_id_fkey to broker_import_run_rows_asset_transaction_id_fkey;

alter table if exists public.broker_import_run_rows
  rename constraint xtb_import_run_rows_run_id_fkey to broker_import_run_rows_run_id_fkey;

alter table if exists public.broker_import_run_rows
  rename constraint xtb_import_run_rows_run_row_index_key to broker_import_run_rows_run_row_index_key;

alter index if exists xtb_import_runs_user_created_at_idx
  rename to broker_import_runs_user_created_at_idx;

alter index if exists xtb_import_runs_user_status_updated_at_idx
  rename to broker_import_runs_user_status_updated_at_idx;

alter index if exists xtb_import_runs_portfolio_created_at_idx
  rename to broker_import_runs_portfolio_created_at_idx;

alter index if exists xtb_import_run_rows_run_status_row_index_idx
  rename to broker_import_run_rows_run_status_row_index_idx;

alter index if exists xtb_import_run_rows_user_status_updated_at_idx
  rename to broker_import_run_rows_user_status_updated_at_idx;

comment on table public.broker_import_runs is
  'Persistent broker import job state used by the async preview/review/commit flow.';

comment on table public.broker_import_run_rows is
  'Normalized per-row payloads and outcomes for each async broker import job.';

alter table public.broker_import_runs enable row level security;
alter table public.broker_import_run_rows enable row level security;

drop policy if exists "XTB import runs: select own" on public.broker_import_runs;
drop policy if exists "XTB import runs: insert own" on public.broker_import_runs;
drop policy if exists "XTB import run rows: select own" on public.broker_import_run_rows;
drop policy if exists "Broker import runs: select own" on public.broker_import_runs;
drop policy if exists "Broker import runs: insert own" on public.broker_import_runs;
drop policy if exists "Broker import run rows: select own" on public.broker_import_run_rows;

create policy "Broker import runs: select own"
on public.broker_import_runs
for select
to authenticated
using (user_id = auth.uid());

create policy "Broker import runs: insert own"
on public.broker_import_runs
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Broker import run rows: select own"
on public.broker_import_run_rows
for select
to authenticated
using (user_id = auth.uid());
