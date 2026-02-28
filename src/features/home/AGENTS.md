# Home Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Landing page hero and marketing content (PL copy).
- Landing now uses editorial newspaper-style chrome (paper/ink tokens, dashed separators, illustration slot).
- Hero typography/navigation rhythm was tightened (smaller uppercase nav/meta labels, calmer body copy scale, standardized CTA sizing) to match the refreshed shared UI baseline.
- Landing hero headline uses serif display hierarchy, while CTA/metadata keep sans for contrast.
- Hero CTA + illustration + feature pills now use shared tactile white `Card` surfaces (no dashed wireframe boxes for content blocks).
- Landing hero copy should stay compressed: no redundant eyebrow labels, and CTA support text should explain only what the button does not already say.

## Main entrypoints
- `src/features/home/components/HomeHero.tsx`

## Boundaries
- UI only, no app logic.
