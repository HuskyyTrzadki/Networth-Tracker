"use client";

import { useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/features/design-system/components/ui/dialog";
import type { InstrumentSearchClient } from "@/features/transactions/client/search-instruments";

import { ScreenshotImportWizard } from "./ScreenshotImportWizard";

export function ScreenshotImportDialog({
  open,
  onOpenChange,
  onBack,
  portfolio,
  searchClient,
}: Readonly<{
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onBack?: () => void;
  portfolio?: { id: string; name: string; baseCurrency: string } | null;
  searchClient?: InstrumentSearchClient;
}>) {
  const [sessionId, setSessionId] = useState(0);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSessionId((value) => value + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-[1100px] overflow-hidden rounded-xl border-border/80 bg-background p-0">
        <DialogTitle className="sr-only">Import ze zrzutu ekranu</DialogTitle>
        <DialogDescription className="sr-only">
          Wgraj zrzuty ekranu, potwierdź instrumenty i zapisz pozycje w portfelu.
        </DialogDescription>
        <div className="max-h-[90dvh] overflow-y-auto px-6 py-6">
          <ScreenshotImportWizard
            key={sessionId}
            variant="dialog"
            onBack={onBack}
            onClose={() => onOpenChange(false)}
            searchClient={searchClient}
            portfolio={portfolio ?? undefined}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
