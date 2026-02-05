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
- UI primitives (sidebar, collapsible) re-exported via `src/features/design-system/components/ui/sidebar.tsx` and `src/features/design-system/components/ui/collapsible.tsx`
- UI primitives (alert, avatar) re-exported via `src/features/design-system/components/ui/alert.tsx` and `src/features/design-system/components/ui/avatar.tsx`
- UI primitive `ToggleGroup` re-exported via `src/features/design-system/components/ui/toggle-group.tsx`

## Boundaries
- UI only, no business logic.
- If this folder grows too large, consider moving shared UI to `src/shared/ui/*`.
- Recharts components (donut/area/bar) are client-side due to browser rendering.
- Daily returns bar chart lives in `components/DailyReturnsBarChart.tsx` and is showcased in `stories/Charts.stories.tsx`.
