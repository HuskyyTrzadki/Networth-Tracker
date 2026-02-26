"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Monitor, Smartphone } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/design-system/components/ui/card";
import { Button } from "@/features/design-system/components/ui/button";
import { CreatePortfolioDialog } from "@/features/portfolio";

import { ScreenshotImportDialog } from "./ScreenshotImportDialog";

export function OnboardingWizard({
  existingPortfolioId,
  initialMode = "choice",
}: Readonly<{
  existingPortfolioId: string | null;
  initialMode?: "choice" | "screenshot";
}>) {
  const router = useRouter();
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(
    initialMode === "screenshot"
  );

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Start
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Zacznij śledzić swój portfel
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Wybierz najszybszą ścieżkę. Możesz wgrać zrzuty ekranu i zacząć od dzisiaj
          albo dodać transakcje ręcznie.
        </p>
        {existingPortfolioId ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="h-10 px-4">
              <Link href={`/portfolio/${existingPortfolioId}`}>Przejdź do portfela</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4"
              onClick={() => setIsScreenshotOpen(true)}
            >
              Dodaj kolejny przez zrzut
            </Button>
          </div>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden">
            <CardHeader>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Ścieżka A
              </p>
              <CardTitle className="text-xl">Szybki Start – AI Zrzut</CardTitle>
              <CardDescription>
                Zacznij śledzić od dzisiaj. Wgraj zrzut ekranu portfela. Czas: 1 minuta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex h-40 items-center justify-center rounded-lg border border-border/70 bg-muted/30">
                    <Monitor className="size-12 text-muted-foreground" aria-hidden />
                  </div>
                  <p className="text-xs text-muted-foreground">Zrzut z aplikacji desktop</p>
                </div>
                <div className="space-y-2">
                  <div className="flex h-40 items-center justify-center rounded-lg border border-border/70 bg-muted/30">
                    <Smartphone className="size-12 text-muted-foreground" aria-hidden />
                  </div>
                  <p className="text-xs text-muted-foreground">Zrzut z aplikacji mobilnej</p>
                </div>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <p>1. Wgraj zrzuty ekranu z brokerów.</p>
                <p>2. Potwierdź tickery i ilości.</p>
                <p>3. Otrzymaj gotowy dashboard w PLN.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button className="h-11 px-6" onClick={() => setIsScreenshotOpen(true)}>
                  Rozpocznij
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Nie przechowujemy zrzutów po analizie.
                </p>
              </div>
            </CardContent>
          </Card>

        <Card className="border-border/70">
            <CardHeader>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Ścieżka B
              </p>
              <CardTitle className="text-xl">Dodaj ręcznie</CardTitle>
              <CardDescription>
                Klasyczny formularz transakcji. Dobre, jeśli masz pełną historię.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                Najpierw utworzysz portfel, potem dodasz transakcje ręcznie.
              </div>
              <CreatePortfolioDialog
                onCreated={(createdId) => {
                  router.push(`/transactions/new?portfolio=${createdId}`);
                  router.refresh();
                }}
                trigger={({ open, disabled }) => (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-6"
                    onClick={open}
                    disabled={disabled}
                  >
                    Dodaj ręcznie
                  </Button>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                className="h-9 px-2 text-muted-foreground"
                onClick={() => setIsScreenshotOpen(true)}
              >
                Wolę szybki import
                <ArrowUpRight className="size-4" aria-hidden />
              </Button>
            </CardContent>
          </Card>
      </div>

      <ScreenshotImportDialog
        open={isScreenshotOpen}
        onOpenChange={setIsScreenshotOpen}
        onBack={() => setIsScreenshotOpen(false)}
      />
    </div>
  );
}
