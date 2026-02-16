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
      <DialogContent className="max-h-[90dvh] p-0 sm:max-w-xl">
        <div className="flex max-h-[90dvh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <DialogTitle className="truncate">Importuj CSV</DialogTitle>
              <DialogDescription className="mt-1">
                Import transakcji z pliku CSV (wkrótce).
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                aria-label="Zamknij"
                className="h-9 w-9 p-0"
                type="button"
                variant="ghost"
              >
                <X className="size-5 opacity-70" aria-hidden />
              </Button>
            </DialogClose>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
            <ImportCsvPlaceholder />
          </div>

          <footer className="border-t border-border px-5 py-4 md:px-6 md:py-5">
            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)} type="button">
                Zamknij
              </Button>
            </div>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
