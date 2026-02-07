-- Add progress metadata for snapshot rebuild polling/status UX.

alter table public.portfolio_snapshot_rebuild_state
  add column if not exists from_date date,
  add column if not exists to_date date,
  add column if not exists processed_until date;

comment on column public.portfolio_snapshot_rebuild_state.from_date is
  'Inclusive start date of currently tracked rebuild window.';

comment on column public.portfolio_snapshot_rebuild_state.to_date is
  'Inclusive end date of currently tracked rebuild window.';

comment on column public.portfolio_snapshot_rebuild_state.processed_until is
  'Latest inclusive bucket_date already processed in the current rebuild window.';

