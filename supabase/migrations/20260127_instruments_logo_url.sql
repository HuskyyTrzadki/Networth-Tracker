-- Add logo URL to per-user instruments cache so UI can render logos in lists.
-- This keeps logo data alongside the instrument metadata (no duplication in transactions).

alter table public.instruments
  add column if not exists logo_url text;

comment on column public.instruments.logo_url is 'Optional logo URL provided by the market data provider.';
