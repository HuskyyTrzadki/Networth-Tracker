# App Shell Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- App shell layout and navigation (desktop sidebar, mobile bottom nav, "More" sheet).

## Main entrypoints
- UI: `src/features/app-shell/components/AppShell.tsx`
- Nav config: `src/features/app-shell/lib/nav-items.ts`
- Path helpers: `src/features/app-shell/lib/path.ts`

## Boundaries
- No business logic; UI and navigation only.
- Keep components presentational; data should come from parent layouts.

## Tests
- Path helpers unit tests in `src/features/app-shell/lib/path.test.ts`.
