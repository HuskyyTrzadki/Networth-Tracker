# Auth Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Guest-first auth flows and settings UI.
- Server helpers for auth-related actions and profile updates.
- Auth flow ensures a default portfolio exists for every user.
- Email/password sign-up and sign-in (routes + settings UI).

## Main entrypoints
- Server: `src/features/auth/server/service.ts`
- Profiles: `src/features/auth/server/profiles.ts`
- UI: `src/features/auth/ui/AuthSettingsSection.tsx`
- Routes: `src/app/api/auth/signin/email/route.ts`, `src/app/api/auth/signup/email/route.ts`

## Boundaries
- Server logic only in `server/*`.
- UI must not leak Supabase-specific shapes.

## Notes
- `profiles.last_active_at` is touched by write actions (e.g. transactions) via `touchProfileLastActive`.

## Tests
- Server tests in `src/features/auth/server/*.test.ts`.
