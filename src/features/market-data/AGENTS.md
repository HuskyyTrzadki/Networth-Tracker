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
- Revenue geography read helper: `src/features/market-data/server/get-instrument-revenue-geo-breakdown.ts`
- Revenue source/segment read helper: `src/features/market-data/server/get-instrument-revenue-source-breakdown.ts`
- CompaniesMarketCap annual fallback read helper: `src/features/market-data/server/get-instrument-companiesmarketcap-metrics.ts`
- Polish CPI cache: `src/features/market-data/server/get-polish-cpi-series-cached.ts`
- Shared types: `src/features/market-data/lib/instrument-types.ts`
- TradingView revenue breakdown provider helpers:
  - `src/features/market-data/server/providers/tradingview/types.ts`
  - `src/features/market-data/server/providers/tradingview/symbol-map.ts`
  - `src/features/market-data/server/providers/tradingview/revenue-breakdown-parser.ts`
  - `src/features/market-data/server/providers/tradingview/revenue-geo-parser.ts`
  - `src/features/market-data/server/providers/tradingview/revenue-source-parser.ts`
  - `src/features/market-data/server/providers/tradingview/fetch-revenue-geo.ts`
  - `src/features/market-data/server/providers/tradingview/fetch-revenue-source.ts`
- TradingView batch ingestion scripts:
  - `scripts/tradingview-revenue-breakdown-batch.mjs`
  - `scripts/tradingview-revenue-geo-batch.mjs`
  - `scripts/tradingview-revenue-source-batch.mjs`
  - `scripts/lib/tradingview-revenue-breakdown-batch-core.mjs`
  - `scripts/lib/tradingview-revenue-breakdown-scrape.mjs`
  - `scripts/lib/tradingview-revenue-geo-batch-core.mjs`
  - `scripts/lib/tradingview-revenue-geo-scrape.mjs`
  - `scripts/lib/tradingview-revenue-source-batch-core.mjs`
  - `scripts/lib/tradingview-revenue-source-scrape.mjs`
- CompaniesMarketCap annual fallback scripts:
  - `scripts/companiesmarketcap-batch.mjs`
  - `scripts/lib/companiesmarketcap-batch-core.mjs`
  - `scripts/lib/companiesmarketcap-scrape.mjs`
- Yahoo provider helpers:
  - `src/features/market-data/server/providers/yahoo/yahoo-quote.ts`
  - `src/features/market-data/server/providers/yahoo/yahoo-fx.ts`
  - `src/features/market-data/server/providers/yahoo/yahoo-daily.ts`
  - `src/features/market-data/server/providers/yahoo/yahoo-dividend-signals.ts`

## Boundaries
- Server-only: no client components here.
- Client-safe type surface lives in `src/features/market-data/types.ts`; client code must import market-data DTO types from this file (not from `src/features/market-data/index.ts`, which is server-oriented).
- Provider-specific shapes stay in provider files.
- Cache tables are global (no `user_id`); writes use service role, reads use RLS.
- Quote cache stores normalized daily quote deltas (`dayChange`, `dayChangePercent`) for portfolio daily-movers UI.
- Dividend signals are cache-component based (`use cache` + `cacheLife("days")`) keyed by instrument/providerKey and fetched with bounded concurrency to protect provider/API limits.
- Dividend fetch is fault-tolerant per symbol: one Yahoo failure logs and returns empty signals for that ticker only.
- Yahoo dividend signals are a clean source for report/widget payout history: group `pastEvents` into quarterly/annual per-share totals in the stocks feature instead of deriving dividend history from summary yield/rate fields.
- Yahoo quote normalization falls back to `regularMarketPreviousClose` when provider omits direct day-change fields, so daily movers remain populated.
- Historical daily caches store only real trading sessions. Weekend/holiday carry-forward is resolved at lookup time, not persisted as synthetic rows.
- Historical instrument cache stores optional `adj_close` alongside OHLC, enabling split-safe derived metrics (e.g. PE overlays).
- Daily Yahoo cache writes must de-duplicate by natural key before upsert (`provider + provider_key + price_date` for instruments, `provider + pair + rate_date` for FX) because provider chart payloads can repeat the same session.
- Daily cache lookup is **as-of requested date** (latest row `<= requestedDate`), never latest-in-range, so backfilled snapshots follow true history.
- Macro CPI (Eurostat HICP index level, PL) is cached globally in monthly buckets (`macro_cpi_pl_cache`) and is used to derive cumulative inflation + real return overlays for PLN performance.
- CPI service logs explicit backend diagnostics for cache-read, missing-table, and fetch/parse failures (`[market-data][cpi-pl] ...`) and gracefully falls back to non-cached fetch or empty overlay data.
- TradingView revenue geography ingestion is currently batch-only (local Playwright script), not request-path runtime, and persists into `instrument_revenue_geo_breakdown_cache`.
- TradingView revenue source/segment ingestion is also batch-only and persists into `instrument_revenue_source_breakdown_cache`.
- CompaniesMarketCap annual fallback ingestion is also async-only and persists into:
  - `instrument_companiesmarketcap_slug_cache`
  - `instrument_companiesmarketcap_metric_cache`
- `instrument_revenue_geo_breakdown_cache` is also read by portfolio economic currency-exposure analysis (`/api/portfolio/currency-exposure/economic`) as an enrichment source for per-asset LLM splits.
- TradingView revenue breakdown refresh now has cron-safe backfill paths for both `/api/cron/tradingview-revenue-geo/run` and `/api/cron/tradingview-revenue-source/run`; both select Yahoo equities with missing or stale cache via SQL helper functions, then run the shared Playwright batch runner sequentially with a polite fixed delay (`delayMs`, default 2000).
- Backfill cron runtime loader (`tradingview-revenue-breakdown/run-backfill-cron.ts`) must keep a literal dynamic import path to `scripts/lib/tradingview-revenue-breakdown-batch-core.mjs` to avoid webpack critical-dependency warnings; maintain matching ESM declaration file `scripts/lib/tradingview-revenue-breakdown-batch-core.d.mts` for strict TypeScript builds.
- Do not add synchronous/on-demand TradingView scraping to request paths. Missing geo or source coverage must degrade gracefully in UI/backend until the next async backfill run.
- Do not add synchronous/on-demand CompaniesMarketCap scraping to request paths either. Annual fallback rows must be warmed by cron/manual batch and read from DB only.
- TradingView symbol mapping uses instrument exchanges (`NASDAQ`, `NYSE`, `WSE`) with `WSE` translated to TradingView venue code `GPW` and `.WA` suffix trimmed from Yahoo provider keys.
- TradingView breakdown values are parsed from hydrated DOM rows (`By country` / `Według kraju` and `By source` / `Według źródła`) and normalized to numeric latest + history payloads by label.
- CompaniesMarketCap fallback is annual/TTM-only:
  - metrics: `revenue`, `earnings`, `pe_ratio`, `ps_ratio`,
  - slug resolution is cached per instrument and based on verified name-derived slug candidates,
  - the report should use it only to extend annual history when Yahoo is sparse; quarterly views remain Yahoo-only.
- Public stock reports now consume both cached geography and cached source/segment data; report UI should use the latest mix only until period labels/order are persisted reliably enough for historical chart modes.

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
- `src/features/market-data/server/providers/tradingview/revenue-source-parser.test.ts`
- `src/features/market-data/server/companiesmarketcap/parser.test.ts`
- `src/features/market-data/server/companiesmarketcap/list-backfill-candidates.test.ts`
- TODO: extend daily cache tests with integration-level cache hit/miss + inversion fallback against mocked Supabase rows.
