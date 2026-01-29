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
- `src/features/portfolio/dashboard/widgets/TotalValueWidget.tsx`
- `src/features/portfolio/dashboard/widgets/HoldingsWidget.tsx`
- `src/features/portfolio/server/default-portfolio.ts`
- `src/features/portfolio/server/list-portfolios.ts`
- `src/features/portfolio/server/create-portfolio.ts`
- `src/features/portfolio/server/get-portfolio-holdings.ts`
- `src/features/portfolio/server/get-portfolio-summary.ts`
- `src/features/portfolio/server/valuation.ts`
- `src/features/portfolio/lib/create-portfolio-schema.ts`
- `src/features/portfolio/lib/portfolio-url.ts`

## Boundaries
- UI plus server helpers; valuation calculations live in `server/valuation.ts`.
- PortfolioSwitcher handles selection only; creation happens in the dialog component.

## Tests
- `src/features/portfolio/components/DashboardEmptyState.test.tsx`
- `src/features/portfolio/components/CreatePortfolioDialog.test.tsx`
- `src/features/portfolio/server/default-portfolio.test.ts`
- `src/features/portfolio/server/list-portfolios.test.ts`
- `src/features/portfolio/server/create-portfolio.test.ts`
- `src/features/portfolio/server/valuation.test.ts`
- `src/features/portfolio/lib/create-portfolio-schema.test.ts`
- `src/features/portfolio/lib/portfolio-url.test.ts`
