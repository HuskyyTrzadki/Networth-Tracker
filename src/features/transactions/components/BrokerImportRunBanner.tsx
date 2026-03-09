"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";

import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";
import { dispatchSnapshotRebuildTriggeredEvent } from "@/features/portfolio/lib/snapshot-rebuild-events";
import { Alert, AlertDescription, AlertTitle } from "@/features/design-system/components/ui/alert";
import { Button } from "@/features/design-system/components/ui/button";
import { brokerImportUiConfig, isBrokerImportProviderId } from "../lib/broker-import-providers";
import { triggerSnapshotRebuild } from "./add-transaction/submit-helpers";
import { useBrokerImportRun } from "./use-broker-import-run";

export function BrokerImportRunBanner({
  portfolioId,
}: Readonly<{
  portfolioId: string | null;
}>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hasHandledCompletedRunRef = useRef(false);
  const runId = searchParams.get("importRun") ?? searchParams.get("xtbImportRun");
  const providerParam = searchParams.get("importProvider");
  const provider =
    providerParam && isBrokerImportProviderId(providerParam)
      ? providerParam
      : runId && searchParams.get("xtbImportRun")
        ? "xtb"
        : null;
  const ui = provider ? brokerImportUiConfig[provider] : null;
  const { run, isLoading, errorMessage } = useBrokerImportRun(provider, runId);

  useEffect(() => {
    if (
      !run ||
      run.status !== "completed" ||
      !portfolioId ||
      hasHandledCompletedRunRef.current
    ) {
      return;
    }

    hasHandledCompletedRunRef.current = true;
    dispatchSnapshotRebuildTriggeredEvent({
      scope: "PORTFOLIO",
      portfolioId,
    });
    triggerSnapshotRebuild("PORTFOLIO", portfolioId);
    dispatchAppToast({
      title: `Import ${run.provider.toUpperCase()} zakończony.`,
      description:
        run.dedupedRows > 0
          ? `Dodano ${run.completedRows} wierszy, pominięto ${run.dedupedRows} duplikatów.`
          : `Dodano ${run.completedRows} wierszy do portfela.`,
      tone: "success",
    });
    router.replace(pathname, { scroll: false });
  }, [pathname, portfolioId, router, run]);

  if (!runId || !provider || portfolioId === null) {
    return null;
  }

  if (errorMessage) {
    return (
      <Alert className="border-destructive/30 bg-destructive/5">
        <AlertTitle>Import brokera wymaga uwagi</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading || !run) {
    return (
      <Alert className="border-border/70 bg-card/95">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        <AlertTitle>Import {ui?.shortLabel ?? provider.toUpperCase()} trwa</AlertTitle>
        <AlertDescription>Przygotowuję status importu i pierwszą partię zapisu.</AlertDescription>
      </Alert>
    );
  }

  if (run.status === "completed") {
    return (
      <Alert className="border-emerald-500/30 bg-emerald-50/70 text-emerald-950">
        <CheckCircle2 className="size-4 text-emerald-700" aria-hidden />
        <AlertTitle>Import {run.provider.toUpperCase()} zapisany</AlertTitle>
        <AlertDescription>
          Zakończono zapis {run.completedRows} wierszy. Analytics odświeży się w tle.
        </AlertDescription>
      </Alert>
    );
  }

  if (run.status === "blocked" || run.status === "failed") {
    return (
      <Alert className="border-destructive/30 bg-destructive/5">
        <AlertTriangle className="size-4 text-destructive" aria-hidden />
        <AlertTitle>Import {run.provider.toUpperCase()} zatrzymał się</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{run.message ?? "Import wymaga ręcznej uwagi."}</p>
          {run.blockingRows.length > 0 ? (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {run.blockingRows.map((row) => (
                <li key={row.id}>
                  {row.sourceType} • {row.sourceFileName} • wiersz {row.xtbRowId}:{" "}
                  {row.errorMessage ?? "błąd importu"}
                </li>
              ))}
            </ul>
          ) : null}
          <div>
            <Button
              onClick={() => router.replace(pathname, { scroll: false })}
              type="button"
              variant="outline"
            >
              Zamknij raport
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-border/70 bg-card/95">
      <LoaderCircle className="size-4 animate-spin" aria-hidden />
      <AlertTitle>Import {run.provider.toUpperCase()} trwa</AlertTitle>
      <AlertDescription>
        Zapisano {run.completedRows} z {run.totalRows} wierszy
        {run.dedupedRows > 0 ? `, duplikaty: ${run.dedupedRows}` : ""}. Po zapisie
        pokażemy portfel od razu, a analytics odświeży się już w tle.
      </AlertDescription>
    </Alert>
  );
}
