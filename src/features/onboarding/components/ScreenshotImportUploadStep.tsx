"use client";

import { LoaderCircle } from "lucide-react";

import { AnimatedReveal } from "@/features/design-system";
import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";

import { ScreenshotUploadDropzone } from "./ScreenshotUploadDropzone";

export function ScreenshotImportUploadStep({
  files,
  maxFiles,
  isParsing,
  isPortfolioImport,
  onFilesChange,
  onBack,
  onParse,
}: Readonly<{
  files: readonly File[];
  maxFiles: number;
  isParsing: boolean;
  isPortfolioImport: boolean;
  onFilesChange: (next: File[]) => void;
  onBack?: () => void;
  onParse: () => void;
}>) {
  const title = isPortfolioImport
    ? "Wgraj zrzut ekranu"
    : "Dodaj zrzuty ekranu";

  return (
    <AnimatedReveal y={8}>
      <section className="grid gap-6 rounded-xl border border-border/70 bg-card p-6">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            Wgraj zrzuty listy pozycji. Możesz dodać kilka obrazów z różnych brokerów.
          </p>
        </div>
        <ScreenshotUploadDropzone
          files={files}
          maxFiles={maxFiles}
          onFilesChange={onFilesChange}
        />

        <div
          className={cn(
            "flex flex-wrap items-center gap-3",
            isPortfolioImport ? "justify-end" : "justify-between"
          )}
        >
          {!isPortfolioImport && onBack ? (
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={onBack}
            >
              Wróć
            </Button>
          ) : null}
          <Button
            type="button"
            className="h-10 px-6"
            disabled={files.length === 0 || isParsing}
            onClick={onParse}
          >
            {isParsing ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Analizuję...
              </>
            ) : (
              "Analizuj zrzuty"
            )}
          </Button>
        </div>
      </section>
    </AnimatedReveal>
  );
}
