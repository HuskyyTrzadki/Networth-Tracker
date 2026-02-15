# Stocks Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Stock screener and stock details experience (`/stocks` + `/stocks/[providerKey]`).
- Cache-first stock chart and valuation/fundamentals retrieval for UI-safe DTOs.
- Beginner-first report flow with progressive disclosure for advanced data.
- Multi-overlay stock chart supports PE, EPS TTM, and Revenue TTM overlays.

## Main entrypoints
- App pages:
  - `src/app/(app)/stocks/page.tsx`
  - `src/app/(report)/stocks/[providerKey]/page.tsx`
  - `src/app/(report)/stocks/[providerKey]/ReportRows.tsx`
  - `src/app/(report)/stocks/[providerKey]/InsightsWidgetsSection.tsx`
  - `src/app/(report)/stocks/[providerKey]/StockReportSidebar.tsx`
  - `src/app/(report)/stocks/[providerKey]/StockReportMainContent.tsx`
  - `src/app/(report)/stocks/[providerKey]/StockReportConceptSections.tsx`
  - `src/app/(report)/stocks/[providerKey]/stock-report-static-data.ts`
  - `src/app/(report)/stocks/[providerKey]/stock-insights-widgets-data.ts`
- App API:
  - `src/app/api/public/stocks/[providerKey]/chart/route.ts`
  - `src/app/api/stocks/[providerKey]/chart/route.ts`
  - `src/app/api/stocks/[providerKey]/trade-markers/route.ts`
- Server services:
  - `src/features/stocks/server/create-public-stocks-supabase-client.ts`
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
  - `src/features/stocks/server/list-stock-trade-markers.ts`
- UI:
  - `src/features/stocks/components/StockSearchBar.tsx`
  - `src/features/stocks/components/StockScreenerGrid.tsx`
  - `src/features/stocks/components/StockChartCard.tsx`
  - `src/features/stocks/components/StockChartPlot.tsx`
  - `src/features/stocks/components/stock-chart-event-markers.ts`
  - `src/features/stocks/components/stock-chart-plot-events.tsx`
  - `src/features/stocks/components/StockMetricsGrid.tsx`
  - `src/features/stocks/components/stock-chart-card-helpers.ts`
  - `src/features/stocks/components/stock-chart-trend.ts`

## Boundaries
- Route handlers stay thin and delegate to `src/features/stocks/server/*`.
- Public market-data chart API (`/api/public/stocks/[providerKey]/chart`) is cookie-less and edge-cacheable with range-based `Cache-Control`.
- Private chart API (`/api/stocks/[providerKey]/chart`) keeps auth guard and delegates to the same response helper.
- Private trade markers API (`/api/stocks/[providerKey]/trade-markers`) returns authenticated user BUY/SELL points for stock report overlays.
- Stock details sections (`StockChartSection`, `StockMetricsSection`, instrument header) use Cache Components (`'use cache'` + `cacheLife` + `cacheTag`) with public Supabase reads.
- Report route keeps public URL `/stocks/[providerKey]` and now uses a 2-column clarity-first layout:
  - left rail: quick facts + company profile + CEO/compensation + insider trades,
  - right rail: chart-first reading stream with business/geo tables, balance-sheet snapshot, earnings-call summary, peers, and expandable deep-dive notes.
- Report route includes an `Insights Widgets` section in the main reading stream:
  - small quarter-based charts (FCF, cash/debt, dividends, shares outstanding, expenses, valuation),
  - centered modal drill-down per widget with larger chart and explanatory copy,
  - v1 data source is intentionally hardcoded and shared across all tickers.
- Report content sections (`What They Own & Owe`, `Revenue by Products`, `Revenue by Geography`, `Earnings Call Summary`, peers, and deep dives) are currently hardcoded mock content pending provider wiring.
- Report content includes additional hardcoded concept blocks with quarter/year toggles:
  - revenue allocation ("Gdzie trafia kazda zlotowka przychodu"),
  - year-over-year KPI block ("Ten rok vs poprzedni rok"),
  - free-cash-flow explainer section.
- Concept-heavy sections expose hover tooltips via an `i` icon to clarify definitions in-place.
- Report page uses placeholder illustrations from `picsum.photos` until final generated engravings are delivered.
- UI consumes normalized DTOs only; no Yahoo-specific payload shapes in components.
- Screener cards render a larger 1-month (`1M`) preview chart with visible X/Y axes and a monthly percentage tag sourced from cache-first daily price series.
- Daily chart ranges (`1M+`) are cache-first via `instrument_daily_prices_cache`; 1D uses direct intraday Yahoo fetch.
- Supported ranges: `1D`, `1M`, `3M`, `6M`, `1Y`, `3Y`, `5Y`, `10Y`, `ALL`.
- 1D chart uses `includePrePost=true`; if intraday data is unavailable, API returns fallback range `1M`.
- 10Y chart resolves to `ALL` when full 10-year coverage does not exist.
- Chart supports two display modes: `Trend (100)` and `Raw`.
- Price line color is semantic by selected-range trend:
  - up -> `--profit`,
  - down -> `--loss`,
  - flat -> `--chart-1`.
- Chart draw animation is intentionally slower and reduced-motion safe.
- `StockChartCard` overlays optional buy/sell trade markers from authenticated transactions.
- `StockChartCard` supports optional mock event markers (`Wyniki (konsensus vs raport)`, `Wazne wydarzenia`) rendered as vertical guides with top-band dots, hover highlight, and floating cards:
  - earnings card: estimate vs reported for both revenue and EPS,
  - company event card: headline, short context, and placeholder image.
  - global event card (`Wazne wydarzenia globalne`) with separate marker color and placeholder image.
  - optional `BUY/SELL uzytkownika (mock)` markers use plus/minus icons with size scaled by mocked position value.
  - event overlays are enabled only on longer ranges (`3Y`, `5Y`, `10Y`, `ALL`) and are generated as yearly mocked markers.

## Tests
- `src/features/stocks/components/stock-chart-card-helpers.test.ts`
- `src/features/stocks/components/stock-chart-trend.test.ts`
- `src/features/stocks/server/build-stock-overlay-series.test.ts`
- `src/features/stocks/server/fundamental-time-series.test.ts`
- `src/features/stocks/server/get-stock-chart-http-response.test.ts`
- `src/features/stocks/server/parse-stock-chart-query.test.ts`
- `src/app/api/public/stocks/[providerKey]/chart/route.test.ts`
- `src/app/api/stocks/[providerKey]/chart/route.test.ts`
