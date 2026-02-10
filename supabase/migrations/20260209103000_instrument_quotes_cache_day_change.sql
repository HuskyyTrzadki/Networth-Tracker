alter table public.instrument_quotes_cache
  add column if not exists day_change numeric,
  add column if not exists day_change_percent numeric;
