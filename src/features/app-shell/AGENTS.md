# App Shell Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- App shell layout and navigation (desktop sidebar, mobile bottom nav, "More" sheet).

## Main entrypoints
- UI: `src/features/app-shell/components/AppShell.tsx`
- UI: `src/features/app-shell/components/AppSidebar.tsx`
- Nav config: `src/features/app-shell/lib/nav-items.ts`
- Path helpers: `src/features/app-shell/lib/path.ts`

## Current UX decisions
- Desktop sidebar uses two explicit sections:
  - app navigation (`Przegląd`, `Transakcje`)
  - user portfolios list (`Portfele`) with `Nowy portfel` action.
- `Przegląd` maps to `/portfolio` and is active only for aggregate view (`no ?portfolio` or `portfolio=all`).
- Portfolio rows use subdued monospace currency labels and stronger active state (accent icon + semibold text).

## Boundaries
- No business logic; UI and navigation only.
- Data flows from App Router layout into the shell; no client fetches in the sidebar.

## Tests
- Path helpers unit tests in `src/features/app-shell/lib/path.test.ts`.
