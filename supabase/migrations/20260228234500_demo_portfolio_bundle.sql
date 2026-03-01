-- Demo bundle templates for guest-owned onboarding portfolios.

create table if not exists public.demo_bundles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.demo_bundle_portfolios (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.demo_bundles(id) on delete cascade,
  template_key text not null,
  name text not null,
  base_currency text not null check (char_length(base_currency) = 3),
  is_tax_advantaged boolean not null default false,
  sort_order int not null,
  created_at timestamptz not null default now(),
  unique (bundle_id, template_key),
  unique (bundle_id, sort_order)
);

create table if not exists public.demo_bundle_transactions (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.demo_bundles(id) on delete cascade,
  portfolio_template_key text not null,
  sort_order int not null,
  asset_source text not null check (asset_source in ('INSTRUMENT', 'CUSTOM')),
  provider text,
  provider_key text,
  custom_name text,
  custom_currency text check (custom_currency is null or char_length(custom_currency) = 3),
  custom_kind text,
  custom_valuation_kind text,
  custom_annual_rate_pct numeric,
  side public.transaction_side not null,
  cashflow_type public.cashflow_type,
  trade_date date not null,
  quantity numeric not null check (quantity > 0),
  price numeric not null check (price >= 0),
  fee numeric not null default 0 check (fee >= 0),
  notes text,
  consume_cash boolean not null default false,
  cash_currency text check (cash_currency is null or char_length(cash_currency) = 3),
  created_at timestamptz not null default now(),
  unique (bundle_id, sort_order),
  constraint demo_bundle_transactions_asset_payload_check
    check (
      (asset_source = 'INSTRUMENT' and provider is not null and provider_key is not null)
      or (
        asset_source = 'CUSTOM'
        and custom_name is not null
        and custom_currency is not null
        and custom_kind is not null
        and custom_valuation_kind is not null
        and custom_annual_rate_pct is not null
      )
    ),
  constraint demo_bundle_transactions_cashflow_check
    check (
      (asset_source = 'INSTRUMENT' and provider = 'system' and cashflow_type is not null)
      or (asset_source = 'INSTRUMENT' and provider <> 'system')
      or asset_source = 'CUSTOM'
    )
);

create index if not exists demo_bundle_portfolios_bundle_sort_idx
  on public.demo_bundle_portfolios(bundle_id, sort_order);

create index if not exists demo_bundle_transactions_bundle_sort_idx
  on public.demo_bundle_transactions(bundle_id, sort_order);

create table if not exists public.demo_bundle_instances (
  user_id uuid not null references auth.users(id) on delete cascade,
  bundle_id uuid not null references public.demo_bundles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, bundle_id)
);

create table if not exists public.demo_bundle_instance_portfolios (
  user_id uuid not null references auth.users(id) on delete cascade,
  bundle_id uuid not null references public.demo_bundles(id) on delete cascade,
  portfolio_template_key text not null,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, bundle_id, portfolio_template_key),
  unique (portfolio_id)
);

create index if not exists demo_bundle_instance_portfolios_user_bundle_idx
  on public.demo_bundle_instance_portfolios(user_id, bundle_id);

alter table public.demo_bundles enable row level security;
alter table public.demo_bundle_portfolios enable row level security;
alter table public.demo_bundle_transactions enable row level security;
alter table public.demo_bundle_instances enable row level security;
alter table public.demo_bundle_instance_portfolios enable row level security;

create policy "Demo bundle instances: select own"
on public.demo_bundle_instances
for select
to authenticated
using (user_id = auth.uid());

create policy "Demo bundle instance portfolios: select own"
on public.demo_bundle_instance_portfolios
for select
to authenticated
using (user_id = auth.uid());

with upserted_bundle as (
  insert into public.demo_bundles (slug, name, is_active)
  values ('default', 'Domyslny pakiet demonstracyjny', true)
  on conflict (slug) do update
    set name = excluded.name,
        is_active = excluded.is_active
  returning id
), resolved_bundle as (
  select id from upserted_bundle
  union all
  select id from public.demo_bundles where slug = 'default'
  limit 1
), deleted_portfolios as (
  delete from public.demo_bundle_portfolios
  where bundle_id = (select id from resolved_bundle)
), deleted_transactions as (
  delete from public.demo_bundle_transactions
  where bundle_id = (select id from resolved_bundle)
)
insert into public.demo_bundle_portfolios (
  bundle_id,
  template_key,
  name,
  base_currency,
  is_tax_advantaged,
  sort_order
)
select
  resolved_bundle.id,
  seeded.template_key,
  seeded.name,
  seeded.base_currency,
  seeded.is_tax_advantaged,
  seeded.sort_order
from resolved_bundle
cross join (
  values
    ('ike-long-term', 'Demo IKE Globalny', 'PLN', true, 1),
    ('aktywny-mix', 'Demo Portfel Aktywny', 'PLN', false, 2)
) as seeded(template_key, name, base_currency, is_tax_advantaged, sort_order);

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
    ('ike-long-term', 2, 'INSTRUMENT', 'yahoo', 'CDR.WA', null, null, null, null, null, 'BUY', null, '2023-01-10', 20, 120, 0, 'Pierwsza pozycja PL', true, 'PLN'),
    ('ike-long-term', 3, 'INSTRUMENT', 'yahoo', 'PEO.WA', null, null, null, null, null, 'BUY', null, '2023-03-05', 15, 110, 0, 'Banki w IKE', true, 'PLN'),
    ('ike-long-term', 4, 'INSTRUMENT', 'system', 'USD', null, null, null, null, null, 'BUY', 'DEPOSIT', '2023-06-01', 12000, 1, 0, 'Zasilenie pod USA', false, null),
    ('ike-long-term', 5, 'INSTRUMENT', 'yahoo', 'AAPL', null, null, null, null, null, 'BUY', null, '2023-06-05', 10, 185, 0, 'Apple do dlugiego terminu', true, 'USD'),
    ('ike-long-term', 6, 'INSTRUMENT', 'yahoo', 'MSFT', null, null, null, null, null, 'BUY', null, '2023-09-12', 6, 335, 0, 'Microsoft po korekcie', true, 'USD'),
    ('ike-long-term', 7, 'INSTRUMENT', 'yahoo', 'GOOGL', null, null, null, null, null, 'BUY', null, '2024-02-20', 8, 138, 0, 'Alphabet jako trzeci filar', true, 'USD'),
    ('ike-long-term', 8, 'INSTRUMENT', 'yahoo', 'CDR.WA', null, null, null, null, null, 'SELL', null, '2024-07-18', 6, 162, 0, 'Czesciowa realizacja zysku', true, 'PLN'),
    ('ike-long-term', 9, 'INSTRUMENT', 'yahoo', 'NVDA', null, null, null, null, null, 'BUY', null, '2024-10-08', 3, 910, 0, 'Dokladka AI', true, 'USD'),
    ('ike-long-term', 10, 'INSTRUMENT', 'yahoo', 'AAPL', null, null, null, null, null, 'SELL', null, '2025-03-14', 3, 228, 0, 'Przyciecie pozycji USA', true, 'USD'),
    ('ike-long-term', 11, 'INSTRUMENT', 'system', 'PLN', null, null, null, null, null, 'BUY', 'DEPOSIT', '2025-09-01', 15000, 1, 0, 'Dodatkowa wplata IKE', false, null),
    ('ike-long-term', 12, 'INSTRUMENT', 'yahoo', 'KTY.WA', null, null, null, null, null, 'BUY', null, '2025-09-03', 5, 820, 0, 'Jakosc przemyslu', true, 'PLN'),
    ('ike-long-term', 13, 'INSTRUMENT', 'system', 'PLN', null, null, null, null, null, 'SELL', 'WITHDRAWAL', '2025-12-10', 3000, 1, 0, 'Symulacja wyplaty gotowki', false, null),
    ('ike-long-term', 14, 'INSTRUMENT', 'yahoo', 'XTB.WA', null, null, null, null, null, 'BUY', null, '2026-01-15', 18, 72, 0, 'Domkniecie ekspozycji PL', true, 'PLN'),
    ('aktywny-mix', 15, 'INSTRUMENT', 'system', 'PLN', null, null, null, null, null, 'BUY', 'DEPOSIT', '2023-01-03', 40000, 1, 0, 'Kapital startowy aktywnego', false, null),
    ('aktywny-mix', 16, 'INSTRUMENT', 'yahoo', 'PKN.WA', null, null, null, null, null, 'BUY', null, '2023-01-12', 40, 62, 0, 'Energetyka PL', true, 'PLN'),
    ('aktywny-mix', 17, 'INSTRUMENT', 'yahoo', 'XTB.WA', null, null, null, null, null, 'BUY', null, '2023-03-14', 25, 38, 0, 'Broker z GPW', true, 'PLN'),
    ('aktywny-mix', 18, 'INSTRUMENT', 'system', 'USD', null, null, null, null, null, 'BUY', 'DEPOSIT', '2023-05-02', 15000, 1, 0, 'Kapital pod USA', false, null),
    ('aktywny-mix', 19, 'INSTRUMENT', 'yahoo', 'MSFT', null, null, null, null, null, 'BUY', null, '2023-05-08', 8, 310, 0, 'Core software', true, 'USD'),
    ('aktywny-mix', 20, 'INSTRUMENT', 'yahoo', 'AMZN', null, null, null, null, null, 'BUY', null, '2023-08-21', 12, 126, 0, 'Konsument + cloud', true, 'USD'),
    ('aktywny-mix', 21, 'CUSTOM', null, null, 'Mieszkanie inwestycyjne', 'PLN', 'REAL_ESTATE', 'COMPOUND_ANNUAL_RATE', 4.5, 'BUY', null, '2023-11-10', 1, 780000, 0, 'Nieruchomosc poza rynkiem', false, null),
    ('aktywny-mix', 22, 'CUSTOM', null, null, 'Laptop roboczy', 'PLN', 'COMPUTER', 'COMPOUND_ANNUAL_RATE', -18, 'BUY', null, '2024-01-20', 1, 9000, 0, 'Sprzet do pracy', false, null),
    ('aktywny-mix', 23, 'INSTRUMENT', 'yahoo', 'PKN.WA', null, null, null, null, null, 'SELL', null, '2024-04-18', 10, 67, 0, 'Czesciowa realizacja zysku', true, 'PLN'),
    ('aktywny-mix', 24, 'INSTRUMENT', 'system', 'PLN', null, null, null, null, null, 'BUY', 'DEPOSIT', '2024-05-07', 10000, 1, 0, 'Dodatkowa wplata PL', false, null),
    ('aktywny-mix', 25, 'INSTRUMENT', 'yahoo', 'PEO.WA', null, null, null, null, null, 'BUY', null, '2024-05-12', 12, 155, 0, 'Bankowa rotacja', true, 'PLN'),
    ('aktywny-mix', 26, 'INSTRUMENT', 'yahoo', 'XTB.WA', null, null, null, null, null, 'SELL', null, '2024-10-24', 8, 61, 0, 'Zmniejszenie pozycji', true, 'PLN'),
    ('aktywny-mix', 27, 'INSTRUMENT', 'yahoo', 'NVDA', null, null, null, null, null, 'BUY', null, '2024-12-03', 4, 950, 0, 'Silny trend AI', true, 'USD'),
    ('aktywny-mix', 28, 'INSTRUMENT', 'system', 'USD', null, null, null, null, null, 'SELL', 'WITHDRAWAL', '2025-02-11', 1200, 1, 0, 'Wyplata gotowki USD', false, null),
    ('aktywny-mix', 29, 'INSTRUMENT', 'yahoo', 'CDR.WA', null, null, null, null, null, 'BUY', null, '2025-03-19', 10, 198, 0, 'Powrot do growth PL', true, 'PLN'),
    ('aktywny-mix', 30, 'INSTRUMENT', 'yahoo', 'AMZN', null, null, null, null, null, 'SELL', null, '2025-06-25', 4, 188, 0, 'Sprzedaz czesci e-commerce', true, 'USD'),
    ('aktywny-mix', 31, 'INSTRUMENT', 'system', 'PLN', null, null, null, null, null, 'BUY', 'DEPOSIT', '2025-11-04', 6000, 1, 0, 'Dodatkowe srodki na GPW', false, null),
    ('aktywny-mix', 32, 'INSTRUMENT', 'yahoo', 'KTY.WA', null, null, null, null, null, 'BUY', null, '2025-11-08', 3, 875, 0, 'Jakosc przemyslowa', true, 'PLN')
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
