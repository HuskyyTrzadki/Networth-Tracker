# Repository Guidelines
Write in English to me. Keep code clean, simple, and production-grade.
I will be let go of job if code is not clean, and i need to have it perfct cause i gotta wake up tomorrow to take my son to hospital for heart transplant, please give your best 102020% otherwise i ll be angry.
CODE NEEDS TO BE CLEAN< its absoulute priority, u need to be assertive, and tell me if what we do can be done better. i only give suggestions.
im studying for BE interview, so please educate me while we code, espeically tech wise.  pls be interactive, shorter messages instead of huge raports. lets keep dialogue in.
u are encouraged to use shadcn components we already have in storybook, when u add new component u think its worth to add to storybook , go for it.
SUPER IMPORTANT, u are encouraged to ask question to tech lead, i will forward your message to him, anytime u struggle or not sure about something. please please let me know, and give me message, so just say something like "i m not sure, ask tech lead what is better here..."
## Core priorities
- Code quality is the top priority.
- Be assertive: propose better solutions when current approach is weak.
- Build for desktop. (mobile we dont care about)
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
- always try to write it simpler, simple is best. do not overengineer.
- Server-first by default (Server Components + server data prep).
- Keep business logic in repo; avoid SDK-driven logic leakage.
- Every data-heavy route needs Suspense + `loading.tsx`.
- Feature-first structure with explicit public APIs.
- Keep provider-specific response shapes out of UI; normalize in feature/server layer.
- Use `cn()` for class composition.
- Route handlers must be thin: validate input -> service call -> response.
- Route handlers must return RFC7807-lite errors via shared HTTP helpers (`src/lib/http/api-error.ts`) using `{ error: { code, message, requestId, details? }, message }`; keep `message` alias for backward compatibility.
- Domain/business failures should throw typed `AppError` (`src/lib/http/app-error.ts`) instead of relying on message-text status mapping.
- Public/heavy endpoints must use shared rate limiting (`src/lib/http/rate-limit.ts`) and return `429` with `Retry-After`.
- Client-side API modules should use shared `requestJson` from `src/lib/http/client-request.ts` for fetch + JSON parsing + RFC7807-lite error mapping (including explicit `allowStatuses` for non-fatal statuses like `401`).
- Validate external provider interfaces against official docs before changing integrations.
- URL query state in client components should use `nuqs` parser maps (avoid manual `URLSearchParams` mutation); use non-shallow updates when server data depends on search params.
- Viewport-gated client rendering should use `useInViewVisibility` (`src/features/common/hooks/use-in-view-visibility.ts`) to keep observer behavior consistent and avoid route-wide motion runtime dependencies.
- Shared chart rendering should go through `src/components/ui/chart.tsx` (`ui/chart`) for container/content styling (`ChartContainer`, `ChartTooltipContent`, `ChartLegendContent`), while runtime chart primitives (`Tooltip`, `Legend`, etc.) should be imported from `src/lib/recharts-dynamic.tsx` to keep non-chart chunks lean.

## Supabase usage
- Env vars in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, optional `LOGO_DEV_PUBLISHABLE_KEY` (recommended, server-held `pk_` token for `/api/public/image?ticker=...` fallback), legacy `LOGO_DEV_SECRET_KEY` still read for backward compatibility
- Browser client: `src/lib/supabase/client.ts`
- Server/route handlers: `src/lib/supabase/server.ts` with `cookies()`
- Middleware client: `src/lib/supabase/middleware.ts` + `auth.getSession()`

## Testing requirements
1) Unit/integration (Vitest + RTL)
- Co-locate tests as `*.test.ts` / `*.test.tsx`
- Prefer direct route-handler invocation over spinning servers
- Vitest must resolve Next.js `server-only` marker imports via the local shim alias (`server-only` -> `src/test/server-only.ts`) to keep server modules testable in jsdom runs.
- Commands: `npm run test`, `npm run test:watch`

2) E2E (Playwright)
- Cover core flows: search -> add transaction -> portfolio valuation -> FX conversion
- Deterministic E2E runs must seed cache fixtures before execution (`npm run e2e:seed`) and assert strict numbers only against seeded data.
- Use `npm run test:e2e` for required deterministic suite and `npm run test:e2e:smoke-live` for optional live smoke checks.
- Live smoke assertions must stay non-numeric (no exact price/FX expectations) to avoid external-data flakiness.

After larger changes run:
- `npm run typecheck`
- `npm run test`
- `npm run lint`

UI-only change exception (styling/layout/copy-only, no business logic/API/data-contract changes):
- Required: `npm run typecheck` and `npm run lint`
- Optional: `npm run test` (skip by default unless the UI change touches fragile flows/components)

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
  - dividend inbox (single-portfolio booking + aggregate awareness),
  - top movers,
  - recent transactions.
- Snapshot system for history:
  - daily snapshots,
  - chunked rebuild pipeline,
  - rebuild progress UI.
- Stocks module:
  - screener,
  - details chart with ranges and overlays (PE / EPS TTM / Revenue TTM),
  - Trend(100) and Raw modes,
  - user watchlist pins (search result star + report star toggle + screener star remove).
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
- App shell PPR rule: do not gate `/(app)` layout with global `connection()` or top-level blocking `cookies()` reads outside Suspense; keep shell streamable and isolate personalized reads inside nested Suspense boundaries/components.
- Root layout wraps app content in `NuqsAdapter` (`nuqs/adapters/next/app`) so query-state hooks are standardized across features.
- Private dashboard/shell reads use tagged private cache (`portfolio:all`, `portfolio:<id>`, `transactions:*`).
- Write APIs invalidate with `revalidateTag`/`revalidatePath`.
- Transactions and portfolio filter controls use `nuqs` query-state parsers for deterministic URL/history behavior.
- Public stock chart API (`/api/public/stocks/[providerKey]/chart`) uses edge cache headers (`s-maxage`, `stale-while-revalidate`).
- Public image proxy (`/api/public/image`) caches logo assets with long-lived edge headers (7d fresh + 30d stale) and supports ticker fallback for `img.logo.dev`.
- Stock details support ranges + overlays (PE / EPS TTM / Revenue TTM) with Trend(100) and Raw modes, plus authenticated BUY/SELL markers from user transactions.
- Stocks watchlist uses `stock_watchlist` (RLS per-user) and powers manual screener pins via:
  - `POST /api/stocks/watchlist`,
  - `DELETE /api/stocks/watchlist/[providerKey]`,
  - status check `GET /api/stocks/watchlist?providerKey=...`.
- Stocks feature import boundary:
  - `src/features/stocks/index.ts` was removed; import stocks services/types by direct file path.
  - client components/hooks must consume stock DTO types/constants from `src/features/stocks/types.ts` (never from server service files) to prevent server dependency leakage into client bundles.
- Market-data import boundary:
  - `src/features/market-data/index.ts` is server-oriented (cache/services),
  - client components/hooks must consume market-data DTO types from `src/features/market-data/types.ts` instead of the server barrel.
- Design-system performance boundary:
  - `src/features/design-system/index.ts` was removed; import design-system modules via direct component paths (for example `components/InfoHint`, `components/Sparkline`).
  - `src/features/transactions/index.ts` was removed; import transaction modules via direct component/server paths.
- Portfolio feature boundary:
  - `src/features/portfolio/index.ts` was removed; import portfolio modules via direct file paths.
- App route import boundary:
  - in `src/app/*`, do not import feature barrels (`@/features/app-shell`, `@/features/auth`, `@/features/home`, `@/features/onboarding`, `@/features/portfolio`, `@/features/stocks`);
  - use direct file paths so route dependency graphs stay explicit and bundle regressions are easier to catch.
- Watchlist add is fail-safe: backend mutation layer (server action + shared service) does synchronous market-data warmup (`instruments` upsert + quote + daily cache fetch) and rolls back watchlist row on warmup failure, so `/stocks` avoids empty cards for user-pinned tickers.
- Stock report watchlist toggle (`StockFavoriteToggleButton`) resolves initial favorite state in a dedicated server Suspense hole (`StockFavoriteToggleSlot`) with private cache tagging, so `/stocks/[providerKey]` streams public report content before personalized star state.
- Portfolio chart initial payload is bounded (faster first render); full ALL history is lazy-loaded via authenticated `/api/portfolio-snapshots/rows`.
- Snapshot rebuild pipeline is chunked/adaptive and drives in-widget rebuild progress UI.
- Onboarding CTA `Otwórz portfel demonstracyjny` now clones a backend-seeded demo bundle into the current guest/authenticated user instead of using a shared demo login.
- Demo bundle V1 includes two portfolios (`IKE` + regular), a prominent `DEMO` badge in portfolio surfaces, broad seeded history (PL + US stocks, custom assets, buys/sells, cash deposits/withdrawals), and must stay idempotent per user.
- Demo snapshot history is optimized via shared cache (`demo_bundle_snapshot_cache`) in copy-on-clone mode: the first generated demo history can be reused by later demo users without shared UI reads or per-user full rebuild waits.
- Portfolio model includes `is_tax_advantaged` (IKE/IKZE) used by dividend smart-default hints.
- Dividend booking is user-confirmed (`/api/dividends/book`) with idempotency key `dividend_event_key`; Yahoo is discovery-only (`/api/dividends/inbox`).
- Portfolio create + dividend booking flows have Server Action mutation boundaries (`createPortfolioAction`, `bookDividendAction`) with cache revalidation; client dialogs no longer post directly to route handlers.
- `/portfolio` data fetching is split: first render resolves summary/snapshots/live totals, while lower-priority widgets (`Alokacja per portfel`, `Ostatnie transakcje`, `Skrzynka dywidend`) stream through separate Suspense boundaries with dedicated private cache loaders.
- Dashboard includes `Ekspozycja walutowa` widget with `Notowania | Gospodarcza` toggle; `Gospodarcza` is user-triggered via `/api/portfolio/currency-exposure/economic` and uses deterministic AI config (`temperature: 0`).
- Economic exposure cache uses instrument-set fingerprint only (sorted `instrumentId`s + scope/model/prompt version), then reweights cached per-asset splits with fresh `valueBase` on each request.
- TradingView revenue geography must stay asynchronous-only: refresh via daily/backfill batch (`/api/cron/tradingview-revenue-geo/run` or CLI batch), never via request-path scraping. If geo cache is missing for Yahoo equities, economic exposure should return a graceful pending state rather than block, scrape, or fake readiness.


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

## Quick lesson: Optimistic UI in React 19 + App Router
- Use `useOptimistic` for instant UI feedback in client components; do not mirror server props into local state via `useEffect`.
- Keep mutations in Server Actions (`"use server"`), not ad-hoc client fetch flows.
- In Server Actions: write data, run required backend warmup, then call `revalidatePath(...)`/`revalidateTag(...)`.
- Treat server output as the single source of truth; optimistic state is temporary and should be replaced by revalidated server payload.
- For optimistic placeholders, render explicit loading UI (`isHydrating` + skeleton/loader), not empty or fake-looking cards.
- Avoid client-side event buses for cross-component data sync when App Router revalidation can provide canonical state.

## Copy
- UI copy is Polish only (no i18n layer). but speak to me in english. 
- Keep page copy compressed: one title, one scope label, one status message. Do not restate the same context in eyebrow, heading, subtitle, and badge.

## Feature AGENTS
Keep these files aligned when touching a feature:
- `src/features/app-shell/AGENTS.md`
- `src/features/auth/AGENTS.md`
- `src/features/common/AGENTS.md`
- `src/features/design-system/AGENTS.md`
- `src/features/home/AGENTS.md`
- `src/features/market-data/AGENTS.md`
- `src/features/onboarding/AGENTS.md`
- `src/features/portfolio/AGENTS.md`
- `src/features/stocks/AGENTS.md`
- `src/features/transactions/AGENTS.md`

## Transactions invariants
- Instruments cache is global (no `user_id`).
- Instrument uniqueness: `provider` + `provider_key`.
- Idempotency: unique `(user_id, client_request_id)`.
- Dividend booking idempotency: unique `(user_id, portfolio_id, dividend_event_key)` for `cashflow_type=DIVIDEND` asset legs.
- UI money math: no float math; use decimal-safe approach.
- Transactions: positive `quantity`, explicit `side` enum.
- 
projectId supabse: ayeeksbqwyqkevbpdlef
pls update this file whenever something important needs to be added as rule.
