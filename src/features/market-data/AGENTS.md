# Market Data Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Cache-first quotes and FX rates for portfolio valuation (global cache).
- Provider normalization (Yahoo) with stable, UI-safe shapes.
- MVP: direct FX pairs only (no triangulation); invert FX when only reverse pair is available.

## Main entrypoints
- Quotes cache: `src/features/market-data/server/get-instrument-quotes-cached.ts`
- FX cache: `src/features/market-data/server/get-fx-rates-cached.ts`
- Daily instrument prices cache: `src/features/market-data/server/get-instrument-daily-prices-cached.ts`
- Daily FX rates cache: `src/features/market-data/server/get-fx-daily-rates-cached.ts`
- Polish CPI cache: `src/features/market-data/server/get-polish-cpi-series-cached.ts`
- Shared types: `src/features/market-data/lib/instrument-types.ts`
- Yahoo provider helpers:
  - `src/features/market-data/server/providers/yahoo/yahoo-quote.ts`
  - `src/features/market-data/server/providers/yahoo/yahoo-fx.ts`
  - `src/features/market-data/server/providers/yahoo/yahoo-daily.ts`

## Boundaries
- Server-only: no client components here.
- Provider-specific shapes stay in provider files.
- Cache tables are global (no `user_id`); writes use service role, reads use RLS.
- Historical daily caches store only real trading sessions. Weekend/holiday carry-forward is resolved at lookup time, not persisted as synthetic rows.
- Daily cache lookup is **as-of requested date** (latest row `<= requestedDate`), never latest-in-range, so backfilled snapshots follow true history.
- Macro CPI (Eurostat HICP index level, PL) is cached globally in monthly buckets (`macro_cpi_pl_cache`) and is used to derive cumulative inflation + real return overlays for PLN performance.
- CPI service logs explicit backend diagnostics for cache-read, missing-table, and fetch/parse failures (`[market-data][cpi-pl] ...`) and gracefully falls back to non-cached fetch or empty overlay data.

## Tests
- `src/features/market-data/server/get-fx-rates-cached.test.ts`
- `src/features/market-data/server/get-instrument-daily-prices-cached.test.ts`
- `src/features/market-data/server/get-fx-daily-rates-cached.test.ts`
- `src/features/market-data/server/get-polish-cpi-series-cached.test.ts`
- TODO: extend daily cache tests with integration-level cache hit/miss + inversion fallback against mocked Supabase rows.
