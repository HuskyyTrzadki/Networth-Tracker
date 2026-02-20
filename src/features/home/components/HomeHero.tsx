"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import { Card, CardContent } from "@/features/design-system/components/ui/card";

export function HomeHero() {
  const router = useRouter();

  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const errorMessage = "Nie udało się uruchomić sesji gościa. Spróbuj ponownie.";

  const startGuest = async () => {
    setNotice(null);
    setPending(true);

    const response = await fetch("/api/auth/anonymous", { method: "POST" }).catch(
      () => null
    );
    if (!response?.ok) {
      setNotice(errorMessage);
      setPending(false);
      return;
    }

    router.replace("/search");
    setPending(false);
  };

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1560px] flex-col px-4 pb-8 pt-5 sm:px-6">
        <header className="flex h-14 items-center justify-between border-b border-dashed border-border/85 pb-4">
          <div className="text-xl font-semibold tracking-tight">Portfolio Tracker</div>
          <nav className="flex items-center gap-6 text-xs font-semibold uppercase tracking-[0.08em]">
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
              Cennik
            </Link>
            <Link href="/login" className="hover:text-muted-foreground">
              Zaloguj
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Raport inwestora
              </p>
              <h1 className="max-w-2xl font-serif text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
                Szukaj akcji. Czytaj dane jak gazete.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                Stock report i portfolio management w jednym miejscu. Z naciskiem
                na czytelnosc, nie na dashboardowy halas.
              </p>
            </div>

            <Card className="max-w-xl border-black/5 bg-white">
              <CardContent className="space-y-3 p-5">
                <Button
                  size="lg"
                  className="w-full rounded-sm bg-[#1c1c1c] text-white hover:bg-[#151515]"
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
                    className="rounded-sm border border-destructive/40 px-3 py-2 text-sm text-destructive"
                    role="alert"
                  >
                    {notice}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-black/5 bg-white">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Slot ilustracji
                </p>
                <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-foreground">
                  Astronauta czytajacy raport
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Wstaw wygenerowany obraz AI zgodny z motywem grawiury.
                </p>
                <div className="mt-5 h-[360px] rounded-sm border border-dashed border-black/15 bg-[#f7f4ec]" />
              </CardContent>
            </Card>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Opoznione notowania", "PLN + USD", "Cache-first"].map((item) => (
                <Card key={item} className="rounded-sm border-black/5 bg-white">
                  <CardContent className="p-3 text-sm">{item}</CardContent>
                </Card>
              ))}
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
