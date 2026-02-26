"use client";

import { X } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";

export function ScreenshotImportHeader({
  isPortfolioImport,
  resolvedPortfolioName,
  isDialog,
  onBack,
  onClose,
}: Readonly<{
  isPortfolioImport: boolean;
  resolvedPortfolioName: string;
  isDialog: boolean;
  onBack?: () => void;
  onClose?: () => void;
}>) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {isPortfolioImport ? "Import zrzutów" : "Szybki Start"}
        </p>
        <h2
          className={cn(
            "mt-2 font-semibold tracking-tight",
            isDialog ? "text-xl" : "text-2xl"
          )}
        >
          {isPortfolioImport
            ? `Wgraj zrzuty do portfela ${resolvedPortfolioName}`
            : "Zaczytaj portfel ze zrzutów ekranu"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {isPortfolioImport
            ? "Wgraj zrzuty z brokera. Pozycje dopasujemy i zapiszemy w wybranym portfelu."
            : "Wgraj zrzuty z XTB, mBank lub innego brokera. System utworzy portfel i zacznie śledzenie od dzisiaj."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4"
            onClick={onBack}
          >
            Wróć do wyboru
          </Button>
        ) : null}
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-10 p-0"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
