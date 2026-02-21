# App Shell Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- App shell layout and navigation (desktop sidebar, mobile bottom nav, "More" sheet).
- Public/report shell layout (sticky top-left `Menu` trigger + top-expanding panel).

## Main entrypoints
- UI: `src/features/app-shell/components/AppShell.tsx`
- UI: `src/features/app-shell/components/AppSidebar.tsx`
- UI: `src/features/app-shell/components/PortfolioSidebarItem.tsx`
- UI: `src/features/app-shell/components/SidebarLinkLabel.tsx`
- UI: `src/features/app-shell/components/ThemeSwitch.tsx`
- UI: `src/features/app-shell/components/ReportShell.tsx`
- Nav config: `src/features/app-shell/lib/nav-items.ts`
- Path helpers: `src/features/app-shell/lib/path.ts`
- Theme helpers: `src/features/app-shell/lib/theme.ts`

## Current UX decisions
- Desktop sidebar uses two explicit sections:
  - app navigation (`Przegląd`, `Akcje`, `Transakcje`)
  - user portfolios list (`Twoje portfele`) with inline `Nowy portfel` action.
- Sidebar column is sticky (`top-0`, `h-svh`); middle content scrolls independently.
- `Przegląd` maps to `/portfolio` and is active only for aggregate view.
- Portfolio detail routes use canonical pathname `/portfolio/<id>`.
- Theme switch is available in desktop footer and mobile "Więcej" sheet.
- Theme preference persists in local storage (`portfolio-theme`) and applies via `:root[data-theme]`.
- `Akcje` points to `/stocks` in desktop + mobile navigation.
- Report routes use `ReportShell` with:
  - sticky `Menu` button in top-left,
  - top sheet with logo, search, `Portfolio management`, and account actions,
  - signed-in state includes `Konto` and `Wyloguj` action.
- `ReportShell` uses a small context with ref-backed menu-open reads and explicit mount/unmount counters so custom menu triggers mount predictably without `useMemo`/`useCallback`.
- Report shell receives auth state from server layout (`/(report)/layout.tsx`) and does not run client-side Supabase session polling anymore.
- Shell chrome was visually normalized with the refreshed design system: tighter uppercase micro-labels for menu triggers, consistent `rounded-md` control styling, and reduced one-off styling in report search/menu surfaces.
- App shell owns global keyboard shortcuts:
  - `/` focuses the active search surface (`app:focus-search` event),
  - `n` opens add-transaction route (portfolio-aware on `/portfolio/<id>`),
  - `Escape` requests modal close (`app:close-modal` event).
- App shell renders a global toast host (`AppToastHost`) and listens for `app:toast` events so features can show success/error feedback without local toast wiring.
- Active desktop sidebar items use an editorial anchor marker: a 2px vertical left rule on the active row in addition to active background/ring states.
- Desktop sidebar portfolio rows expose per-item actions via a 3-dot popover; `Usuń` opens a compact confirmation dialog before portfolio deletion.

## Boundaries
- No domain business logic; UI/navigation only.
- App shell receives data from layouts; no sidebar-specific domain fetches.
- Report shell performs UI/menu state handling and sign-out action call; auth-status read is server-owned.

## Tests
- Path helpers: `src/features/app-shell/lib/path.test.ts`.
- Theme helpers: `src/features/app-shell/lib/theme.test.ts`.
