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
- Layout helpers: `src/features/app-shell/lib/layout.ts`
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
- App shell provides keyboard accessibility anchor points (`Przejdz do tresci` skip link + `#main-content`) for faster keyboard navigation across route content.
- Active desktop sidebar items use an editorial anchor marker: a 2px vertical left rule on the active row in addition to active background/ring states.
- Desktop sidebar portfolio rows expose per-item actions via a 3-dot popover; `Usuń` opens a compact confirmation dialog before portfolio deletion.
- Sidebar `Nowy portfel` create flow navigates to `/portfolio/<id>` after server action success; refresh is handled by App Router revalidation.
- Sidebar portfolio delete (`PortfolioSidebarItem`) executes server action (`delete-portfolio-action`) and redirects to `/portfolio` when the active portfolio is removed.
- Sidebar navigation is optimistic: on plain left-click, active highlight switches immediately to intended destination (including portfolio rows) before pathname commit, then resets to canonical pathname when navigation completes.
- Sidebar links explicitly prefetch on hover intent (`router.prefetch`) and keep `next/link` prefetch enabled, so desktop navigation warms RSC payloads before click.
- Guest users now get a sidebar settings badge driven by server state: normal guests see the existing upgrade pill, while demo guests see a simple `DEMO` badge instead of upgrade pressure.
- Shell-level guest upgrade banner still appears for normal anonymous users after transaction milestones (`>5`, `>15` asset legs), but it is intentionally suppressed for demo guests so demo mode does not look like a real portfolio at risk.
- Demo guests get a reusable `DemoAccountCallout` with one primary exit CTA (`Załóż własny portfel`); it should stay visible in the sidebar footer and again at the bottom of app pages so demo users always have a clear way back to onboarding.
- That demo CTA should reset the anonymous demo session into a fresh non-demo guest session before going to `/onboarding`; it must not be a plain link, otherwise demo and real portfolios get mixed in one account.
- The bottom-page `DemoAccountCallout` is intentionally hidden on `/settings` and `/onboarding` to avoid repeating the same demo guidance on pages that already explain the next step.
- Feature barrel `src/features/app-shell/index.ts` was removed; report/public shell consumers should use direct component imports (for example `ReportShellMenuTrigger`) to avoid pulling unrelated modules into shared chunks.
- Portfolio rows now accept `isDemo` from server portfolio summaries; demo portfolios render a prominent `DEMO` badge directly in the desktop sidebar row.
- Shell-owned page chrome should avoid duplicate context labels; prefer a single page title plus one short scope/status cue instead of stacked eyebrow + title + subtitle variants.

## Boundaries
- No domain business logic; UI/navigation only.
- App shell receives data from layouts; no sidebar-specific domain fetches.
- Report shell performs UI/menu state handling and sign-out action call; auth-status read is server-owned.

## Tests
- Path helpers: `src/features/app-shell/lib/path.test.ts`.
- Theme helpers: `src/features/app-shell/lib/theme.test.ts`.
