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
- Dividend signals cache: `src/features/market-data/server/get-instrument-dividend-signals-cached.ts`
- Polish CPI cache: `src/features/market-data/server/get-polish-cpi-series-cached.ts`
- Shared types: `src/features/market-data/lib/instrument-types.ts`
- TradingView revenue-geo provider helpers:
  - `src/features/market-data/server/providers/tradingview/types.ts`
  - `src/features/market-data/server/providers/tradingview/symbol-map.ts`
  - `src/features/market-data/server/providers/tradingview/revenue-geo-parser.ts`
  - `src/features/market-data/server/providers/tradingview/fetch-revenue-geo.ts`
- TradingView batch ingestion scripts:
  - `scripts/tradingview-revenue-geo-batch.mjs`
  - `scripts/lib/tradingview-revenue-geo-batch-core.mjs`
  - `scripts/lib/tradingview-revenue-geo-scrape.mjs`
- Yahoo provider helpers:
  - `src/features/market-data/server/providers/yahoo/yahoo-quote.ts`
  - `src/features/market-data/server/providers/yahoo/yahoo-fx.ts`
  - `src/features/market-data/server/providers/yahoo/yahoo-daily.ts`
  - `src/features/market-data/server/providers/yahoo/yahoo-dividend-signals.ts`

## Boundaries
- Server-only: no client components here.
- Provider-specific shapes stay in provider files.
- Cache tables are global (no `user_id`); writes use service role, reads use RLS.
- Quote cache stores normalized daily quote deltas (`dayChange`, `dayChangePercent`) for portfolio daily-movers UI.
- Dividend signals are cache-component based (`use cache` + `cacheLife("days")`) keyed by instrument/providerKey and fetched with bounded concurrency to protect provider/API limits.
- Dividend fetch is fault-tolerant per symbol: one Yahoo failure logs and returns empty signals for that ticker only.
- Yahoo quote normalization falls back to `regularMarketPreviousClose` when provider omits direct day-change fields, so daily movers remain populated.
- Historical daily caches store only real trading sessions. Weekend/holiday carry-forward is resolved at lookup time, not persisted as synthetic rows.
- Historical instrument cache stores optional `adj_close` alongside OHLC, enabling split-safe derived metrics (e.g. PE overlays).
- Daily cache lookup is **as-of requested date** (latest row `<= requestedDate`), never latest-in-range, so backfilled snapshots follow true history.
- Macro CPI (Eurostat HICP index level, PL) is cached globally in monthly buckets (`macro_cpi_pl_cache`) and is used to derive cumulative inflation + real return overlays for PLN performance.
- CPI service logs explicit backend diagnostics for cache-read, missing-table, and fetch/parse failures (`[market-data][cpi-pl] ...`) and gracefully falls back to non-cached fetch or empty overlay data.
- TradingView revenue geography ingestion is currently batch-only (local Playwright script), not request-path runtime, and persists into `instrument_revenue_geo_breakdown_cache`.
- `instrument_revenue_geo_breakdown_cache` is also read by portfolio economic currency-exposure analysis (`/api/portfolio/currency-exposure/economic`) as an enrichment source for per-asset LLM splits.
- TradingView symbol mapping uses instrument exchanges (`NASDAQ`, `NYSE`, `WSE`) with `WSE` translated to TradingView venue code `GPW` and `.WA` suffix trimmed from Yahoo provider keys.
- TradingView geography values are parsed from hydrated DOM rows (`By country` / `Według kraju`) and normalized to numeric latest + history payloads per country.

## Tests
- `src/features/market-data/server/get-instrument-quotes-cached.test.ts`
- `src/features/market-data/server/get-instrument-dividend-signals-cached.test.ts`
- `src/features/market-data/server/providers/yahoo/yahoo-quote.test.ts`
- `src/features/market-data/server/providers/yahoo/yahoo-dividend-signals.test.ts`
- `src/features/market-data/server/get-fx-rates-cached.test.ts`
- `src/features/market-data/server/get-instrument-daily-prices-cached.test.ts`
- `src/features/market-data/server/get-fx-daily-rates-cached.test.ts`
- `src/features/market-data/server/get-polish-cpi-series-cached.test.ts`
- `src/features/market-data/server/providers/tradingview/symbol-map.test.ts`
- `src/features/market-data/server/providers/tradingview/revenue-geo-parser.test.ts`
- TODO: extend daily cache tests with integration-level cache hit/miss + inversion fallback against mocked Supabase rows.
