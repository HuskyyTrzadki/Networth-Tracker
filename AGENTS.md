# Repository Guidelines
Write in English. Keep code clean, simple, and production-grade.
im studying for BE interview, so please educate me while we code, espeically tech wise.  pls be interactive, shorter messages instead of huge raports. lets keep dialogue in.

## Core priorities
- Code quality is the top priority.
- Be assertive: propose better solutions when current approach is weak.
- Build for desktop and mobile.
- Reuse existing design system/shadcn patterns; add Storybook stories when a new shared component is introduced.

## Scope
We build a **server-first Portfolio Tracker** (Next.js App Router).

In scope:
- Search instrument by name/ticker
- Add transactions/holdings to portfolio
- Portfolio valuation on delayed quotes
- Multi-currency valuation (minimum PLN + USD)

Out of scope:
- Discovery/screener workflows
- Full fundamental analysis suite / DCF platform

## Stack
- Next.js 16 App Router + TypeScript
- Supabase (Postgres, Auth, RLS)
- Tailwind + shadcn/ui
- Yahoo via `yahoo-finance2` (provider-normalized)
- Cache-first quotes/FX/fundamentals
- `lucide-react` icons

## Engineering rules
- No file over 400 lines. Split/refactor when needed.
- Server-first by default (Server Components + server data prep).
- Keep business logic in repo; avoid SDK-driven logic leakage.
- Every data-heavy route needs Suspense + `loading.tsx`.
- Feature-first structure with explicit public APIs.
- Keep provider-specific response shapes out of UI; normalize in feature/server layer.
- Use `cn()` for class composition.
- Route handlers must be thin: validate input -> service call -> response.
- Validate external provider interfaces against official docs before changing integrations.

## Supabase usage
- Env vars in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- Browser client: `src/lib/supabase/client.ts`
- Server/route handlers: `src/lib/supabase/server.ts` with `cookies()`
- Middleware client: `src/lib/supabase/middleware.ts` + `auth.getSession()`

## Testing requirements
1) Unit/integration (Vitest + RTL)
- Co-locate tests as `*.test.ts` / `*.test.tsx`
- Prefer direct route-handler invocation over spinning servers
- Commands: `npm run test`, `npm run test:watch`

2) E2E (Playwright)
- Cover core flows: search -> add transaction -> portfolio valuation -> FX conversion

After larger changes run:
- `npm run typecheck`
- `npm run test`
- `npm run lint`

## Package manager
Use the package manager implied by the existing lockfile. Do not switch.

## Documentation policy
When shipping feature/architecture changes:
- Update this file if repo-level rules/architecture changed.
- Update the touched feature `AGENTS.md` file(s).
- Keep docs short and current; avoid long historical changelogs.

## Recommended skills (optional)
- Prefer these skills when relevant (recommended, not mandatory):
- `$next-best-practices`
- `$next-cache-components`
- `$design-principles`
- `$database-design`
- `$code-refactoring`

## Already built
- App shell with desktop sidebar + mobile navigation.
- Report shell for public/editorial pages with minimal top bar + menu drawer.
- Canonical portfolio routes: `/portfolio` and `/portfolio/<id>` with legacy query redirects.
- Guest-first auth with upgrade/sign-in flows (Supabase Auth + RLS).
- Transactions:
  - modal add flow,
  - instrument search,
  - historical price assist,
  - settlement/cash guardrails.
- Transactions list with filters, sorting, and portfolio scope.
- Portfolio dashboard:
  - net value hero,
  - value/performance chart modes,
  - allocation + holdings,
  - top movers,
  - recent transactions.
- Snapshot system for history:
  - daily snapshots,
  - chunked rebuild pipeline,
  - rebuild progress UI.
- Stocks module:
  - screener,
  - details chart with ranges and overlays (PE / EPS TTM / Revenue TTM),
  - Trend(100) and Raw modes.
- Public stock chart API with edge caching headers.
- Private dashboard/shell reads cached via Cache Components tags and invalidated on writes.
- Portfolio chart first render optimized with bounded payload + lazy full-history fetch for `ALL`.
- Cache/source diagnostic headers available on key read endpoints.
- Route contracts matrix added: `docs/route-contracts.md` (pages, APIs, cache/dynamic policy, invalidation map).

## Current architecture snapshot
- Canonical portfolio routes:
  - Aggregate: `/portfolio`
  - Single portfolio: `/portfolio/<id>`
  - Legacy `?portfolio=` links are redirected.
- Route split by shell:
  - App shell routes keep sidebar (`/(app)/*`).
  - Report/public shell hosts stock details and login (`/stocks/<providerKey>`, `/login`, `/pricing`).
- App Router uses Cache Components (`cacheComponents: true`) with Suspense boundaries.
- Private dashboard/shell reads use tagged private cache (`portfolio:all`, `portfolio:<id>`, `transactions:*`).
- Write APIs invalidate with `revalidateTag`/`revalidatePath`.
- Public stock chart API (`/api/public/stocks/[providerKey]/chart`) uses edge cache headers (`s-maxage`, `stale-while-revalidate`).
- Stock details support ranges + overlays (PE / EPS TTM / Revenue TTM) with Trend(100) and Raw modes, plus authenticated BUY/SELL markers from user transactions.
- Portfolio chart initial payload is bounded (faster first render); full ALL history is lazy-loaded via authenticated `/api/portfolio-snapshots/rows`.
- Snapshot rebuild pipeline is chunked/adaptive and drives in-widget rebuild progress UI.


## Quality bar
- Readability over clever abstractions.
- Strong typing; avoid `any`/`unknown` unless strictly necessary and narrowed.
- Prefer pure render logic; avoid unnecessary `useEffect`.
- React Compiler is enabled: avoid `useMemo`/`useCallback` unless there is a measured need.
- One component/hook = one clear responsibility.
- Avoid hidden mutable state.
- Avoid fetch-per-row patterns.
- Keep backend code commented enough for a frontend engineer to follow.
- Explain technical decisions clearly in PR/hand-off notes.
- Keep explanations practical and simple so non-experts can follow decisions.

## Copy
- UI copy is Polish only (no i18n layer).

## Feature AGENTS
Keep these files aligned when touching a feature:
- `src/features/app-shell/AGENTS.md`
- `src/features/auth/AGENTS.md`
- `src/features/common/AGENTS.md`
- `src/features/design-system/AGENTS.md`
- `src/features/home/AGENTS.md`
- `src/features/market-data/AGENTS.md`
- `src/features/portfolio/AGENTS.md`
- `src/features/stocks/AGENTS.md`
- `src/features/transactions/AGENTS.md`

## Transactions invariants
- Instruments cache is global (no `user_id`).
- Instrument uniqueness: `provider` + `provider_key`.
- Idempotency: unique `(user_id, client_request_id)`.
- UI money math: no float math; use decimal-safe approach.
- Transactions: positive `quantity`, explicit `side` enum.
- 
projectId supabse: ayeeksbqwyqkevbpdlef