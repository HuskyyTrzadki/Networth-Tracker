import Link from "next/link";

import { Button } from "@/features/design-system/components/ui/button";

export default function ReportNotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[1200px] items-center px-5 py-6 sm:px-6 sm:py-8">
      <section className="w-full max-w-xl rounded-lg border border-border bg-card px-6 py-8 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Nie znaleziono tej strony
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sprawdz adres albo wroc do strony glownej.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-11 w-full sm:w-auto">
            <Link href="/">Strona glowna</Link>
          </Button>
          <Button asChild className="h-11 w-full sm:w-auto" variant="outline">
            <Link href="/pricing">Cennik</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
