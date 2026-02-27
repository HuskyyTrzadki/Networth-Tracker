"use client";

import { X } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/features/design-system/components/ui/dialog";

import { ImportCsvPlaceholder } from "./ImportCsvPlaceholder";

export function ImportCsvDialog({
  open,
  onOpenChange,
}: Readonly<{
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
}>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] border border-border/70 bg-card p-0 shadow-[var(--surface-shadow)] sm:max-w-xl">
        <div className="flex max-h-[90dvh] flex-col bg-card/96">
          <header className="flex items-start justify-between gap-4 border-b border-dashed border-border/60 bg-card/92 px-5 py-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/85">
                Narzędzie importu
              </p>
              <DialogTitle className="truncate tracking-tight">Importuj CSV</DialogTitle>
              <DialogDescription className="mt-1 text-[11px] text-muted-foreground/90">
                Import transakcji z pliku CSV (wkrótce).
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
            <ImportCsvPlaceholder />
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
