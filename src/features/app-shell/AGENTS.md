# App Shell Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- App shell layout and navigation (desktop sidebar, mobile bottom nav, "More" sheet).
- Public/report shell layout (minimal top bar + menu drawer).

## Main entrypoints
- UI: `src/features/app-shell/components/AppShell.tsx`
- UI: `src/features/app-shell/components/AppSidebar.tsx`
- UI: `src/features/app-shell/components/ThemeSwitch.tsx`
- UI: `src/features/app-shell/components/ReportShell.tsx`
- Nav config: `src/features/app-shell/lib/nav-items.ts`
- Path helpers: `src/features/app-shell/lib/path.ts`
- Theme helpers: `src/features/app-shell/lib/theme.ts`

## Current UX decisions
- Desktop sidebar uses two explicit sections:
  - app navigation (`Przegląd`, `Akcje`, `Transakcje`)
  - user portfolios list (`Twoje portfele`) with an inline, visually distinct `Nowy portfel` button directly under the last portfolio row.
- Desktop sidebar column is sticky to viewport (`top-0`, `h-svh`); middle content scrolls independently while footer controls stay pinned.
- `Przegląd` maps to canonical aggregate route `/portfolio` and is active only for aggregate view (no portfolio detail segment).
- Portfolio detail routes use canonical pathname `/portfolio/<id>` (no `?portfolio=` in internal navigation).
- Portfolio rows use subdued monospace currency labels and stronger active state (accent icon + semibold text).
- Sidebar links expose immediate pending feedback via `next/link` status while route payload is streaming.
- Sidebar portfolio list is loaded via private Cache Components caching tagged as `portfolio:all`, so navigation stays warm and portfolio writes can invalidate it.
- Sidebar portfolio-row links use `prefetch={false}` to avoid prefetching every dynamic portfolio route in large lists.
- Theme switch is available in desktop sidebar footer and in mobile "Więcej" sheet.
- Theme preference is persisted in local storage (`portfolio-theme`) and applied via `:root[data-theme]`.
- Theme switch avoids SSR/CSR hydration mismatches by resolving the stored/system theme after mount.
- Sidebar and mobile bottom nav were visually rebalanced to a softer warm-neutral surface system (lower contrast labels, calmer active states, consistent control heights).
- `Akcje` points to `/stocks` and is available in desktop sidebar and mobile "Więcej"; bottom primary nav remains unchanged.
- Report routes use `ReportShell` with top-left `Menu` trigger and a left drawer (search + primary links), while app routes keep persistent sidebar.
- Report shell resolves auth state client-side (Supabase browser client) to avoid forcing public report pages into server dynamic-private rendering.

## Boundaries
- No business logic; UI and navigation only.
- Data flows from App Router layout into the shell; no client fetches in the sidebar.
- Report shell performs lightweight client auth-status reads for nav actions only; no domain business logic.

## Tests
- Path helpers unit tests in `src/features/app-shell/lib/path.test.ts`.
- Theme helper tests in `src/features/app-shell/lib/theme.test.ts`.
