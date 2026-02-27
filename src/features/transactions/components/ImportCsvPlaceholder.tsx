"use client";

import { FileUp } from "lucide-react";

export function ImportCsvPlaceholder() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-5 py-10 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border border-border/70 bg-card/95 text-muted-foreground shadow-[var(--surface-shadow)]">
        <FileUp className="size-8" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/85">
          W przygotowaniu
        </p>
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Importuj CSV
        </h2>
        <p className="text-sm text-muted-foreground">
          Wkrótce. Trwają prace nad importerem.
        </p>
      </div>
      <div className="w-full rounded-md border border-dashed border-border/70 bg-card/94 p-4 text-left shadow-[var(--surface-shadow)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
          Plan importu
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground/85">
          <li>Podgląd CSV przed zapisem i walidacja kolumn.</li>
          <li>Mapowanie pól transakcji na format portfela.</li>
          <li>Raport błędów i bezpieczny import tylko poprawnych wierszy.</li>
        </ul>
      </div>
    </section>
  );
}
