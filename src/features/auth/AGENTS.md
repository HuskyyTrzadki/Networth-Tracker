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
- Profiles: `src/features/auth/server/profiles.ts`
- UI: `src/features/auth/ui/AuthSettingsSection.tsx`
- Routes: `src/app/api/auth/signin/email/route.ts`, `src/app/api/auth/signup/email/route.ts`

## Boundaries
- Server logic only in `server/*`.
- UI must not leak Supabase-specific shapes.

## Notes
- `profiles.last_active_at` is touched by write actions (e.g. transactions) via `touchProfileLastActive`.
- Email/password sign-up uses callback `next=/onboarding`, so confirmed registrations continue through onboarding before portfolio work.
- Settings auth UI is now state-driven:
  - `signedOut`: minimal login/register form + Google sign-in.
  - `guest`: minimal upgrade actions (Google/email) + short 60-day retention note.
  - `signedIn`: compact account status + sign-out, without guest messaging.
- Signed-in Google CTA semantics were corrected: no more "Kontynuuj z Google" when already logged in; signed-in users can only see Google linking action when not linked.
- Auth callback and signup confirmation redirects now resolve origin via forwarded headers (`x-forwarded-host/proto`) to avoid accidental localhost redirects behind proxies.

## Tests
- Server tests in `src/features/auth/server/*.test.ts`.
