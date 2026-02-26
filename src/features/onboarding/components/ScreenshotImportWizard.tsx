"use client";

import { Alert, AlertDescription, AlertTitle } from "@/features/design-system/components/ui/alert";
import type { InstrumentSearchClient } from "@/features/transactions/client/search-instruments";
import { cn } from "@/lib/cn";

import { ScreenshotImportHeader } from "./ScreenshotImportHeader";
import { ScreenshotImportPortfolioStep } from "./ScreenshotImportPortfolioStep";
import { ScreenshotImportReviewStep } from "./ScreenshotImportReviewStep";
import { ScreenshotImportStepPills } from "./ScreenshotImportStepPills";
import { ScreenshotImportUploadStep } from "./ScreenshotImportUploadStep";
import { useScreenshotImportWizard } from "./useScreenshotImportWizard";

export function ScreenshotImportWizard({
  onBack,
  onClose,
  onCompleted,
  searchClient,
  variant = "page",
  portfolio,
}: Readonly<{
  onBack?: () => void;
  onClose?: () => void;
  onCompleted?: () => void;
  searchClient?: InstrumentSearchClient;
  variant?: "page" | "dialog";
  portfolio?: { id: string; name: string; baseCurrency: string };
}>) {
  const wizard = useScreenshotImportWizard({
    variant,
    portfolio,
    searchClient,
    onClose,
    onCompleted,
  });

  return (
    <div className={cn("space-y-6", wizard.isDialog ? "pb-2" : "")}>
      <ScreenshotImportHeader
        isPortfolioImport={wizard.isPortfolioImport}
        resolvedPortfolioName={wizard.resolvedPortfolioName}
        isDialog={wizard.isDialog}
        onBack={onBack}
        onClose={onClose}
      />

      <ScreenshotImportStepPills
        items={wizard.stepMeta}
        activeStep={wizard.step}
      />

      {wizard.errorMessage ? (
        <Alert
          className={cn(
            "border",
            wizard.errorTone === "warning"
              ? "border-amber-200/60 bg-amber-50/60"
              : "border-destructive/30 bg-destructive/5"
          )}
        >
          <AlertTitle>
            {wizard.errorTone === "warning"
              ? "Sprawdź dane"
              : "Coś poszło nie tak"}
          </AlertTitle>
          <AlertDescription>{wizard.errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {wizard.step === "portfolio" && !wizard.isPortfolioImport ? (
        <ScreenshotImportPortfolioStep
          portfolioName={wizard.portfolioName}
          baseCurrency={wizard.baseCurrency}
          isPortfolioValid={wizard.isPortfolioValid}
          onPortfolioNameChange={wizard.setPortfolioName}
          onBaseCurrencyChange={wizard.setBaseCurrency}
          onNext={() => wizard.setStep("upload")}
        />
      ) : null}

      {wizard.step === "upload" ? (
        <ScreenshotImportUploadStep
          files={wizard.files}
          maxFiles={wizard.maxFiles}
          isParsing={wizard.isParsing}
          isPortfolioImport={wizard.isPortfolioImport}
          onFilesChange={wizard.handleFilesChange}
          onBack={
            wizard.isPortfolioImport ? undefined : () => wizard.setStep("portfolio")
          }
          onParse={wizard.handleParse}
        />
      ) : null}

      {wizard.step === "review" ? (
        <ScreenshotImportReviewStep
          rows={wizard.rows}
          highlightedTickers={wizard.highlightedTickers}
          searchClient={wizard.searchClient}
          previewState={wizard.previewState}
          formattedUsd={wizard.formattedUsd}
          pricesByInstrumentId={wizard.pricesByInstrumentId}
          unresolvedTickers={wizard.unresolvedTickers}
          onRowsChange={wizard.handleRowsChange}
          onBack={() => wizard.setStep("upload")}
          onCommit={wizard.handleCommit}
          isSaving={wizard.isSaving}
          isPortfolioImport={wizard.isPortfolioImport}
          isRowValid={wizard.rowValidation.isValid}
        />
      ) : null}
    </div>
  );
}
