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
- The same wizard can run in dialog mode for an existing portfolio; in that mode the portfolio step is skipped and commits target the selected portfolio instead of creating a new one.
- Import does not store screenshot files after extraction.
- Review step auto-matches tickers using instrument search and shows a USD total preview based on cached Yahoo quotes + FX.
- Onboarding choice screen should use two equal-height cards with mirrored internal structure, short compare-friendly copy, and one primary takeaway per path to reduce decision fatigue.
- Primary CTAs on the onboarding choice cards should be visually prominent: larger than default buttons, matched in size across both cards, and clearly separated from secondary mode-switch actions.
- The onboarding choice screen should avoid checklist-style `1. 2. 3.` content; prefer one centered icon, one badge, one title, one short paragraph, and one strong CTA per card so the speed-vs-precision trade-off is understandable within a few seconds.
