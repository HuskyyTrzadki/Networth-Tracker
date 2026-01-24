-- App-level profile metadata for retention and UX.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  upgraded_at timestamptz
);

-- Lock down access to own rows only.
alter table public.profiles enable row level security;

-- Read own profile.
create policy "Profiles: select own"
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

-- Create own profile row.
create policy "Profiles: insert own"
on public.profiles
for insert
to authenticated
with check (user_id = auth.uid());

-- Update own profile row.
create policy "Profiles: update own"
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
