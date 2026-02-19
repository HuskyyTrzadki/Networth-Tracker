-- Make custom instrument creation idempotent per transaction request.

alter table public.custom_instruments
  add column if not exists client_request_id uuid;

comment on column public.custom_instruments.client_request_id is
  'Idempotency key for instrument creation (ties the first transaction request to this custom instrument).';

update public.custom_instruments
set client_request_id = gen_random_uuid()
where client_request_id is null;

alter table public.custom_instruments
  alter column client_request_id set not null;

create unique index if not exists custom_instruments_user_client_request_id_key
  on public.custom_instruments(user_id, client_request_id);

