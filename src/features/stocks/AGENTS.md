# Stocks Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Stock screener and stock details experience (`/stocks` + `/stocks/[providerKey]`).
- Cache-first stock chart and valuation/fundamentals retrieval for UI-safe DTOs.
- Optional historical PE overlay computed on request from daily adjusted close and EPS TTM events.
- Multi-overlay stock chart supports PE, EPS TTM, and Revenue TTM trend overlays.

## Main entrypoints
- App pages:
  - `src/app/(app)/stocks/page.tsx`
  - `src/app/(app)/stocks/[providerKey]/page.tsx`
- App API:
  - `src/app/api/public/stocks/[providerKey]/chart/route.ts`
  - `src/app/api/stocks/[providerKey]/chart/route.ts`
- Server services:
  - `src/features/stocks/server/get-stock-chart-http-response.ts`
  - `src/features/stocks/server/get-stocks-screener-cards.ts`
  - `src/features/stocks/server/get-stock-valuation-summary-cached.ts`
  - `src/features/stocks/server/get-eps-ttm-events-cached.ts`
  - `src/features/stocks/server/get-stock-chart-series.ts`
  - `src/features/stocks/server/get-stock-chart-response.ts`
  - `src/features/stocks/server/build-stock-overlay-series.ts`
  - `src/features/stocks/server/get-fundamental-time-series-cached.ts`
  - `src/features/stocks/server/fundamental-time-series.ts`
  - `src/features/stocks/server/parse-stock-chart-query.ts`
- UI:
  - `src/features/stocks/components/StockSearchBar.tsx`
  - `src/features/stocks/components/StockScreenerGrid.tsx`
  - `src/features/stocks/components/StockChartCard.tsx`
  - `src/features/stocks/components/stock-chart-card-helpers.ts`
  - `src/features/stocks/components/StockMetricsGrid.tsx`

## Boundaries
- Route handlers stay thin and delegate to `src/features/stocks/server/*`.
- Public market-data chart API (`/api/public/stocks/[providerKey]/chart`) is cookie-less and edge-cacheable with range-based `Cache-Control`.
- Private chart API (`/api/stocks/[providerKey]/chart`) keeps auth guard and delegates to the same response helper.
- UI consumes normalized DTOs only; no Yahoo-specific payload shapes in components.
- Screener cards include only `EQUITY` holdings and dedupe by `providerKey`.
- Daily chart ranges (`1M+`) are cache-first via `instrument_daily_prices_cache`; 1D uses direct intraday Yahoo fetch.
- Supported ranges: `1D`, `1M`, `3M`, `6M`, `1Y`, `3Y`, `5Y`, `10Y`, `ALL` (`ALL` backfills full provider history cache-first).
- 1D chart uses `includePrePost=true`; if intraday data is unavailable, API returns a resolved fallback range of `1M`.
- 10Y chart requires full 10-year daily coverage; when unavailable (e.g. younger listing), response resolves to `ALL` while preserving `requestedRange=10Y` so UI can disable `10Y` after discovery.
- QuoteSummary metrics are cached in `instrument_valuation_summary_cache` with TTL 6h.
- Overlay fundamentals cache is generic: `instrument_fundamental_time_series_cache` (`eps_ttm`, `revenue_ttm`) with TTL 30d and incremental refresh.
- PE/EPS/Revenue overlays are computed per response (no overlay persistence): `adjClose` preferred over `close`, with as-of step-function mapping.
- EPS and Revenue source priority is data-driven: trailing TTM first, quarterly-derived TTM second, annual proxy last (no hardcoded date cutoff).
- For PE, `EPS <= 0` maps to `N/M`; missing EPS maps to `-`.
- Chart response includes overlay availability and coverage metadata; UI shows partial-coverage warning when range exceeds available fundamentals history.
- Chart supports two display modes: `Trend (100)` (rebased overlays for multi-series shape comparison) and `Raw` (real values, single overlay at a time to avoid mixed-unit clutter).
- Chart renders a legend (price + active overlays, color-coded) with mode-aware labels.
- Price Y-axis is range-aware: `1D/1M/3M/6M/1Y` use padded non-zero min/max to preserve short-term shape, while `3Y/5Y/10Y/ALL` keep zero baseline for long-horizon context.

## Tests
- `src/features/stocks/server/build-stock-overlay-series.test.ts`
- `src/features/stocks/server/fundamental-time-series.test.ts`
- `src/features/stocks/server/get-stock-chart-http-response.test.ts`
- `src/features/stocks/server/parse-stock-chart-query.test.ts`
- `src/app/api/public/stocks/[providerKey]/chart/route.test.ts`
- `src/app/api/stocks/[providerKey]/chart/route.test.ts`
- TODO: add cache hit/stale-refresh tests for valuation summary and EPS TTM cache services.
