# Transactions Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Transaction add/import UI and supporting form helpers.
- Later: persistence, validation, and server-side services.

## Main entrypoints
- Dialog UI: `src/features/transactions/components/AddTransactionDialog.tsx`
- Routes: `src/features/transactions/components/AddTransactionDialogRoute.tsx`
- Form schema: `src/features/transactions/lib/add-transaction-form-schema.ts`

## Boundaries
- UI should not depend on provider-specific market data shapes.
- Server logic should live under `src/features/transactions/server/*` (when added).

## Tests
- Add tests next to validators and parsers as `*.test.ts`.
