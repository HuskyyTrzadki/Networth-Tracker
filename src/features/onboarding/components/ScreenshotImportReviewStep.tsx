"use client";

import { LoaderCircle } from "lucide-react";

import { AnimatedReveal } from "@/features/design-system";
import { Alert, AlertDescription, AlertTitle } from "@/features/design-system/components/ui/alert";
import { Button } from "@/features/design-system/components/ui/button";

import type { InstrumentSearchClient } from "@/features/transactions/client/search-instruments";
import { ScreenshotHoldingsTable } from "./ScreenshotHoldingsTable";
import type { HoldingRow } from "./ScreenshotHoldingsTable";
import type { ScreenshotImportPreviewState } from "./screenshot-import-types";

export function ScreenshotImportReviewStep({
  rows,
  highlightedTickers,
  searchClient,
  previewState,
  formattedUsd,
  pricesByInstrumentId,
  unresolvedTickers,
  onRowsChange,
  onBack,
  onCommit,
  isSaving,
  isPortfolioImport,
  isRowValid,
}: Readonly<{
  rows: HoldingRow[];
  highlightedTickers: readonly string[];
  searchClient?: InstrumentSearchClient;
  previewState: ScreenshotImportPreviewState;
  formattedUsd: string | null;
  pricesByInstrumentId: Readonly<
    Record<string, Readonly<{ price: string | null; currency: string }>>
  >;
  unresolvedTickers: readonly string[];
  onRowsChange: (next: HoldingRow[]) => void;
  onBack: () => void;
  onCommit: () => void;
  isSaving: boolean;
  isPortfolioImport: boolean;
  isRowValid: boolean;
}>) {
  return (
    <AnimatedReveal y={8}>
      <section className="grid gap-6 rounded-xl border border-border/70 bg-card p-6">
        <div>
          <h3 className="text-lg font-semibold">Sprawdź znalezione pozycje</h3>
          <p className="text-sm text-muted-foreground">
            Znaleźliśmy {rows.length} pozycji. Zgadza się?
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 px-4 py-3 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Suma pozycji w USD
            </p>
            <div className="mt-1 flex items-center gap-2 text-base font-semibold">
              {previewState.status === "loading" ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  Liczę...
                </>
              ) : previewState.status === "error" ? (
                <span className="text-destructive">
                  {previewState.errorMessage ?? "Brak wyceny"}
                </span>
              ) : formattedUsd ? (
                formattedUsd
              ) : (
                "Brak wyceny"
              )}
            </div>

          </div>
          {previewState.missingQuotes > 0 ||
          previewState.missingFx > 0 ||
          unresolvedTickers.length > 0 ? (
            <div className="text-xs text-muted-foreground">
              {previewState.missingQuotes > 0 || previewState.missingFx > 0 ? (
                <p className="text-amber-700">
                  {previewState.missingQuotes > 0
                    ? `Brak notowań: ${previewState.missingQuotes}`
                    : null}
                  {previewState.missingFx > 0
                    ? ` Brak FX: ${previewState.missingFx}`
                    : null}
                </p>
              ) : null}
              {unresolvedTickers.length > 0 ? (
                <p>Suma obejmuje tylko dopasowane tickery.</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <ScreenshotHoldingsTable
          rows={rows}
          missingTickers={highlightedTickers}
          searchClient={searchClient}
          pricesByInstrumentId={pricesByInstrumentId}
          onChange={onRowsChange}
        />

        <Alert className="border border-amber-200/60 bg-amber-50/60">
          <AlertTitle>Uwaga</AlertTitle>
          <AlertDescription>
            Śledzenie wyników zaczyna się od dzisiaj. Historia sprzed tej daty nie będzie dostępna.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" className="h-10" onClick={onBack}>
            Wróć
          </Button>
          <Button
            type="button"
            className="h-10 px-6"
            disabled={!isRowValid || isSaving}
            onClick={onCommit}
          >
            {isSaving ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Zapisuję...
              </>
            ) : isPortfolioImport ? (
              "Zapisz w portfelu"
            ) : (
              "Zapisz i przejdź do portfela"
            )}
          </Button>
        </div>
      </section>
    </AnimatedReveal>
  );
}
