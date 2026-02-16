# Common Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Shared, simple UI primitives used across features (not a design system).
- Shared client hooks reused across features to keep UI async patterns consistent.

## Main entrypoints
- `src/features/common/components/Container.tsx`
- `src/features/common/hooks/use-keyed-async-resource.ts`
- `src/features/common/hooks/use-debounced-callback.ts`

## Boundaries
- Keep components generic and small.
- Hooks in this feature should stay UI-agnostic (no domain-specific payload shapes).
- `use-debounced-callback` keeps a stable callable wrapper and manages debounce instance lifecycle in effects (no `useMemo`/`useCallback` dependency).
