# Auth Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Guest-first auth flows and settings UI.
- Server helpers for auth-related actions and profile updates.
- Auth flow ensures profile availability; portfolio creation is user-driven.
- Email/password sign-up and sign-in (routes + settings UI).

## Main entrypoints
- Server: `src/features/auth/server/service.ts`
- Server: `src/features/auth/server/request-origin.ts`
- Client: `src/features/auth/client/auth-api.ts`
- Profiles: `src/features/auth/server/profiles.ts`
- UI: `src/features/auth/ui/AuthSettingsSection.tsx`
- UI: `src/features/auth/ui/AuthLoginPanel.tsx`
- Routes: `src/app/api/auth/signin/email/route.ts`, `src/app/api/auth/signup/email/route.ts`
- Page: `src/app/(report)/login/page.tsx`

## Boundaries
- Server logic only in `server/*`.
- UI must not leak Supabase-specific shapes.

## Notes
- `profiles.last_active_at` is touched by write actions (e.g. transactions) via `touchProfileLastActive`.
- `profiles` now also persists guest-upgrade nudge dismissals (`guest_upgrade_nudge_5_dismissed_at`, `guest_upgrade_nudge_15_dismissed_at`) so guest warnings can be dismissed permanently across devices.
- Guest upgrade nudges now emit lightweight Supabase analytics events (`guest_upgrade_nudge_events`) for `shown`, `dismissed`, and `upgraded`, without adding a third-party tracker.
- Email/password sign-up uses callback `next=/onboarding`, so confirmed registrations continue through onboarding before portfolio work.
- Settings auth UI is now state-driven:
  - `signedOut`: minimal login/register form + Google sign-in.
  - `guest`: minimal upgrade actions (Google/email) + short 60-day retention note.
  - `signedIn`: compact account status + sign-out, without guest messaging.
- Guest upgrade nudges are server-derived from `user.is_anonymous` plus count of `transactions.leg_role = 'ASSET'`; milestones are `>5` and `>15`, with the stronger second nudge taking precedence.
- Anonymous demo accounts are treated separately from normal guests:
  - shell upgrade banner is suppressed,
  - sidebar settings chip shows `DEMO` instead of upgrade messaging,
  - settings panel explains that the next step is to return to onboarding and start a real portfolio,
  - demo settings intentionally hide Google/email upgrade controls and show only one primary CTA back to onboarding.
- Demo exit CTAs must not be plain links: they should reset the anonymous demo session into a fresh non-demo anonymous session before redirecting to `/onboarding`, so demo and real portfolios never mix under one guest account.
- Avoid exporting server-only auth UI through broad feature barrels when client/report code only needs one safe button; prefer direct imports for mixed server/client auth surfaces.
- Signed-in Google CTA semantics were corrected: no more "Kontynuuj z Google" when already logged in; signed-in users can only see Google linking action when not linked.
- Auth callback and signup confirmation redirects now resolve origin via forwarded headers (`x-forwarded-host/proto`) to avoid accidental localhost redirects behind proxies.
- Auth API routes (`/api/auth/*`) now return RFC7807-lite error payloads via shared helper (`src/lib/http/api-error.ts`), so clients can rely on machine-readable `error.code` + `requestId`.
- Auth UI email/sign-out mutations now go through one shared client (`src/features/auth/client/auth-api.ts`) that maps errors through `toClientError` and exposes consistent user-facing messages.
- Auth UI async mutation flow is normalized via shared helper `src/features/auth/ui/auth-action-runner.ts` (`before -> run -> success/error -> after`), so `AuthActions` and `AuthLoginPanel` avoid duplicated pending/notice try-catch blocks.
- Dedicated `/login` report page reuses existing auth APIs (Google OAuth + email/password sign-in/sign-up) with editorial layout.
- Auth surfaces were visually normalized to shared UI rhythm (button heights, section radii, status panel shape) while preserving existing auth flow behavior and copy.
- Auth settings and login wrappers now use the shared tactile `Card` primitive (`bg-white`, subtle shadow token, light border) instead of one-off container styling.
- Auth forms now keep a constrained inner width (`max-w-md`) to avoid over-wide desktop inputs.
- Login/register mode switch uses compact typography tabs with dashed underline active state; OAuth/email split uses explicit `lub` divider.
- Auth marketing/supporting copy should stay terse: avoid repeating `konto`/`logowanie` in eyebrow, title, and description when the page already provides that context.

## Tests
- Server tests in `src/features/auth/server/*.test.ts`.
