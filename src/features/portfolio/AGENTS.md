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
- `src/features/portfolio/dashboard/widgets/PortfolioValueDailySummaryCard.tsx`
- `src/features/portfolio/dashboard/widgets/PortfolioPerformanceDailySummaryCard.tsx`
- `src/features/portfolio/dashboard/lib/twr.ts`
- `src/features/portfolio/dashboard/lib/chart-helpers.ts`
- `src/features/portfolio/server/default-portfolio.ts`
- `src/features/portfolio/server/list-portfolios.ts`
- `src/features/portfolio/server/create-portfolio.ts`
- `src/features/portfolio/server/get-portfolio-holdings.ts`
- `src/features/portfolio/server/get-portfolio-summary.ts`
- `src/features/portfolio/server/valuation.ts`
- `src/features/portfolio/server/snapshots/compute-portfolio-snapshot.ts`
- `src/features/portfolio/server/snapshots/get-portfolio-snapshot-rows.ts`
- `src/features/portfolio/server/snapshots/get-portfolio-snapshot-series.ts`
- `src/features/portfolio/server/snapshots/run-portfolio-snapshots-cron.ts`
- `src/features/portfolio/server/snapshots/bootstrap-portfolio-snapshot.ts`
- `src/features/portfolio/lib/create-portfolio-schema.ts`
- `src/features/portfolio/lib/portfolio-url.ts`

## Boundaries
- UI plus server helpers; valuation calculations live in `server/valuation.ts`.
- Snapshoty dzienne (PLN/USD/EUR) są liczone backendowo i używane do wykresu wartości, zainwestowanego kapitału i performance (TWR).
- Snapshoty zawierają przepływy: external cashflow (DEPOSIT/WITHDRAWAL) + implicit transfer (asset bez cash legs).
- TWR liczy zwrot dzienny: (V_D - CF_D - V_{D-1}) / V_{D-1}, z restartem serii przy brakach.
- W trybie wartości dla zakresów >1D renderujemy dwie linie: wartość portfela (smooth) + zainwestowany kapitał (step).
- Wykres performance pokazuje linię zwrotów dziennych dla zakresów >1D (bez słupków).
- Zakres 1D pokazuje widgety (zmiana dzienna / zwrot dzienny) zamiast pełnych wykresów.
- Zakres `ALL` czyta pełną historię snapshotów (bez limitu 730 dni).
- Zainwestowany kapitał liczymy jako kumulację: `net_external_cashflow + net_implicit_transfer`.
- Gdy flow snapshot ma luki (`null`), linia zainwestowanego kapitału przerywa się i nie domyślamy brakujących wartości.
- Holdings data from `get_portfolio_holdings` includes `instrument_type` for concentration warnings.
- Holdings with `instrument_type = CURRENCY` are valued at price 1.0 (no quotes); FX is only needed when base currency differs.
- PortfolioSwitcher handles selection only; creation happens in the dialog component.

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
