"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/features/design-system/components/ui/button";

type Props = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function AppError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[1560px] items-center px-5 py-6 sm:px-6 sm:py-8">
      <section className="w-full max-w-xl rounded-lg border border-border bg-card px-6 py-8 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
          Blad
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Nie udalo sie zaladowac widoku
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sprobuj ponownie albo przejdz do glownego dashboardu.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="h-11 w-full sm:w-auto" onClick={reset} type="button">
            Sprobuj ponownie
          </Button>
          <Button asChild className="h-11 w-full sm:w-auto" variant="outline">
            <Link href="/portfolio">Przejdz do portfeli</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
