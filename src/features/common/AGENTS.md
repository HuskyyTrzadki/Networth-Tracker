# Common Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Shared, simple UI primitives used across features (not a design system).
- Shared client hooks reused across features to keep UI async patterns consistent.

## Main entrypoints
- `src/features/common/components/Container.tsx`
- `src/features/common/hooks/use-keyed-async-resource.ts`
- `src/features/common/hooks/use-debounced-callback.ts`
- `src/features/common/lib/remote-image.ts`
- `src/features/common/lib/logo-dev.ts`

## Boundaries
- Keep components generic and small.
- Hooks in this feature should stay UI-agnostic (no domain-specific payload shapes).
- `use-debounced-callback` keeps a stable callable wrapper and manages debounce instance lifecycle in effects (no `useMemo`/`useCallback` dependency).
- `remote-image` helper builds same-origin proxy URLs for remote assets so `next/image` can stay optimized without component-level passthrough loaders; proxy responses use long cache headers for logos (7d fresh + 30d stale).
- `logo-dev` helper builds normalized ticker fallback proxy URLs (`/api/public/image?ticker=...`) and server-side `logo.dev` remote URLs with token injection handled in route layer.
