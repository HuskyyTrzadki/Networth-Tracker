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
- UI primitive `Checkbox` re-exported via `src/features/design-system/components/ui/checkbox.tsx`
- UI primitive `Calendar` re-exported via `src/features/design-system/components/ui/calendar.tsx`
- Shared `DatePicker` lives in `src/features/design-system/components/DatePicker.tsx` with stories in `src/features/design-system/stories/DatePicker.stories.tsx`

## Boundaries
- UI only, no business logic.
- If this folder grows too large, consider moving shared UI to `src/shared/ui/*`.
- Recharts components (donut/area/bar/line) are client-side due to browser rendering.
- Portfolio comparison chart (value vs zainwestowany kapitał) lives in `components/PortfolioComparisonChart.tsx`.
- Daily returns bar chart (legacy/storybook) lives in `components/DailyReturnsBarChart.tsx`.
- Daily returns line chart (dashboard) lives in `components/DailyReturnsLineChart.tsx`.
- Daily returns line chart supports multiple optional comparison overlays with configurable labels/colors/line styles (used by CPI + benchmarks).
- Chart Y axes use adaptive padded domains (`lib/chart-domain.ts`) to reduce "flat line" effect on narrow-value ranges.
- Shared Recharts axis/grid visual config used by dashboard charts lives in `components/chart-styles.ts` to keep value/performance charts visually consistent.
- Shared time-axis tick strategy in `components/chart-styles.ts` switches to 3-month ticks on longer ranges and adds year on year-boundary labels; reused by both dashboard charts.
- Time-axis labels are capitalized for Polish month/day formatting (`Lut`, `Maj`) to keep dashboard typography consistent.
- Visual layering uses stronger background/card separation via theme tokens (`--background` vs `--card`) plus crisp card borders (`black/5` light, `white/10` dark) and subtle ambient shadows in `ChartCard`.
- Global tokens were tuned toward a cooler finance palette (blue/slate) with stronger dark-mode legibility and clearer semantic contrast for primary/action states.
- `ChartCard` uses symmetrical `p-4` spacing and a single internal rhythm (`header` + `content`) so widget chrome remains consistent across portfolio sections.
- Dashboard charts share axis typography/margins/line widths from `components/chart-styles.ts`; benchmark palette is intentionally separated from base return line for better contrast.
- `AllocationDonutChart` supports responsive radius values (`innerRadius`/`outerRadius` as percent) so feature widgets can use full-width chart areas without hardcoded pixel donuts.
- Chart stories live in `stories/Charts.stories.tsx`.
