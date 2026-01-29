-- Ensure Yahoo instruments always carry a real provider_key (no empty strings).
-- This keeps market-data lookups deterministic and avoids symbol guesswork.

update public.instruments
  set provider_key = symbol
where provider = 'yahoo'
  and (provider_key is null or char_length(btrim(provider_key)) = 0);

alter table public.instruments
  add constraint instruments_provider_key_required_yahoo
  check (
    provider <> 'yahoo'
    or (provider_key is not null and char_length(btrim(provider_key)) > 0)
  );

create index if not exists instruments_user_provider_key_idx
  on public.instruments(user_id, provider, provider_key);
