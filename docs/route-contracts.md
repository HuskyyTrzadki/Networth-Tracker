# Route Contracts (Next.js 16)

Purpose: define an explicit caching/dynamic contract for each route so we avoid accidental regressions in performance, correctness, and data privacy.

## Contract Types

- `static`: safe to pre-render and share.
- `dynamic-private`: depends on auth/cookies/user state. Never publicly cache.
- `dynamic-private-cached`: dynamic route that uses Cache Components private cache (`"use cache: private"`) + tag invalidation.
- `public-edge-cached-api`: public endpoint with CDN cache headers (`s-maxage`, `stale-while-revalidate`).
- `private-no-store-api`: authenticated endpoint with `Cache-Control: private, no-store`.

## Pages

| Route | Contract | Why |
|---|---|---|
| `/` | `dynamic-private` | Reads auth cookie and redirects signed-in user. |
| `/login` | `dynamic-private` | Login page redirects authenticated users to app dashboard. |
| `/pricing` | `static` | Public marketing/pricing content, no user data. |
| `/(app)/search` | `static` redirect | Permanent app redirect to `/stocks`; no user data read. |
| `/(app)/settings` | `dynamic-private` (UI-level) | Settings UI is user-facing; route may vary by auth status via client/server boundaries. |
| `/(app)/onboarding` | `dynamic-private` | Reads authenticated user + user portfolios. |
| `/(app)/stocks` | `dynamic-private` | Auth-gated screener shell + user-scoped state. |
| `/stocks/[providerKey]` | `dynamic + cached parts` | Public report page composes cached instrument/summary/chart server sections. |
| `/(app)/transactions` | `dynamic-private-cached` | Uses private cache (`"use cache: private"`) for list/filter reads. |
| `/(app)/transactions/new` | `dynamic-private` | Reads portfolios/balances for authenticated user. |
| `/(app)/transactions/[transactionId]/edit` | `dynamic-private` | Reads authenticated user transaction group + balances for edit modal/route. |
| `/(app)/transactions/import` | `dynamic-private` | Uses server connection/auth flow; not shareable. |
| `/(app)/portfolio` | `dynamic-private-cached` | Portfolio dashboard data is private and tag-invalidated. |
| `/(app)/portfolio/[portfolioId]` | `dynamic-private-cached` | Same as aggregate view but portfolio-scoped tags. |
| `/(app)/@modal/(.)transactions/new` | `dynamic-private` | Authenticated modal route with user balances/portfolios. |
| `/(app)/@modal/(.)transactions/[transactionId]/edit` | `dynamic-private` | Authenticated intercepted edit modal route. |
| `/(app)/@modal/(.)transactions/import` | `dynamic-private` | Authenticated modal route. |

## API Routes

| Route | Contract | Why |
|---|---|---|
| `/api/public/stocks/[providerKey]/chart` | `public-edge-cached-api` | Public market data, shared by URL, explicit edge cache headers. |
| `/api/stocks/[providerKey]/chart` | `private-no-store-api` | Authenticated version of stock chart endpoint. |
| `/api/stocks/[providerKey]/trade-markers` | `private-no-store-api` | User-scoped buy/sell markers for stock report chart overlays. |
| `/api/portfolio-snapshots/rebuild` | `private-no-store-api` | User-scoped rebuild state/work + revalidation side effects. |
| `/api/portfolio-snapshots/rows` | `private-no-store-api` | Lazy full-history snapshot rows for authenticated user. |
| `/api/portfolio-snapshots/bootstrap` | `private-no-store-api` | User-scoped bootstrap trigger. |
| `/api/portfolios` | `private-no-store-api` | Portfolio list/create is user-specific. |
| `/api/portfolios/[portfolioId]` | `private-no-store-api` | Portfolio delete endpoint (auth + ownership + invalidation). |
| `/api/transactions` | `private-no-store-api` | Mutation endpoint with cache invalidation. |
| `/api/transactions/[transactionId]` | `private-no-store-api` | Authenticated transaction edit/delete endpoint with cache invalidation. |
| `/api/transactions/fx-preview` | `private-no-store-api` | User-scoped transaction preview inputs. |
| `/api/transactions/cash-balance-on-date` | `private-no-store-api` | User cash balance lookup. |
| `/api/instruments/search` | `private-no-store-api` | App-auth scoped instrument search flow. |
| `/api/instruments/price-on-date` | `private-no-store-api` | Authenticated historical price helper. |
| `/api/benchmarks/series` | `private-no-store-api` | User dashboard benchmark series by requested dates. |
| `/api/auth/*` | `private-no-store-api` | Session/auth lifecycle endpoints. |
| `/api/cron/portfolio-snapshots/run` | `private-no-store-api` (token-protected) | Operational job endpoint, never public-cacheable. |

## Invalidation Contract

Primary tags:

- `portfolio:all`
- `portfolio:<id>`
- `transactions:all`
- `transactions:portfolio:<id>`
- `stock:<providerKey>`
- `stock:<providerKey>:chart`

Write flows that must invalidate:

- Transaction writes (create/edit/delete): portfolio + transactions tags and path revalidation.
- Portfolio create: portfolio + transactions tags and path revalidation.
- Snapshot rebuild updates: portfolio tags and portfolio paths.

## Rules for New Routes

Before adding a route, decide and document:

1. Is route output user-specific?
2. If yes, use `dynamic-private` or `dynamic-private-cached`, never public edge cache.
3. If public, define explicit cache headers and stale strategy.
4. For expensive reads, use Cache Components (`"use cache"` / `"use cache: private"`) with tags.
5. Define invalidation source (`revalidateTag`/`revalidatePath`) for every mutation.

## Maintenance

When changing route behavior:

- Update this file in the same PR.
- If contract changes, mention it in `AGENTS.md` architecture snapshot.
