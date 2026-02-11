# Stocks Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Stock screener and stock details experience (`/stocks` + `/stocks/[providerKey]`).
- Cache-first stock chart and valuation/fundamentals retrieval for UI-safe DTOs.
- Optional historical PE overlay computed on request from daily adjusted close and EPS TTM events.

## Main entrypoints
- App pages:
  - `src/app/(app)/stocks/page.tsx`
  - `src/app/(app)/stocks/[providerKey]/page.tsx`
- App API:
  - `src/app/api/stocks/[providerKey]/chart/route.ts`
- Server services:
  - `src/features/stocks/server/get-stocks-screener-cards.ts`
  - `src/features/stocks/server/get-stock-valuation-summary-cached.ts`
  - `src/features/stocks/server/get-eps-ttm-events-cached.ts`
  - `src/features/stocks/server/get-stock-chart-series.ts`
  - `src/features/stocks/server/get-stock-chart-response.ts`
  - `src/features/stocks/server/build-pe-overlay-series.ts`
- UI:
  - `src/features/stocks/components/StockSearchBar.tsx`
  - `src/features/stocks/components/StockScreenerGrid.tsx`
  - `src/features/stocks/components/StockChartCard.tsx`
  - `src/features/stocks/components/StockMetricsGrid.tsx`

## Boundaries
- Route handlers stay thin and delegate to `src/features/stocks/server/*`.
- UI consumes normalized DTOs only; no Yahoo-specific payload shapes in components.
- Screener cards include only `EQUITY` holdings and dedupe by `providerKey`.
- Daily chart ranges (`1M+`) are cache-first via `instrument_daily_prices_cache`; 1D uses direct intraday Yahoo fetch.
- 1D chart uses `includePrePost=true`; if intraday data is unavailable, API returns a resolved fallback range of `1M`.
- QuoteSummary metrics are cached in `instrument_valuation_summary_cache` with TTL 6h.
- EPS TTM events for PE overlay are cached in `instrument_eps_ttm_events_cache` with TTL 30d.
- PE overlay is computed per response (no PE persistence): `adjClose` preferred over `close`, mapped with EPS step-function as-of logic.
- PE source priority is data-driven: trailing TTM EPS first, quarterly-derived TTM second, annual EPS proxy last (no hardcoded date cutoff).
- For PE, `EPS <= 0` maps to `N/M`; missing EPS maps to `-`.

## Tests
- `src/features/stocks/server/build-pe-overlay-series.test.ts`
- TODO: add cache hit/stale-refresh tests for valuation summary and EPS TTM cache services.
- TODO: add route-level tests for `/api/stocks/[providerKey]/chart` range validation + 1D fallback behavior.
