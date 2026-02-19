-- Extend custom instruments to support non-market assets with deterministic valuation.

alter table public.custom_instruments
  add column if not exists kind text not null default 'REAL_ESTATE',
  add column if not exists valuation_kind text not null default 'COMPOUND_ANNUAL_RATE',
  add column if not exists annual_rate_pct numeric not null default 0;

comment on column public.custom_instruments.kind is
  'Custom instrument category (text to avoid enum churn).';
comment on column public.custom_instruments.valuation_kind is
  'How this custom instrument is valued (e.g. compounding annual rate).';
comment on column public.custom_instruments.annual_rate_pct is
  'Signed annual growth/decay rate percentage for COMPOUND_ANNUAL_RATE valuation.';

do $$
begin
  alter table public.custom_instruments
    add constraint custom_instruments_annual_rate_pct_reasonable
    check (annual_rate_pct > -100 and annual_rate_pct < 1000);
exception
  when duplicate_object then null;
end $$;

