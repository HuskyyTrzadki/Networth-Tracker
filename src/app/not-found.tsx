import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-[920px] items-center px-6 py-12">
      <section className="w-full rounded-xl border border-border/75 bg-card/95 p-8 shadow-[var(--surface-shadow)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nie znaleziono strony</h1>
        <p className="mt-3 max-w-[62ch] text-sm text-muted-foreground">
          Sprawdź adres URL albo wróć na stronę główną i kontynuuj pracę z portfelem.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
          >
            Wróć na stronę główną
          </Link>
        </div>
      </section>
    </main>
  );
}
