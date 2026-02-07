# Portfolio Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Portfolio UI states (empty state + dashboard with holdings summary).
- Portfolio selection + creation UI for multi-portfolio support.
- Server helpers for ensuring default portfolios, holdings, and portfolio summaries.

## Main entrypoints
- `src/features/portfolio/components/DashboardEmptyState.tsx`
- `src/features/portfolio/components/PortfolioSwitcher.tsx`
- `src/features/portfolio/components/CreatePortfolioDialog.tsx`
- `src/features/portfolio/components/PortfolioMobileHeaderActions.tsx`
- `src/features/portfolio/dashboard/PortfolioDashboard.tsx`
- `src/features/portfolio/dashboard/widgets/AllocationWidget.tsx`
- `src/features/portfolio/dashboard/widgets/HoldingsWidget.tsx`
- `src/features/portfolio/dashboard/widgets/PortfolioValueOverTimeWidget.tsx`
- `src/features/portfolio/dashboard/widgets/PortfolioValueOverTimeChart.tsx`
- `src/features/portfolio/dashboard/widgets/PortfolioValueOverTimeHeader.tsx`
- `src/features/portfolio/dashboard/widgets/PortfolioValueDailySummaryCard.tsx`
- `src/features/portfolio/dashboard/widgets/PortfolioPerformanceDailySummaryCard.tsx`
- `src/features/portfolio/dashboard/lib/twr.ts`
- `src/features/portfolio/dashboard/lib/chart-helpers.ts`
- `src/features/portfolio/dashboard/lib/benchmark-config.ts`
- `src/features/portfolio/dashboard/lib/benchmark-performance.ts`
- `src/features/portfolio/server/default-portfolio.ts`
- `src/features/portfolio/server/list-portfolios.ts`
- `src/features/portfolio/server/create-portfolio.ts`
- `src/features/portfolio/server/get-portfolio-holdings.ts`
- `src/features/portfolio/server/get-portfolio-summary.ts`
- `src/features/portfolio/server/valuation.ts`
- `src/features/portfolio/server/get-dashboard-benchmark-series.ts`
- `src/features/portfolio/server/benchmark-series-helpers.ts`
- `src/app/api/benchmarks/series/route.ts`
- `src/features/portfolio/server/snapshots/compute-portfolio-snapshot.ts`
- `src/features/portfolio/server/snapshots/get-portfolio-snapshot-rows.ts`
- `src/features/portfolio/server/snapshots/get-portfolio-snapshot-series.ts`
- `src/features/portfolio/server/snapshots/run-portfolio-snapshots-cron.ts`
- `src/features/portfolio/server/snapshots/bootstrap-portfolio-snapshot.ts`
- `src/features/portfolio/server/snapshots/rebuild-state.ts`
- `src/features/portfolio/server/snapshots/compute-portfolio-snapshot-at-date.ts`
- `src/features/portfolio/server/snapshots/compute-portfolio-snapshot-range.ts`
- `src/features/portfolio/server/snapshots/compute-portfolio-snapshot-range-helpers.ts`
- `src/features/portfolio/server/snapshots/range-market-data.ts`
- `src/features/portfolio/server/snapshots/range-market-data-cursor.ts`
- `src/features/portfolio/server/snapshots/rebuild-chunk-window.ts`
- `src/features/portfolio/server/snapshots/snapshot-rebuild-range-session.ts`
- `src/features/portfolio/server/snapshots/run-snapshot-rebuild.ts`
- `src/app/api/portfolio-snapshots/rebuild/route.ts`
- `src/features/portfolio/dashboard/hooks/useSnapshotRebuild.ts`
- `src/features/portfolio/lib/create-portfolio-schema.ts`
- `src/features/portfolio/lib/portfolio-url.ts`

## Boundaries
- UI plus server helpers; valuation calculations live in `server/valuation.ts`.
- Snapshoty dzienne (PLN/USD/EUR) są liczone backendowo i używane do wykresu wartości, zainwestowanego kapitału i performance (TWR).
- Snapshoty zawierają przepływy: external cashflow (DEPOSIT/WITHDRAWAL) + implicit transfer (asset bez cash legs).
- TWR liczy zwrot dzienny: (V_D - CF_D - V_{D-1}) / V_{D-1}, z restartem serii przy brakach.
- W trybie wartości dla zakresów >1D renderujemy dwie linie: wartość portfela (smooth) + zainwestowany kapitał (step).
- Wykres performance pokazuje linię zwrotu skumulowanego (TWR) dla zakresów >1D.
- Tryby wykresu wartości/performance współdzielą layout widgetu (`portfolio-value-over-time-chart-layout.ts`): wspólna wysokość wykresu, wspólny empty-state i wspólne minimalne `min-height` karty.
- W trybie performance dla zakresów >1D bazowa linia to nominalny zwrot skumulowany, a porównania są opcjonalne (checkboxy): inflacja PL, S&P 500 (VOO), WIG20 (ETFBW20TR), mWIG40 (ETFBM40TR).
- Paleta linii porównań jest rozdzielona tak, aby nie mylić bazowej linii zwrotu z inflacją (większy kontrast kolorów między seriami).
- Benchmarki są przygotowywane po stronie serwera i przeliczane do waluty aktywnej zakładki (PLN/USD/EUR) z użyciem dziennych kursów FX (as-of, cache-first).
- Benchmark overlay jest ładowany leniwie po zaznaczeniu checkboxa i tylko dla wybranego benchmarku + aktywnego zakresu dat (API `/api/benchmarks/series`), aby nie spowalniać bazowego renderu dashboardu.
- Zakres 1D pokazuje widgety (zmiana dzienna / zwrot dzienny) zamiast pełnych wykresów.
- Zakres `ALL` czyta pełną historię snapshotów (bez limitu 730 dni).
- Zainwestowany kapitał liczymy jako kumulację: `net_external_cashflow + net_implicit_transfer`.
- Gdy flow snapshot ma luki (`null`), linia zainwestowanego kapitału przerywa się i nie domyślamy brakujących wartości.
- Holdings data from `get_portfolio_holdings` includes `instrument_type` for concentration warnings.
- Holdings with `instrument_type = CURRENCY` are valued at price 1.0 (no quotes); FX is only needed when base currency differs.
- PortfolioSwitcher handles selection only; creation happens in the dialog component.
- Past-dated transactions mark a dirty range and trigger chunked snapshot rebuild (`portfolio_snapshot_rebuild_state`) so history/performance can be recomputed from the affected date.
- Chunk rebuild now computes per-day snapshots in a range-batch pass (single batched read of transactions + preloaded daily price/FX series, then in-memory day loop), instead of query-heavy day-by-day RPC pipeline.
- Dashboard chart surfaces rebuild status and shows loading state while history is being recomputed.
- Rebuild status hook polls only while `queued/running`, uses server-guided `nextPollAfterMs` (fallback backoff 2s→5s→10s), retries stale `running` states (>90s), and exposes progress fields (`fromDate`, `toDate`, `processedUntil`) for UI progress.
- Rebuild status API also returns backend-computed `progressPercent` derived from (`fromDate`, `toDate`, `processedUntil`) so UI does not own progress math.
- Rebuild API `POST /api/portfolio-snapshots/rebuild` logs chunk lifecycle (`post-start`, `post-finish`, `post-error`) for operational debugging.
- Rebuild worker merges concurrent `dirty_from` updates at chunk finalize (prevents losing backdated writes that arrive during an active rebuild run).
- Rebuild worker is adaptive per request: one POST can process multiple internal chunks under a server time budget (`timeBudgetMs`) with per-chunk day cap (`maxDaysPerRun`), reducing end-to-end rebuild latency.
- Internal chunks in one run now share a single preloaded rebuild session (transactions + daily prices + daily FX loaded once, then reused in-memory across chunks), eliminating repeated DB/provider reads per chunk.
- Daily cache preload validates range coverage quality (start/end + max internal gap), so sparse cache fragments trigger provider refetch instead of creating long flat carry-forward segments.

## Tests
- `src/features/portfolio/components/DashboardEmptyState.test.tsx`
- `src/features/portfolio/components/CreatePortfolioDialog.test.tsx`
- `src/features/portfolio/server/default-portfolio.test.ts`
- `src/features/portfolio/server/list-portfolios.test.ts`
- `src/features/portfolio/server/create-portfolio.test.ts`
- `src/features/portfolio/server/valuation.test.ts`
- `src/features/portfolio/server/snapshots/compute-portfolio-snapshot.test.ts`
- `src/features/portfolio/dashboard/lib/twr.test.ts`
- `src/features/portfolio/dashboard/lib/chart-helpers.test.ts`
- `src/features/portfolio/server/snapshots/get-portfolio-snapshot-rows.test.ts`
- `src/features/portfolio/lib/create-portfolio-schema.test.ts`
- `src/features/portfolio/lib/portfolio-url.test.ts`
- TODO: extend snapshot rebuild tests beyond pure merge helpers (session lifecycle + concurrent dirty update integration) and add tests for as-of compute (`compute-portfolio-snapshot-at-date.ts`).
