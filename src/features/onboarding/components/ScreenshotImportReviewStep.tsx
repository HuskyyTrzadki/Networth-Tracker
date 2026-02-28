"use client";

import { LoaderCircle } from "lucide-react";

import { AnimatedReveal } from "@/features/design-system";
import { Alert, AlertDescription, AlertTitle } from "@/features/design-system/components/ui/alert";
import { Button } from "@/features/design-system/components/ui/button";
import { isSupportedCashCurrency } from "@/features/transactions/lib/system-currencies";

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
  const rowsWithInstrument = rows.filter((row) => Boolean(row.instrument)).length;
  const unresolvedRows = rows.filter((row) => {
    const normalizedTicker = row.ticker.trim().toUpperCase();
    if (!normalizedTicker) return false;
    if (isSupportedCashCurrency(normalizedTicker)) return false;
    return !row.instrument;
  }).length;
  const missingQuantityRows = rows.filter((row) => row.quantity.trim().length === 0).length;
  const hasCoverageIssues =
    previewState.missingQuotes > 0 || previewState.missingFx > 0 || unresolvedTickers.length > 0;

  return (
    <AnimatedReveal y={8}>
      <section className="grid gap-6 rounded-xl border border-border/70 bg-card p-6">
        <div>
          <h3 className="text-lg font-semibold">Sprawdź znalezione pozycje</h3>
          <p className="text-sm text-muted-foreground">
            Znaleźliśmy {rows.length} pozycji. Zgadza się?
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 px-4 py-2.5">
              <p className="text-xs font-medium text-foreground">
                Lista automatycznie sortuje problemy na górze.
              </p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Tryb: Problemy najpierw
              </p>
            </div>

            <ScreenshotHoldingsTable
              rows={rows}
              missingTickers={highlightedTickers}
              searchClient={searchClient}
              pricesByInstrumentId={pricesByInstrumentId}
              onChange={onRowsChange}
            />
          </div>

          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <div className="rounded-xl border border-border/70 bg-muted/10 p-4 shadow-[var(--surface-shadow)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Podsumowanie importu
              </p>
              <div className="mt-2 border-b border-border/60 pb-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Suma pozycji w USD
                </p>
                <div className="mt-1 flex items-center gap-2 font-mono text-2xl font-semibold tabular-nums text-foreground">
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

              <div className="mt-3 grid gap-2">
                <div className="flex items-center justify-between rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs">
                  <span className="uppercase tracking-[0.08em] text-muted-foreground">Wiersze</span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{rows.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs">
                  <span className="uppercase tracking-[0.08em] text-muted-foreground">Dopasowane</span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{rowsWithInstrument}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs">
                  <span className="uppercase tracking-[0.08em] text-amber-900">Do poprawy</span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-amber-900">
                    {unresolvedRows + missingQuantityRows}
                  </span>
                </div>
                {(previewState.missingQuotes > 0 || previewState.missingFx > 0) && (
                  <div className="rounded-md border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-[11px] text-amber-900">
                    {previewState.missingQuotes > 0 ? `Brak notowań: ${previewState.missingQuotes}` : null}
                    {previewState.missingQuotes > 0 && previewState.missingFx > 0 ? " · " : null}
                    {previewState.missingFx > 0 ? `Brak FX: ${previewState.missingFx}` : null}
                  </div>
                )}
                {hasCoverageIssues ? (
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    Suma obejmuje tylko pozycje z pełnymi danymi.
                  </p>
                ) : null}
              </div>
            </div>

            <Alert className="border border-amber-200/60 bg-amber-50/60">
              <AlertTitle>Uwaga</AlertTitle>
              <AlertDescription>
                Śledzenie wyników zaczyna się od dzisiaj. Historia sprzed tej daty nie będzie dostępna.
              </AlertDescription>
            </Alert>
          </aside>
        </div>

        <div className="sticky bottom-0 z-20 -mx-6 border-t border-border/70 bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
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
        </div>
      </section>
    </AnimatedReveal>
  );
}
