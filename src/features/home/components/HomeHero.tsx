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
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6 py-10">
        <div className="text-sm font-semibold tracking-tight text-foreground">
          Portfolio Tracker
        </div>

        <div className="flex flex-1 items-center">
          <div className="w-full">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Portfolio Tracker
              </h1>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Śledź portfel na opóźnionych notowaniach. PLN + USD od startu.
              </p>
            </div>

            <div className="mt-8 max-w-2xl space-y-3">
              <Button
                size="lg"
                className="h-11 w-full px-6 sm:w-auto"
                onClick={startGuest}
                disabled={pending}
                aria-busy={pending}
              >
                Wypróbuj jako gość
              </Button>

              <p className="text-sm text-muted-foreground">
                Bez zakładania konta. Możesz uaktualnić później w ustawieniach.
              </p>

              {notice ? (
                <div
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  role="alert"
                >
                  {notice}
                </div>
              ) : null}
            </div>

            <div className="mt-12 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="text-sm font-semibold tracking-tight">
                  Opóźnione notowania
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Stabilna wycena bez gonienia za tickami.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="text-sm font-semibold tracking-tight">
                  PLN + USD
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Jedna wartość portfela w wybranej walucie.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="text-sm font-semibold tracking-tight">
                  Cache-first
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Notowania i FX z TTL — szybko i tanio.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 text-xs text-muted-foreground">
          Dane gościa mogą zostać usunięte po 60 dniach braku aktywności.
        </div>
      </div>
    </main>
  );
}
