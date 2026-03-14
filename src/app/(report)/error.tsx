"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/features/design-system/components/ui/button";

type Props = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ReportError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[1200px] items-center px-5 py-6 sm:px-6 sm:py-8">
      <section className="w-full max-w-xl rounded-[24px] border border-border/75 bg-card/95 px-6 py-8 text-center shadow-[var(--surface-shadow)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Błąd
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground">
          Nie udało się załadować strony
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Odśwież stronę albo wróć na start.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="h-11 w-full sm:w-auto" onClick={reset} type="button">
            Spróbuj ponownie
          </Button>
          <Button asChild className="h-11 w-full sm:w-auto" variant="outline">
            <Link href="/">Wróć na start</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
