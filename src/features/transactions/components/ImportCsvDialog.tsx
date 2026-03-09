"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/features/design-system/components/ui/dialog";
import {
  DEFAULT_BROKER_IMPORT_PROVIDER,
  brokerImportUiConfig,
  type BrokerImportProviderId,
} from "@/features/transactions/lib/broker-import-providers";

import { BrokerImportWorkspace } from "./BrokerImportWorkspace";

export function ImportCsvDialog({
  provider = DEFAULT_BROKER_IMPORT_PROVIDER,
  open,
  onOpenChange,
  portfolios,
  initialPortfolioId,
  forcedPortfolioId,
}: Readonly<{
  provider?: BrokerImportProviderId;
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  initialPortfolioId: string;
  forcedPortfolioId: string | null;
}>) {
  const router = useRouter();
  const ui = brokerImportUiConfig[provider];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] border border-border/70 bg-card p-0 shadow-[var(--surface-shadow)] sm:max-w-6xl">
        <div className="flex max-h-[90dvh] flex-col bg-card/96">
          <header className="flex items-start justify-between gap-4 border-b border-dashed border-border/60 bg-card/92 px-5 py-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/85">
                Narzędzie importu
              </p>
              <DialogTitle className="truncate tracking-tight">{ui.title}</DialogTitle>
              <DialogDescription className="mt-1 text-[11px] text-muted-foreground/90">
                Wspierane pliki eksportu z sekcji {ui.sourceLabel}.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                aria-label="Zamknij"
                className="h-9 w-9 rounded-full border border-border/55 p-0"
                type="button"
                variant="ghost"
              >
                <X className="size-5 opacity-70" aria-hidden />
              </Button>
            </DialogClose>
          </header>

          <div className="flex-1 overflow-y-auto bg-background/38 px-5 py-4 md:px-6 md:py-5">
            <BrokerImportWorkspace
              provider={provider}
              portfolios={portfolios}
              initialPortfolioId={initialPortfolioId}
              forcedPortfolioId={forcedPortfolioId}
              onCompleted={({ provider: completedProvider, portfolioId, runId }) => {
                router.push(
                  `/portfolio/${portfolioId}?importRun=${runId}&importProvider=${completedProvider}`
                );
                onOpenChange(false);
              }}
            />
          </div>

          <footer className="border-t border-dashed border-border/60 bg-card/92 px-5 py-4 md:px-6 md:py-5">
            <div className="flex justify-end">
              <Button
                className="rounded-full"
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Zamknij
              </Button>
            </div>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
