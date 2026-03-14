import Link from "next/link";

import { Button } from "@/features/design-system/components/ui/button";

export default function ReportNotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[1200px] items-center px-5 py-6 sm:px-6 sm:py-8">
      <section className="w-full max-w-xl rounded-[24px] border border-border/75 bg-card/95 px-6 py-8 text-center shadow-[var(--surface-shadow)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground">
          Nie znaleziono tej strony
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Sprawdź adres albo wróć na stronę główną.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-11 w-full sm:w-auto">
            <Link href="/">Strona główna</Link>
          </Button>
          <Button asChild className="h-11 w-full sm:w-auto" variant="outline">
            <Link href="/pricing">Cennik</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
