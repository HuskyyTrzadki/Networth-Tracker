# Market Data Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Cache-first quotes and FX rates for portfolio valuation.
- Provider normalization (Yahoo) with stable, UI-safe shapes.
- MVP: direct FX pairs only (no triangulation).

## Main entrypoints
- Quotes cache: `src/features/market-data/server/get-instrument-quotes-cached.ts`
- FX cache: `src/features/market-data/server/get-fx-rates-cached.ts`
- Yahoo provider helpers:
  - `src/features/market-data/server/providers/yahoo/yahoo-quote.ts`
  - `src/features/market-data/server/providers/yahoo/yahoo-fx.ts`

## Boundaries
- Server-only: no client components here.
- Provider-specific shapes stay in provider files.

## Tests
- TODO: add cache hit/miss tests with Supabase stubs.
