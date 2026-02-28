-- Persist guest upgrade nudge dismissals on the server so they stay dismissed across devices.

alter table public.profiles
  add column if not exists guest_upgrade_nudge_5_dismissed_at timestamptz,
  add column if not exists guest_upgrade_nudge_15_dismissed_at timestamptz;
