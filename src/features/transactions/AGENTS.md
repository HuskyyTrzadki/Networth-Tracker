# Transactions Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Transaction add/import UI, list view, and supporting form helpers.
- Persistence, validation, and server-side services.
- Transactions always belong to a portfolio (portfolio is created during auth).
- Transactions list supports portfolio filtering (All vs. single portfolio).

## Main entrypoints
- Dialog UI: `src/features/transactions/components/AddTransactionDialog.tsx`
- Instrument search UI: `src/features/transactions/components/InstrumentCombobox.tsx`
- Instrument logo: `src/features/transactions/components/InstrumentLogoImage.tsx`
- Routes: `src/features/transactions/components/AddTransactionDialogRoute.tsx`
- List UI: `src/features/transactions/components/TransactionsTable.tsx`
- Filters UI: `src/features/transactions/components/TransactionsSearchToolbar.tsx`
- Pagination UI: `src/features/transactions/components/TransactionsPagination.tsx`
- Row actions menu: `src/features/transactions/components/TransactionsRowActions.tsx`
- Form schema: `src/features/transactions/lib/add-transaction-form-schema.ts`
- Decimal helpers: `src/features/transactions/lib/decimal.ts`
- Currency formatting: `src/features/transactions/lib/format-currency.ts`
- Client API: `src/features/transactions/client/create-transaction.ts`
- Server service: `src/features/transactions/server/create-transaction.ts`
- Server query: `src/features/transactions/server/list-transactions.ts`
- Server filters: `src/features/transactions/server/filters.ts`
- Server helper: `src/features/transactions/server/resolve-portfolio-id.ts`
- API schema: `src/features/transactions/server/schema.ts`
- Instrument search service: `src/features/transactions/server/search-instruments.ts`
- Instrument search API: `src/app/api/instruments/search/route.ts`

## Boundaries
- UI should not depend on provider-specific market data shapes.
- Server logic lives under `src/features/transactions/server/*` and is called by `src/app/api/transactions/route.ts`.
  - Instrument search is served via `src/app/api/instruments/search/route.ts` and normalizes provider data before returning.
- Instruments cache stores optional logo URL in `public.instruments.logo_url` for UI branding.

## Tests
- Add tests next to validators and parsers as `*.test.ts`.
