-- Lightweight analytics events for guest upgrade nudges.

create table if not exists public.guest_upgrade_nudge_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  step smallint not null check (step in (5, 15)),
  event_type text not null check (event_type in ('shown', 'dismissed', 'upgraded')),
  created_at timestamptz not null default now()
);

create unique index if not exists guest_upgrade_nudge_events_user_step_type_key
  on public.guest_upgrade_nudge_events(user_id, step, event_type);

create index if not exists guest_upgrade_nudge_events_user_created_at_idx
  on public.guest_upgrade_nudge_events(user_id, created_at desc);

alter table public.guest_upgrade_nudge_events enable row level security;

create policy "Guest upgrade nudge events: select own"
on public.guest_upgrade_nudge_events
for select
to authenticated
using (user_id = auth.uid());

create policy "Guest upgrade nudge events: insert own"
on public.guest_upgrade_nudge_events
for insert
to authenticated
with check (user_id = auth.uid());
