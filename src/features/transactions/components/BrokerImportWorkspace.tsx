"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FileWarning, LoaderCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/features/design-system/components/ui/alert";
import { Badge } from "@/features/design-system/components/ui/badge";
import { Button } from "@/features/design-system/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/features/design-system/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/design-system/components/ui/select";
import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";
import { formatCurrencyString, getCurrencyFormatter } from "@/lib/format-currency";

import { createBrokerImportJob } from "../client/create-broker-import-job";
import { previewBrokerImport } from "../client/preview-broker-import";
import { revalueBrokerImport } from "../client/revalue-broker-import";
import { runBrokerImportJob } from "../client/run-broker-import-job";
import { searchInstruments } from "../client/search-instruments";
import {
  DEFAULT_BROKER_IMPORT_PROVIDER,
  brokerImportUiConfig,
  type BrokerImportProviderId,
} from "../lib/broker-import-providers";
import type { BrokerImportPreviewResponse, BrokerImportPreviewRow } from "../lib/broker-import-types";
import { XtbImportHoldingsGrid as BrokerImportHoldingsGrid } from "./XtbImportHoldingsGrid";
import { XtbImportReviewTable as BrokerImportReviewTable } from "./XtbImportReviewTable";
import { XtbImportUploadStep as BrokerImportUploadStep } from "./XtbImportUploadStep";

type PortfolioOption = Readonly<{
  id: string;
  name: string;
  baseCurrency: string;
}>;

export function BrokerImportWorkspace({
  provider = DEFAULT_BROKER_IMPORT_PROVIDER,
  portfolios,
  initialPortfolioId,
  forcedPortfolioId = null,
  onCompleted,
  showHeader = true,
}: Readonly<{
  provider?: BrokerImportProviderId;
  portfolios: readonly PortfolioOption[];
  initialPortfolioId: string;
  forcedPortfolioId?: string | null;
  onCompleted?: (result: {
    provider: BrokerImportProviderId;
    portfolioId: string;
    runId: string;
  }) => void;
  showHeader?: boolean;
}>) {
  const router = useRouter();
  const ui = brokerImportUiConfig[provider];
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(initialPortfolioId);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<BrokerImportPreviewResponse | null>(null);
  const [rows, setRows] = useState<BrokerImportPreviewRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [isRefreshingValuation, setIsRefreshingValuation] = useState(false);
  const valuationRequestVersionRef = useRef(0);

  const unresolvedCount = useMemo(
    () => rows.filter((row) => row.status === "NEEDS_INSTRUMENT").length,
    [rows]
  );
  const selectedPortfolio =
    portfolios.find((portfolio) => portfolio.id === selectedPortfolioId) ?? portfolios[0];
  const readyRows = useMemo(
    () =>
      rows.filter(
        (row): row is BrokerImportPreviewRow & { status: "READY" } => row.status === "READY"
      ),
    [rows]
  );
  const importDisabledReason =
    readyRows.length === 0
      ? "Import jest zablokowany: brak gotowych wierszy do zapisu."
      : isImporting
        ? "Import już trwa."
        : null;
  const previewValuation = preview?.valuation ?? {
    baseCurrency: selectedPortfolio?.baseCurrency ?? "PLN",
    totalValueBase: null,
    cashValueBase: null,
    holdingsCount: 0,
    missingQuotes: 0,
    missingFx: 0,
    asOf: null,
    holdings: [],
  };
  const hasPreviewValuation = previewValuation.totalValueBase !== null;
  const hasCompletePreviewValuation =
    hasPreviewValuation &&
    previewValuation.missingQuotes === 0 &&
    previewValuation.missingFx === 0;
  const formatBaseMoney = (value: string | null, currency: string) => {
    if (!value) {
      return "Brak wyceny";
    }

    const formatter = getCurrencyFormatter(currency);
    if (!formatter) {
      return `${value} ${currency}`;
    }

    return formatCurrencyString(value, formatter) ?? `${value} ${currency}`;
  };

  const handleRowsChange = (nextRows: BrokerImportPreviewRow[]) => {
    setRows(nextRows);

    if (!preview) {
      return;
    }

    const requestVersion = valuationRequestVersionRef.current + 1;
    valuationRequestVersionRef.current = requestVersion;
    setIsRefreshingValuation(true);

    void revalueBrokerImport(provider, nextRows, preview.valuation.baseCurrency)
      .then((nextValuation) => {
        if (valuationRequestVersionRef.current !== requestVersion) {
          return;
        }

        setPreview((current) =>
          current
            ? {
                ...current,
                valuation: nextValuation,
              }
            : current
        );
      })
      .catch((error: unknown) => {
        if (valuationRequestVersionRef.current !== requestVersion) {
          return;
        }

        dispatchAppToast({
          title: "Nie udało się odświeżyć wyceny.",
          description:
            error instanceof Error
              ? error.message
              : "Podgląd zachował poprzednią wycenę. Spróbuj ponownie.",
          tone: "destructive",
        });
      })
      .finally(() => {
        if (valuationRequestVersionRef.current === requestVersion) {
          setIsRefreshingValuation(false);
        }
      });
  };

  const handlePreview = async () => {
    if (files.length === 0) {
      return;
    }

    setErrorMessage(null);
    setIsPreviewing(true);

    try {
      const nextPreview = await previewBrokerImport(
        provider,
        files,
        selectedPortfolio?.baseCurrency ?? "PLN"
      );
      valuationRequestVersionRef.current += 1;
      setIsRefreshingValuation(false);
      setPreview(nextPreview);
      setRows([...nextPreview.rows]);
      setIsTableOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nie udało się przygotować podglądu importu brokera."
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (readyRows.length === 0) {
      return;
    }

    setErrorMessage(null);
    setIsImporting(true);

    const result = await createBrokerImportJob(provider, selectedPortfolioId, readyRows).catch(
      (error: unknown) => {
        return {
          errorMessage:
            error instanceof Error
              ? error.message
              : "Nie udało się uruchomić importu brokera.",
        } as const;
      }
    );

    if ("errorMessage" in result) {
      setIsImporting(false);
      setErrorMessage(result.errorMessage);
      return;
    }

    void runBrokerImportJob(provider, result.run.id).catch(() => undefined);
    setIsImporting(false);

    dispatchAppToast({
      title: ui.startToastTitle,
      description: ui.startToastDescription,
      tone: "success",
    });

    if (onCompleted) {
      onCompleted({
        provider,
        portfolioId: selectedPortfolioId,
        runId: result.run.id,
      });
      return;
    }

    router.push(
      `/portfolio/${selectedPortfolioId}?importRun=${result.run.id}&importProvider=${provider}`
    );
  };

  return (
    <div className="space-y-6">
      {showHeader ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
              {ui.shortLabel}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px]">
              {ui.sourceLabel}
            </Badge>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight">{ui.title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Importer czyta wspierane pliki eksportu z sekcji{" "}
              <span className="font-medium text-foreground">{ui.sourceLabel}</span>,
              pokazuje podgląd, a potem zapisuje transakcje przez ten sam model co ręczne dodawanie.
            </p>
          </div>
        </div>
      ) : null}

      {!forcedPortfolioId && (
        <div className="space-y-2 rounded-xl border border-border/70 bg-card p-4 shadow-[var(--surface-shadow)]">
          <label className="text-sm font-medium text-foreground">Portfel docelowy</label>
          <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {portfolios.map((portfolio) => (
                <SelectItem key={portfolio.id} value={portfolio.id}>
                  {portfolio.name} • {portfolio.baseCurrency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <BrokerImportUploadStep
        files={files}
        isPreviewing={isPreviewing}
        onFilesChange={(nextFiles) => {
          valuationRequestVersionRef.current += 1;
          setIsRefreshingValuation(false);
          setFiles(nextFiles);
          setPreview(null);
          setRows([]);
          setErrorMessage(null);
        }}
        onPreview={handlePreview}
      />

      {errorMessage ? (
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertTitle>Import brokera wymaga uwagi</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {preview ? (
        <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--surface-shadow)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h4 className="text-lg font-semibold tracking-tight">Podgląd importu</h4>
              <p className="text-sm text-muted-foreground">
                Sprawdź dane przed zapisem. Wiersze bez instrumentu możesz poprawić ręcznie albo zostawić do pominięcia.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
                Stan brokera: gotowy do zapisu
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                Gotowe: {readyRows.length}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                Do poprawy: {unresolvedCount}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
                Pominięte: {preview.skippedRows.length}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <div className="rounded-xl border border-border/70 bg-muted/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Podgląd importu
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {hasPreviewValuation
                  ? formatBaseMoney(
                      previewValuation.totalValueBase,
                      previewValuation.baseCurrency
                    )
                  : "Bez live wyceny"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasCompletePreviewValuation
                  ? "Porównaj tę bieżącą wartość z aktualną wartością portfela u brokera."
                  : hasPreviewValuation
                    ? `Brakuje wyceny dla ${previewValuation.missingQuotes} pozycji i ${previewValuation.missingFx} kursów FX.`
                    : "Ten etap pokazuje tylko stan brokera i wiersze do zapisu. Dashboard policzy pełną analitykę po imporcie."}
              </p>
              {isRefreshingValuation ? (
                <p className="mt-2 text-xs text-muted-foreground">Odświeżam wycenę po zmianie instrumentu...</p>
              ) : null}
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Gotówka
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                {formatBaseMoney(
                  previewValuation.cashValueBase,
                  previewValuation.baseCurrency
                )}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Pozycje
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                {previewValuation.holdingsCount}
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {preview.files.map((file) => (
              <div
                key={`${file.fileName}-${file.accountNumber}`}
                className="rounded-xl border border-border/70 bg-muted/10 px-4 py-3"
              >
                <p className="truncate text-sm font-semibold text-foreground">{file.fileName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Konto {file.accountNumber} • {file.accountCurrency}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Zakres: {file.dateFromUtc ?? "—"} {"->"} {file.dateToUtc ?? "—"}
                </p>
              </div>
            ))}
          </div>

          <BrokerImportHoldingsGrid
            baseCurrency={previewValuation.baseCurrency}
            holdings={previewValuation.holdings}
            rows={rows}
            onRowsChange={handleRowsChange}
            searchClient={searchInstruments}
          />

          <Collapsible open={isTableOpen} onOpenChange={setIsTableOpen}>
            <div className="rounded-xl border border-border/70 bg-muted/10">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">Szczegółowa tabela wierszy</p>
                    <p className="text-xs text-muted-foreground">
                      Otwórz tylko, jeśli chcesz sprawdzić każdy zaimportowany wiersz osobno.
                    </p>
                  </div>
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform ${isTableOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t border-border/70 p-4">
                <BrokerImportReviewTable
                  rows={rows}
                  onRowsChange={handleRowsChange}
                  searchClient={searchInstruments}
                />
              </CollapsibleContent>
            </div>
          </Collapsible>

          {preview.skippedRows.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-start gap-3">
                <FileWarning className="mt-0.5 size-4 text-amber-700" aria-hidden />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-amber-900">
                    Pominięte wiersze
                  </p>
                  <p className="text-sm text-amber-900/90">
                    To nie blokuje importu. Zapiszemy gotowe wiersze, a te operacje po prostu pominiemy.
                  </p>
                  <div className="space-y-1 text-sm text-amber-900/90">
                    {preview.skippedRows.slice(0, 6).map((row) => (
                      <p key={row.previewId}>
                        {row.sourceFileName} • {row.sourceType} • {row.reason}
                      </p>
                    ))}
                    {preview.skippedRows.length > 6 ? (
                      <p>+ {preview.skippedRows.length - 6} kolejnych pominiętych wierszy</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl"
              onClick={() => {
                valuationRequestVersionRef.current += 1;
                setIsRefreshingValuation(false);
                setPreview(null);
                setRows([]);
              }}
            >
              Wróć do plików
            </Button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                {preview.skippedRows.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Pominięte wiersze nie blokują importu.
                  </p>
                ) : null}
                {unresolvedCount > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {unresolvedCount} wierszy bez instrumentu pominiemy przy imporcie, jeśli ich teraz nie poprawisz.
                  </p>
                ) : null}
                {importDisabledReason ? (
                  <p className="text-xs text-amber-700">{importDisabledReason}</p>
                ) : null}
              </div>
              <Button
                type="button"
                className="h-11 rounded-xl px-5"
                disabled={Boolean(importDisabledReason)}
                onClick={handleImport}
              >
                {isImporting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                    Importuję...
                  </>
                ) : (
                  `Importuj ${readyRows.length} wierszy`
                )}
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
