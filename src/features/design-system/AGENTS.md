# Design System Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Shared UI primitives and visual tokens used across the app.
- Storybook stories live here for design validation.

## Main entrypoints
- Components: `src/features/design-system/components/*`
- Re-exports: `src/features/design-system/index.ts`
- Stories: `src/features/design-system/stories/*`
- UI primitives (example): `src/components/ui/badge.tsx` re-exported via `src/features/design-system/components/ui/badge.tsx`

## Boundaries
- UI only, no business logic.
- If this folder grows too large, consider moving shared UI to `src/shared/ui/*`.
