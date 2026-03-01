-- Shared snapshot cache for demo bundles plus a seed rebalance.

create table if not exists public.demo_bundle_snapshot_cache (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.demo_bundles(id) on delete cascade,
  scope public.portfolio_snapshot_scope not null,
  portfolio_template_key text,
  bucket_date date not null,
  captured_at timestamptz not null default now(),
  total_value_pln numeric,
  total_value_usd numeric,
  total_value_eur numeric,
  net_external_cashflow_pln numeric,
  net_external_cashflow_usd numeric,
  net_external_cashflow_eur numeric,
  net_implicit_transfer_pln numeric,
  net_implicit_transfer_usd numeric,
  net_implicit_transfer_eur numeric,
  is_partial_pln boolean not null default false,
  missing_quotes_pln int not null default 0,
  missing_fx_pln int not null default 0,
  as_of_pln timestamptz,
  is_partial_usd boolean not null default false,
  missing_quotes_usd int not null default 0,
  missing_fx_usd int not null default 0,
  as_of_usd timestamptz,
  is_partial_eur boolean not null default false,
  missing_quotes_eur int not null default 0,
  missing_fx_eur int not null default 0,
  as_of_eur timestamptz,
  constraint demo_bundle_snapshot_cache_scope_check
    check (
      (scope = 'ALL' and portfolio_template_key is null)
      or (scope = 'PORTFOLIO' and portfolio_template_key is not null)
    )
);

create unique index if not exists demo_bundle_snapshot_cache_bundle_portfolio_day_key
  on public.demo_bundle_snapshot_cache(bundle_id, portfolio_template_key, bucket_date)
  where scope = 'PORTFOLIO';

create unique index if not exists demo_bundle_snapshot_cache_bundle_all_day_key
  on public.demo_bundle_snapshot_cache(bundle_id, bucket_date)
  where scope = 'ALL';

create index if not exists demo_bundle_snapshot_cache_bundle_scope_day_idx
  on public.demo_bundle_snapshot_cache(bundle_id, scope, bucket_date desc);

alter table public.demo_bundle_snapshot_cache enable row level security;

delete from public.demo_bundle_snapshot_cache
where bundle_id = (
  select id
  from public.demo_bundles
  where slug = 'default'
  limit 1
);

delete from public.demo_bundle_transactions
where bundle_id = (
  select id
  from public.demo_bundles
  where slug = 'default'
  limit 1
);

with resolved_bundle as (
  select id
  from public.demo_bundles
  where slug = 'default'
  limit 1
)
insert into public.demo_bundle_transactions (
  bundle_id,
  portfolio_template_key,
  sort_order,
  asset_source,
  provider,
  provider_key,
  custom_name,
  custom_currency,
  custom_kind,
  custom_valuation_kind,
  custom_annual_rate_pct,
  side,
  cashflow_type,
  trade_date,
  quantity,
  price,
  fee,
  notes,
  consume_cash,
  cash_currency
)
select
  resolved_bundle.id,
  seeded.portfolio_template_key,
  seeded.sort_order,
  seeded.asset_source,
  seeded.provider,
  seeded.provider_key,
  seeded.custom_name,
  seeded.custom_currency,
  seeded.custom_kind,
  seeded.custom_valuation_kind,
  seeded.custom_annual_rate_pct,
  seeded.side::public.transaction_side,
  case
    when seeded.cashflow_type is null then null
    else seeded.cashflow_type::public.cashflow_type
  end,
  seeded.trade_date::date,
  seeded.quantity,
  seeded.price,
  seeded.fee,
  seeded.notes,
  seeded.consume_cash,
  seeded.cash_currency
from resolved_bundle
cross join (
  values
    ('ike-long-term', 1, 'INSTRUMENT', 'system', 'PLN', null, null, null, null, null, 'BUY', 'DEPOSIT', '2022-12-15', 50000, 1, 0, 'Start kapitalu IKE', false, null),
    ('ike-long-term', 2, 'INSTRUMENT', 'yahoo', 'CDR.WA', null, null, null, null, null, 'BUY', null, '2023-01-10', 24, 120, 0, 'Pierwsza pozycja PL', true, 'PLN'),
    ('ike-long-term', 3, 'INSTRUMENT', 'yahoo', 'PEO.WA', null, null, null, null, null, 'BUY', null, '2023-03-05', 18, 110, 0, 'Banki w IKE', true, 'PLN'),
    ('ike-long-term', 4, 'INSTRUMENT', 'system', 'USD', null, null, null, null, null, 'BUY', 'DEPOSIT', '2023-06-01', 18000, 1, 0, 'Zasilenie pod USA', false, null),
    ('ike-long-term', 5, 'INSTRUMENT', 'yahoo', 'AAPL', null, null, null, null, null, 'BUY', null, '2023-06-05', 16, 185, 0, 'Apple do dlugiego terminu', true, 'USD'),
    ('ike-long-term', 6, 'INSTRUMENT', 'yahoo', 'MSFT', null, null, null, null, null, 'BUY', null, '2023-09-12', 10, 335, 0, 'Microsoft po korekcie', true, 'USD'),
    ('ike-long-term', 7, 'INSTRUMENT', 'yahoo', 'GOOGL', null, null, null, null, null, 'BUY', null, '2024-02-20', 14, 138, 0, 'Alphabet jako trzeci filar', true, 'USD'),
    ('ike-long-term', 8, 'INSTRUMENT', 'yahoo', 'CDR.WA', null, null, null, null, null, 'SELL', null, '2024-07-18', 8, 162, 0, 'Czesciowa realizacja zysku', true, 'PLN'),
    ('ike-long-term', 9, 'INSTRUMENT', 'yahoo', 'NVDA', null, null, null, null, null, 'BUY', null, '2024-10-08', 4, 910, 0, 'Dokladka AI', true, 'USD'),
    ('ike-long-term', 10, 'INSTRUMENT', 'yahoo', 'AAPL', null, null, null, null, null, 'SELL', null, '2025-03-14', 4, 228, 0, 'Przyciecie pozycji USA', true, 'USD'),
    ('ike-long-term', 11, 'INSTRUMENT', 'system', 'PLN', null, null, null, null, null, 'BUY', 'DEPOSIT', '2025-09-01', 15000, 1, 0, 'Dodatkowa wplata IKE', false, null),
    ('ike-long-term', 12, 'INSTRUMENT', 'yahoo', 'KTY.WA', null, null, null, null, null, 'BUY', null, '2025-09-03', 7, 820, 0, 'Jakosc przemyslu', true, 'PLN'),
    ('ike-long-term', 13, 'INSTRUMENT', 'system', 'PLN', null, null, null, null, null, 'SELL', 'WITHDRAWAL', '2025-12-10', 3000, 1, 0, 'Symulacja wyplaty gotowki', false, null),
    ('ike-long-term', 14, 'INSTRUMENT', 'yahoo', 'XTB.WA', null, null, null, null, null, 'BUY', null, '2026-01-15', 24, 72, 0, 'Domkniecie ekspozycji PL', true, 'PLN'),
    ('aktywny-mix', 15, 'INSTRUMENT', 'system', 'PLN', null, null, null, null, null, 'BUY', 'DEPOSIT', '2023-01-03', 40000, 1, 0, 'Kapital startowy aktywnego', false, null),
    ('aktywny-mix', 16, 'INSTRUMENT', 'yahoo', 'PKN.WA', null, null, null, null, null, 'BUY', null, '2023-01-12', 50, 62, 0, 'Energetyka PL', true, 'PLN'),
    ('aktywny-mix', 17, 'INSTRUMENT', 'yahoo', 'XTB.WA', null, null, null, null, null, 'BUY', null, '2023-03-14', 35, 38, 0, 'Broker z GPW', true, 'PLN'),
    ('aktywny-mix', 18, 'INSTRUMENT', 'system', 'USD', null, null, null, null, null, 'BUY', 'DEPOSIT', '2023-05-02', 22000, 1, 0, 'Kapital pod USA', false, null),
    ('aktywny-mix', 19, 'INSTRUMENT', 'yahoo', 'MSFT', null, null, null, null, null, 'BUY', null, '2023-05-08', 12, 310, 0, 'Core software', true, 'USD'),
    ('aktywny-mix', 20, 'INSTRUMENT', 'yahoo', 'AMZN', null, null, null, null, null, 'BUY', null, '2023-08-21', 18, 126, 0, 'Konsument + cloud', true, 'USD'),
    ('aktywny-mix', 21, 'CUSTOM', null, null, 'Mieszkanie inwestycyjne', 'PLN', 'REAL_ESTATE', 'COMPOUND_ANNUAL_RATE', 4.5, 'BUY', null, '2023-11-10', 1, 280000, 0, 'Nieruchomosc poza rynkiem', false, null),
    ('aktywny-mix', 22, 'CUSTOM', null, null, 'Laptop roboczy', 'PLN', 'COMPUTER', 'COMPOUND_ANNUAL_RATE', -18, 'BUY', null, '2024-01-20', 1, 7000, 0, 'Sprzet do pracy', false, null),
    ('aktywny-mix', 23, 'INSTRUMENT', 'yahoo', 'PKN.WA', null, null, null, null, null, 'SELL', null, '2024-04-18', 12, 67, 0, 'Czesciowa realizacja zysku', true, 'PLN'),
    ('aktywny-mix', 24, 'INSTRUMENT', 'system', 'PLN', null, null, null, null, null, 'BUY', 'DEPOSIT', '2024-05-07', 10000, 1, 0, 'Dodatkowa wplata PL', false, null),
    ('aktywny-mix', 25, 'INSTRUMENT', 'yahoo', 'PEO.WA', null, null, null, null, null, 'BUY', null, '2024-05-12', 18, 155, 0, 'Bankowa rotacja', true, 'PLN'),
    ('aktywny-mix', 26, 'INSTRUMENT', 'yahoo', 'XTB.WA', null, null, null, null, null, 'SELL', null, '2024-10-24', 10, 61, 0, 'Zmniejszenie pozycji', true, 'PLN'),
    ('aktywny-mix', 27, 'INSTRUMENT', 'yahoo', 'NVDA', null, null, null, null, null, 'BUY', null, '2024-12-03', 6, 950, 0, 'Silny trend AI', true, 'USD'),
    ('aktywny-mix', 28, 'INSTRUMENT', 'system', 'USD', null, null, null, null, null, 'SELL', 'WITHDRAWAL', '2025-02-11', 1200, 1, 0, 'Wyplata gotowki USD', false, null),
    ('aktywny-mix', 29, 'INSTRUMENT', 'yahoo', 'CDR.WA', null, null, null, null, null, 'BUY', null, '2025-03-19', 14, 198, 0, 'Powrot do growth PL', true, 'PLN'),
    ('aktywny-mix', 30, 'INSTRUMENT', 'yahoo', 'AMZN', null, null, null, null, null, 'SELL', null, '2025-06-25', 5, 188, 0, 'Sprzedaz czesci e-commerce', true, 'USD'),
    ('aktywny-mix', 31, 'INSTRUMENT', 'system', 'PLN', null, null, null, null, null, 'BUY', 'DEPOSIT', '2025-11-04', 6000, 1, 0, 'Dodatkowe srodki na GPW', false, null),
    ('aktywny-mix', 32, 'INSTRUMENT', 'yahoo', 'KTY.WA', null, null, null, null, null, 'BUY', null, '2025-11-08', 5, 875, 0, 'Jakosc przemyslowa', true, 'PLN')
) as seeded(
  portfolio_template_key,
  sort_order,
  asset_source,
  provider,
  provider_key,
  custom_name,
  custom_currency,
  custom_kind,
  custom_valuation_kind,
  custom_annual_rate_pct,
  side,
  cashflow_type,
  trade_date,
  quantity,
  price,
  fee,
  notes,
  consume_cash,
  cash_currency
);
