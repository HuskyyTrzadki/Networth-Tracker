"use client";

import { useEffect } from "react";
import Link from "next/link";

type Props = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pl">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <main className="grid min-h-dvh place-items-center p-8">
          <section className="w-full max-w-[560px] rounded-[20px] border border-border/75 bg-card/95 p-6 shadow-[var(--surface-shadow)] sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Błąd aplikacji
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground">
              Coś poszło nie tak
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Wystąpił nieoczekiwany błąd aplikacji. Odśwież widok albo spróbuj ponownie.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Spróbuj ponownie
              </button>
              <Link
                href="/"
                className="inline-flex h-11 items-center rounded-md border border-border/75 bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/35"
              >
                Wróć na start
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
