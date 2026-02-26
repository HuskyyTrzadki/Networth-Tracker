"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";
import { dispatchSnapshotRebuildTriggeredEvent } from "@/features/portfolio/lib/snapshot-rebuild-events";
import { portfolioBaseCurrencies } from "@/features/portfolio/lib/base-currency";
import {
  searchInstruments as defaultSearchInstruments,
  type InstrumentSearchClient,
} from "@/features/transactions/client/search-instruments";
import { commitScreenshotImport } from "@/features/transactions/client/commit-screenshot-import";
import { triggerSnapshotRebuild } from "@/features/transactions/components/add-transaction/submit-helpers";

import { parseScreenshots } from "../client/parse-screenshots";
import type { ScreenshotHoldingDraft } from "../lib/screenshot-holdings";
import type { HoldingRow } from "./ScreenshotHoldingsTable";
import type { ScreenshotImportStep, ScreenshotImportStepMeta } from "./screenshot-import-types";
import {
  MAX_SCREENSHOT_FILES,
  buildRowValidation,
  normalizeTicker,
  resolveHighlightedTickers,
  resolveUnresolvedTickers,
  isSearchableTicker,
  toRow,
  resolveInstrumentMatch,
} from "./screenshot-import-utils";
import { useScreenshotImportAutoResolve } from "./useScreenshotImportAutoResolve";
import { useScreenshotImportPreview } from "./useScreenshotImportPreview";

type UseScreenshotImportWizardOptions = Readonly<{
  variant?: "page" | "dialog";
  portfolio?: { id: string; name: string; baseCurrency: string };
  searchClient?: InstrumentSearchClient;
  onClose?: () => void;
  onCompleted?: () => void;
}>;

const buildStepMeta = (isPortfolioImport: boolean): ScreenshotImportStepMeta[] =>
  isPortfolioImport
    ? ([
        { id: "upload", label: "Zrzuty" },
        { id: "review", label: "Sprawdź" },
      ] as const)
    : ([
        { id: "portfolio", label: "Portfel" },
        { id: "upload", label: "Zrzuty" },
        { id: "review", label: "Sprawdź" },
      ] as const);

const normalizeParsedHoldings = (holdings: ScreenshotHoldingDraft[]) =>
  holdings.map((holding) => ({
    ticker: holding.ticker ?? "",
    quantity: holding.quantity ?? "",
  }));

export function useScreenshotImportWizard({
  variant = "page",
  portfolio,
  searchClient,
  onClose,
  onCompleted,
}: UseScreenshotImportWizardOptions) {
  const router = useRouter();
  const isPortfolioImport = Boolean(portfolio);
  const isDialog = variant === "dialog";
  const [step, setStep] = useState<ScreenshotImportStep>(
    isPortfolioImport ? "upload" : "portfolio"
  );
  const [portfolioName, setPortfolioName] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<HoldingRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorTone, setErrorTone] = useState<"error" | "warning" | null>(null);
  const [missingTickers, setMissingTickers] = useState<string[]>([]);

  const resolvedPortfolioName = portfolio?.name ?? portfolioName;
  const isPortfolioValid =
    isPortfolioImport ||
    (portfolioName.trim().length > 0 && Boolean(baseCurrency));

  const stepMeta = buildStepMeta(isPortfolioImport);
  const rowValidation = buildRowValidation(rows);
  const unresolvedTickers = resolveUnresolvedTickers(rows);
  const highlightedTickers = resolveHighlightedTickers(
    unresolvedTickers,
    missingTickers
  );

  useScreenshotImportAutoResolve({
    step,
    rows,
    searchClient,
    onRowsResolved: setRows,
  });

  const { previewState, formattedUsd, pricesByInstrumentId } =
    useScreenshotImportPreview({
      step,
      rows,
    });

  const handleFilesChange = (next: File[]) => {
    setFiles(next);
  };

  const handleRowsChange = (next: HoldingRow[]) => {
    setRows(next);
    setMissingTickers([]);
  };

  const handleParse = async () => {
    setErrorMessage(null);
    setErrorTone(null);
    setMissingTickers([]);

    if (files.length === 0) {
      setErrorMessage("Dodaj przynajmniej jeden zrzut.");
      setErrorTone("warning");
      return;
    }

    setIsParsing(true);
    try {
      const result = await parseScreenshots(files);
      const normalized = normalizeParsedHoldings(result.holdings);

      if (normalized.length === 0) {
        setErrorMessage("Nie znaleźliśmy żadnych pozycji na zrzutach.");
        setErrorTone("warning");
        return;
      }

      const baseRows = normalized.map(toRow);
      setRows(baseRows);

      const searchClientToUse = searchClient ?? defaultSearchInstruments;
      const matches = await Promise.all(
        baseRows.map(async (row) => {
          if (!row.ticker || !isSearchableTicker(row.ticker)) {
            return null;
          }

          try {
            return await resolveInstrumentMatch(row.ticker, searchClientToUse);
          } catch {
            return null;
          }
        })
      );

      const updatedRows = baseRows.map((row, index) => {
        const match = matches[index];
        if (!match) return row;
        return { ...row, ticker: match.ticker, instrument: match };
      });

      setRows(updatedRows);
      setMissingTickers(
        updatedRows
          .filter((row) => !row.instrument && row.ticker.trim().length > 0)
          .map((row) => normalizeTicker(row.ticker))
      );
      setStep("review");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się przetworzyć zrzutów.";
      setErrorMessage(message);
      setErrorTone("error");
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommit = async () => {
    setErrorMessage(null);
    setErrorTone(null);
    setMissingTickers([]);

    if (!rowValidation.isValid) {
      setErrorMessage(
        "Uzupełnij brakujące pola albo usuń niepotrzebne pozycje."
      );
      setErrorTone("warning");
      return;
    }

    if (!isPortfolioValid) {
      setErrorMessage("Uzupełnij nazwę portfela i walutę bazową.");
      setErrorTone("warning");
      return;
    }

    setIsSaving(true);
    try {
      const payloadHoldings = rows.map((row) => ({
        ticker: normalizeTicker(row.ticker),
        quantity: row.quantity.trim(),
      }));

      const result = await commitScreenshotImport(
        portfolio
          ? {
              portfolioId: portfolio.id,
              holdings: payloadHoldings,
            }
          : {
              portfolio: {
                name: portfolioName.trim(),
                baseCurrency:
                  baseCurrency as (typeof portfolioBaseCurrencies)[number],
              },
              holdings: payloadHoldings,
            }
      );

      dispatchSnapshotRebuildTriggeredEvent({
        scope: "PORTFOLIO",
        portfolioId: result.portfolioId,
      });
      dispatchSnapshotRebuildTriggeredEvent({
        scope: "ALL",
        portfolioId: null,
      });
      triggerSnapshotRebuild("PORTFOLIO", result.portfolioId);
      triggerSnapshotRebuild("ALL", null);

      dispatchAppToast({
        title: "Import zakończony.",
        description: isPortfolioImport
          ? "Pozycje zostały dodane do wybranego portfela."
          : "Portfel jest gotowy do śledzenia od dziś.",
        tone: "success",
      });

      if (isPortfolioImport) {
        onCompleted?.();
        router.refresh();
        if (!onCompleted) {
          onClose?.();
        }
      } else {
        onCompleted?.();
        router.push(`/portfolio/${result.portfolioId}`);
        router.refresh();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się zapisać importu.";
      setErrorMessage(message);
      const missing = (error as Error & { missingTickers?: string[] })
        .missingTickers;
      if (missing && missing.length > 0) {
        setMissingTickers(missing.map(normalizeTicker));
        setErrorTone("warning");
      } else {
        setErrorTone("error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return {
    baseCurrency,
    errorMessage,
    errorTone,
    files,
    formattedUsd,
    highlightedTickers,
    isDialog,
    isParsing,
    isPortfolioImport,
    isPortfolioValid,
    isSaving,
    maxFiles: MAX_SCREENSHOT_FILES,
    previewState,
    pricesByInstrumentId,
    portfolioName,
    resolvedPortfolioName,
    rowValidation,
    rows,
    searchClient,
    step,
    stepMeta,
    unresolvedTickers,
    handleCommit,
    handleFilesChange,
    handleParse,
    handleRowsChange,
    setBaseCurrency,
    setPortfolioName,
    setStep,
  };
}
