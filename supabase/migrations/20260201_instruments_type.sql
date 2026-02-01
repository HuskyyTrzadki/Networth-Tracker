-- Add canonical instrument type (Yahoo quoteType) to the per-user instruments cache.
do $$
begin
  create type public.instrument_type as enum (
    'EQUITY',
    'ETF',
    'CRYPTOCURRENCY',
    'MUTUALFUND',
    'CURRENCY',
    'INDEX',
    'OPTION',
    'FUTURE',
    'MONEYMARKET',
    'ECNQUOTE',
    'ALTSYMBOL'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.instruments
  add column if not exists instrument_type public.instrument_type;

comment on column public.instruments.instrument_type is
  'Canonical Yahoo quoteType for the cached instrument (used for allocation & grouping).';
