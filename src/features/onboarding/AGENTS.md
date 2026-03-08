# Onboarding Feature Notes
This file must be kept up to date by the LLM whenever this feature changes.

## Purpose
- Guide first-time users through fast-start onboarding.
- Provide screenshot import flow that bootstraps a portfolio from holdings.

## Main entrypoints
- Onboarding page: `src/app/(app)/onboarding/page.tsx`
- Wizard UI: `src/features/onboarding/components/OnboardingWizard.tsx`
- Screenshot import modal: `src/features/onboarding/components/ScreenshotImportDialog.tsx`
- Screenshot import steps shell: `src/features/onboarding/components/ScreenshotImportWizard.tsx`
- Screenshot import step UI: `src/features/onboarding/components/ScreenshotImportHeader.tsx`, `src/features/onboarding/components/ScreenshotImportStepPills.tsx`, `src/features/onboarding/components/ScreenshotImportPortfolioStep.tsx`, `src/features/onboarding/components/ScreenshotImportUploadStep.tsx`, `src/features/onboarding/components/ScreenshotImportReviewStep.tsx`
- Screenshot import state/hooks: `src/features/onboarding/components/useScreenshotImportWizard.ts`, `src/features/onboarding/components/useScreenshotImportAutoResolve.ts`, `src/features/onboarding/components/useScreenshotImportPreview.ts`, `src/features/onboarding/components/screenshot-import-utils.ts`, `src/features/onboarding/components/screenshot-import-types.ts`
- Upload dropzone: `src/features/onboarding/components/ScreenshotUploadDropzone.tsx`
- Review table: `src/features/onboarding/components/ScreenshotHoldingsTable.tsx`

## APIs
- Parse screenshots: `POST /api/onboarding/screenshot/parse`
- Commit import: `POST /api/onboarding/screenshot/commit`
- Commit import to existing portfolio: `POST /api/transactions/screenshot/commit`
- USD preview for review step: `POST /api/transactions/screenshot/preview`

## Notes
- Screenshot parsing uses Gemini vision (`gemini-3-flash-preview`) and only extracts ticker + quantity.
- Exact duplicates (same ticker + same quantity) are deduped silently; different quantities remain separate rows.
- Commit creates a new portfolio, writes BUY transactions dated today with `consumeCash=false`, and bootstraps snapshots for today.
- Bootstrap writes include notes tag `[SYSTEM: ONBOARDING_BOOTSTRAP]` for later reporting.
- Onboarding choice CTA `Otwórz portfel demonstracyjny` now uses server action `open-demo-portfolio-action` to clone a backend-seeded demo bundle into the current user instead of relying on a shared demo login.
- Demo bundle templates live in Supabase tables (`demo_bundles`, `demo_bundle_portfolios`, `demo_bundle_transactions`) and are backend-only; user-owned clone mappings live in `demo_bundle_instances` + `demo_bundle_instance_portfolios`.
- Demo clone V1 creates two portfolios (`Demo IKE Globalny`, `Demo Portfel Aktywny`), replays seeded buys/sells/cash deposits/withdrawals/custom assets, and redirects to `/portfolio`.
- Demo history now uses shared snapshot cache (`demo_bundle_snapshot_cache`) in copy-on-clone mode:
  - if cache exists, snapshot rows are copied directly into the new user’s `portfolio_snapshots`,
  - if cache is empty, the first clone still returns after current snapshot bootstrap and warms the shared cache in best effort, so onboarding does not block on a long rebuild.
- The same wizard can run in dialog mode for an existing portfolio; in that mode the portfolio step is skipped and commits target the selected portfolio instead of creating a new one.
- Import does not store screenshot files after extraction.
- Onboarding screenshot-related APIs now return RFC7807-lite errors (`error.code`, `error.details`, `requestId`) via shared HTTP helper, and import failures expose `missingTickers` inside `error.details`.
- Review step auto-matches tickers using instrument search and shows a USD total preview based on cached Yahoo quotes + FX.
- Onboarding now starts with one unified step: create the user's own portfolio inline on the page before showing any method choice.
- Only after portfolio creation should the choice screen appear with the two equal-height cards (`Wgraj zrzuty` vs `Pełna analityka i historia`).
- Primary CTAs on the onboarding choice cards should be visually prominent: larger than default buttons, matched in size across both cards, and clearly separated from secondary mode-switch actions.
- The method-choice screen should avoid checklist-style `1. 2. 3.` content; prefer one centered icon, one badge, one title, one short paragraph, and one strong CTA per card so the speed-vs-precision trade-off is understandable within a few seconds.
- Choice cards are informational containers, not clickable cards; do not add hover states that imply the whole card is an action when only the contained CTA/button is interactive.
- The `Pełna analityka i historia` card now keeps manual entry as the primary full-width action, exposes `Importuj z XTB` as the only active broker CTA, and leaves `IBKR wkrótce` visibly disabled until that parser path is ready.
- The broker import dialog is now XTB-first and real: it keeps compact export instructions (`Moje transakcje -> Historia konta -> Eksport (Nowy)`), expects the user to unpack the ZIP from XTB, and embeds the same working XTB importer used by `/transactions/import` against the newly created portfolio.
- Onboarding instruction hero images should use static imports when they live in the repo (for example `public/onboarding/xtb.webp`) instead of raw `/...` strings, so they stay compatible with strict `images.localPatterns` in `next.config.ts`.
- The embedded XTB importer now includes transfer-like cash rows (`IKE deposit`, `Transfer`, `Withdrawal`, `IKE return partial`) so onboarding cash reconstruction stays close to the broker export instead of skipping internal account movements.
- Embedded XTB commit now starts an async import run and navigates to the created portfolio immediately with progress handled there; onboarding must not block on full import replay or snapshot rebuild completion.
- Demo CTA under the choice cards should read like an inline text link (`Przygotuj portfel demonstracyjny`) rather than a tertiary button.
- Demo accounts must not see that inline demo CTA on `/onboarding`; once the user is already inside demo, onboarding should only help them start a real portfolio.
- Onboarding portfolio setup exposes stable E2E hooks (`onboarding-portfolio-name-input`, `onboarding-create-portfolio-submit`) for guest-start deterministic Playwright flows.
