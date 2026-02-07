# Transactions Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Transaction add/import UI, list view, and supporting form helpers.
- Persistence, validation, and server-side services.
- Transactions always belong to a portfolio (portfolio is created during auth).
- Transactions list supports portfolio filtering (All vs. single portfolio).
- Transactions are grouped by `group_id`, with legs labeled by `leg_role` and `leg_key`.
- Cash instruments are `provider=system`, `instrument_type=CURRENCY`, used for settlement and cashflows.

## Main entrypoints
- Dialog UI: `src/features/transactions/components/AddTransactionDialog.tsx`
- Dialog content/fields: `src/features/transactions/components/AddTransactionDialogContent.tsx`
- Instrument search UI: `src/features/transactions/components/InstrumentCombobox.tsx`
- Instrument logo: `src/features/transactions/components/InstrumentLogoImage.tsx`
- Routes: `src/features/transactions/components/AddTransactionDialogRoute.tsx`
- List UI: `src/features/transactions/components/TransactionsTable.tsx`
- Filters UI: `src/features/transactions/components/TransactionsSearchToolbar.tsx`
- Pagination UI: `src/features/transactions/components/TransactionsPagination.tsx`
- Row actions menu: `src/features/transactions/components/TransactionsRowActions.tsx`
- Form schema: `src/features/transactions/lib/add-transaction-form-schema.ts`
- Decimal helpers: `src/lib/decimal.ts`
- Currency formatting: `src/lib/format-currency.ts`
- Client API: `src/features/transactions/client/create-transaction.ts`
- Server service: `src/features/transactions/server/create-transaction.ts`
- Server settlement logic: `src/features/transactions/server/settlement.ts`
- Cash balances helper: `src/features/transactions/server/get-cash-balances.ts`
- Server query: `src/features/transactions/server/list-transactions.ts`
- Server filters: `src/features/transactions/server/filters.ts`
- Server helper: `src/features/transactions/server/resolve-portfolio-selection.ts`
- API schema: `src/features/transactions/server/schema.ts`
- Trade date rules: `src/features/transactions/lib/trade-date.ts`
- Instrument search service: `src/features/transactions/server/search-instruments.ts`
- Instrument search API: `src/app/api/instruments/search/route.ts`
- Historical price assist service: `src/features/transactions/server/get-instrument-price-on-date.ts`
- Historical price assist API: `src/app/api/instruments/price-on-date/route.ts`

## Boundaries
- UI should not depend on provider-specific market data shapes.
- Server logic lives under `src/features/transactions/server/*` and is called by `src/app/api/transactions/route.ts`.
  - Instrument search is served via `src/app/api/instruments/search/route.ts` and normalizes provider data before returning.
- Global instruments cache stores optional logo URL in `public.instruments.logo_url` for UI branding.
- Global instruments cache stores canonical Yahoo quoteType in `public.instruments.instrument_type` for allocation/grouping.
- Cash settlement uses FX cache at write-time; rate is stored on the cash leg for auditability.
- Past-date transaction support uses a 5-year cap (UI + backend validation).
- Add-transaction form fetches Yahoo daily session data (on date/instrument change) to suggest price and show low/high range.
- Add-transaction modal exposes a calendar date picker field with lower bound from `getTradeDateLowerBound()` and upper bound set to `today`.
- Add-transaction form blocks submit when entered price is outside fetched day-session range (low/high), with inline field error on `price`.
- On past-dated writes, backend marks snapshot dirty range via `portfolio_snapshot_rebuild_state`.

## Tests
- Add tests next to validators and parsers as `*.test.ts`.
- Current tests include trade date validation in `src/features/transactions/lib/trade-date.test.ts`.
