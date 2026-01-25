# Auth Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Guest-first auth flows and settings UI.
- Server helpers for auth-related actions and profile updates.

## Main entrypoints
- Server: `src/features/auth/server/service.ts`
- Profiles: `src/features/auth/server/profiles.ts`
- UI: `src/features/auth/ui/AuthSettingsSection.tsx`

## Boundaries
- Server logic only in `server/*`.
- UI must not leak Supabase-specific shapes.

## Notes
- `profiles.last_active_at` is touched by write actions (e.g. transactions) via `touchProfileLastActive`.

## Tests
- Server tests in `src/features/auth/server/*.test.ts`.
