# Portfolio Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Portfolio UI states (empty state, dashboard shell for holdings later).
- Server helpers for ensuring default portfolio.

## Main entrypoints
- `src/features/portfolio/components/DashboardEmptyState.tsx`
- `src/features/portfolio/server/default-portfolio.ts`

## Boundaries
- UI plus minimal server helpers; calculations will live in a future server module.

## Tests
- `src/features/portfolio/components/DashboardEmptyState.test.tsx`
- `src/features/portfolio/server/default-portfolio.test.ts`
