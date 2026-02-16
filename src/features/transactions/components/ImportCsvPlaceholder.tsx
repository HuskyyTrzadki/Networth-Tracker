"use client";

import { FileUp } from "lucide-react";

export function ImportCsvPlaceholder() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
        <FileUp className="size-7" aria-hidden />
      </div>
      <div className="space-y-1">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Importuj CSV
        </h2>
        <p className="text-sm text-muted-foreground">
          Wkrótce. Trwają prace nad importerem.
        </p>
      </div>
    </section>
  );
}
