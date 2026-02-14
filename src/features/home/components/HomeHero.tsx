"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";

export function HomeHero() {
  const router = useRouter();

  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const errorMessage = "Nie udało się uruchomić sesji gościa. Spróbuj ponownie.";

  const startGuest = async () => {
    setNotice(null);
    setPending(true);

    try {
      const response = await fetch("/api/auth/anonymous", { method: "POST" });
      if (!response.ok) {
        setNotice(errorMessage);
        return;
      }

      router.replace("/search");
    } catch {
      setNotice(errorMessage);
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1560px] flex-col px-4 pb-8 pt-5 sm:px-6">
        <header className="flex h-14 items-center justify-between border-b border-dashed border-border/85 pb-4">
          <div className="text-xl font-semibold tracking-tight">Portfolio Tracker</div>
          <nav className="flex items-center gap-6 text-sm font-semibold">
            <a href="/pricing" className="text-muted-foreground hover:text-foreground">
              Cennik
            </a>
            <a href="/login" className="hover:text-muted-foreground">
              Zaloguj
            </a>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Raport inwestora
              </p>
              <h1 className="max-w-2xl text-5xl font-semibold tracking-tight">
                Szukaj akcji. Czytaj dane jak gazete.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                Stock report i portfolio management w jednym miejscu. Z naciskiem
                na czytelnosc, nie na dashboardowy halas.
              </p>
            </div>

            <div className="max-w-xl space-y-3 rounded-md border border-dashed border-border/90 bg-card/65 p-4">
              <Button
                size="lg"
                className="h-12 w-full"
                onClick={startGuest}
                disabled={pending}
                aria-busy={pending}
              >
                Wypróbuj jako gość
              </Button>
              <p className="text-sm text-muted-foreground">
                Bez zakladania konta. Mozesz uaktualnic profil pozniej.
              </p>
              {notice ? (
                <div
                  className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {notice}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-md border border-dashed border-border/90 bg-card/65 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Slot ilustracji
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Astronauta czytajacy raport
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Wstaw wygenerowany obraz AI zgodny z motywem grawiury.
              </p>
              <div className="mt-5 h-[360px] rounded-md border border-dashed border-border/80 bg-background/70" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-dashed border-border/80 bg-card/70 p-3 text-sm">
                Opoznione notowania
              </div>
              <div className="rounded-md border border-dashed border-border/80 bg-card/70 p-3 text-sm">
                PLN + USD
              </div>
              <div className="rounded-md border border-dashed border-border/80 bg-card/70 p-3 text-sm">
                Cache-first
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-border/85 pt-4 text-xs text-muted-foreground">
          Dane gościa mogą zostać usunięte po 60 dniach braku aktywności.
        </div>
      </div>
    </main>
  );
}
