"use client";

import { FileSpreadsheet, Upload, X } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";

export function XtbImportUploadStep({
  files,
  isPreviewing,
  onFilesChange,
  onPreview,
}: Readonly<{
  files: readonly File[];
  isPreviewing: boolean;
  onFilesChange: (next: File[]) => void;
  onPreview: () => void;
}>) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-dashed border-border/75 bg-muted/15 p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background">
            <Upload className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold tracking-tight">Dodaj pliki Excel z XTB</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Rozpakuj archiwum ZIP z XTB i wgraj tylko pliki <span className="font-medium text-foreground">.xlsx</span> albo <span className="font-medium text-foreground">.xls</span> dla kont, które chcesz dodać.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <label className="inline-flex">
            <input
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              multiple
              onChange={(event) => {
                const nextFiles = Array.from(event.target.files ?? []);
                onFilesChange(nextFiles);
              }}
            />
            <span className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border/70 bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/30">
              Wybierz pliki XTB
            </span>
          </label>
        </div>
      </div>

      {files.length > 0 ? (
        <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--surface-shadow)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Wybrane pliki
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {files.length} plik{files.length === 1 ? "" : files.length < 5 ? "i" : "ów"} gotowe do analizy.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-lg px-3"
              onClick={() => onFilesChange([])}
            >
              Wyczyść
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {files.map((file) => (
              <div
                key={`${file.name}-${file.lastModified}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/10 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background">
                    <FileSpreadsheet className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="size-8 shrink-0 rounded-full p-0 text-muted-foreground"
                  onClick={() =>
                    onFilesChange(
                      files.filter(
                        (candidate) =>
                          candidate.name !== file.name ||
                          candidate.lastModified !== file.lastModified
                      )
                    )
                  }
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button
              type="button"
              className="h-12 w-full rounded-xl px-6 text-sm font-semibold"
              disabled={isPreviewing}
              onClick={onPreview}
            >
              {isPreviewing ? "Przygotowuję podgląd..." : "Dalej do podglądu"}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
