"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PenLine, ScanSearch, Sparkles } from "lucide-react";

import { Badge } from "@/features/design-system/components/ui/badge";
import { Button } from "@/features/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/design-system/components/ui/card";
import { cn } from "@/lib/cn";
import { openDemoPortfolioAction } from "@/features/onboarding/server/open-demo-portfolio-action";

import { BrokerImportDialog } from "./BrokerImportDialog";
import { OnboardingPortfolioSetupCard } from "./OnboardingPortfolioSetupCard";
import { ScreenshotImportDialog } from "./ScreenshotImportDialog";

type CreatedPortfolio = Readonly<{
  id: string;
  name: string;
  baseCurrency: string;
  isTaxAdvantaged: boolean;
}>;

type BrokerImportTarget = "ibkr" | "xtb";

export function OnboardingWizard({
  initialMode = "choice",
  showDemoPortfolioCta = true,
}: Readonly<{
  initialMode?: "choice" | "screenshot";
  showDemoPortfolioCta?: boolean;
}>) {
  const router = useRouter();
  const [createdPortfolio, setCreatedPortfolio] = useState<CreatedPortfolio | null>(null);
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const [brokerImportTarget, setBrokerImportTarget] = useState<BrokerImportTarget | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [isDemoPending, startDemoTransition] = useTransition();

  const handlePortfolioCreated = (portfolio: CreatedPortfolio) => {
    setCreatedPortfolio(portfolio);
    if (initialMode === "screenshot") {
      setIsScreenshotOpen(true);
    }
  };

  const handleOpenDemo = () => {
    if (isDemoPending) {
      return;
    }

    setDemoError(null);
    startDemoTransition(() => {
      void openDemoPortfolioAction()
        .then((result) => {
          router.push(result.redirectTo);
          router.refresh();
        })
        .catch((error: unknown) => {
          setDemoError(
            error instanceof Error
              ? error.message
              : "Nie udało się przygotować portfela demonstracyjnego. Spróbuj ponownie."
          );
        });
    });
  };

  return (
    <div className="space-y-8">
      {createdPortfolio ? (
        <>
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full border border-emerald-300/70 bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="size-5" aria-hidden />
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
                  {createdPortfolio.name}
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                  {createdPortfolio.baseCurrency}
                </Badge>
                {createdPortfolio.isTaxAdvantaged ? (
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                    IKE / IKZE
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                Wybierz szybszy start albo pełną historię.
              </h1>
              <p className="text-sm text-muted-foreground">
                Portfel jest gotowy. Teraz zdecyduj, czy chcesz zacząć od zrzutów,
                czy od pełnej historii transakcji.
              </p>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="flex h-full flex-col border-border/75">
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-16 items-center justify-center rounded-full border border-border/60 bg-muted/50">
                    <Sparkles className="size-7 text-primary" aria-hidden />
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    Najszybsza
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-6 pt-6">
                <div className="space-y-3">
                  <CardTitle className="text-2xl">Aktualny stan portfela</CardTitle>
                  <CardDescription className="max-w-[42ch] text-sm leading-6">
                    Wgraj zrzuty z konta maklerskiego. System rozpozna Twoje akcje w kilka
                    sekund, bez wpisywania całej historii.
                  </CardDescription>
                </div>

                <div className="mt-auto flex">
                  <Button
                    className="h-14 min-w-[220px] rounded-xl px-7 text-sm shadow-sm"
                    onClick={() => setIsScreenshotOpen(true)}
                  >
                    <ScanSearch className="size-4" aria-hidden />
                    Wgraj zrzuty
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="flex h-full flex-col border-border/75">
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-16 items-center justify-center rounded-full border border-border/60 bg-muted/50">
                    <PenLine className="size-7 text-foreground/75" aria-hidden />
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    Pełna historia
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-6 pt-6">
                <div className="space-y-3">
                  <CardTitle className="text-2xl">Pełna analityka i historia</CardTitle>
                  <CardDescription className="max-w-[42ch] text-sm leading-6">
                    Wybierz sposób dodania historii: ręcznie albo przez import pliku z
                    brokera.
                  </CardDescription>
                </div>

                <div className="mt-auto space-y-3">
                  <Button
                    type="button"
                    className="h-14 w-full rounded-xl px-7 text-sm shadow-sm"
                    onClick={() => {
                      router.push(`/transactions/new?portfolio=${createdPortfolio.id}`);
                      router.refresh();
                    }}
                  >
                    Dodaj transakcję ręcznie
                  </Button>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      className="h-12 w-full rounded-xl px-5 text-sm"
                      disabled
                      variant="outline"
                    >
                      IBKR wkrótce
                    </Button>
                    <Button
                      type="button"
                      className="h-12 w-full rounded-xl px-5 text-sm"
                      onClick={() => setBrokerImportTarget("xtb")}
                      variant="outline"
                    >
                      Importuj z XTB
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="space-y-6">

          <OnboardingPortfolioSetupCard onCreated={handlePortfolioCreated} />
        </div>
      )}

      {showDemoPortfolioCta ? (
        <>
          <div
            className={cn(
              "text-sm text-muted-foreground",
              createdPortfolio ? "mt-2 text-center" : "max-w-2xl"
            )}
          >
            Chcesz najpierw zobaczyć, jak to działa?{" "}
            <button
              type="button"
              aria-busy={isDemoPending}
              aria-disabled={isDemoPending}
              className="cursor-pointer font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              onClick={handleOpenDemo}
            >
              {isDemoPending
                ? "Przygotowuję portfel demonstracyjny..."
                : "Przygotuj portfel demonstracyjny"}
            </button>
          </div>
          {demoError ? (
            <p className="mt-2 text-center text-sm text-destructive">{demoError}</p>
          ) : null}
        </>
      ) : null}

      <ScreenshotImportDialog
        open={isScreenshotOpen}
        onOpenChange={setIsScreenshotOpen}
        onBack={() => setIsScreenshotOpen(false)}
        portfolio={createdPortfolio}
      />
      {brokerImportTarget ? (
        <BrokerImportDialog
          broker={brokerImportTarget}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setBrokerImportTarget(null);
            }
          }}
          portfolio={createdPortfolio ?? undefined}
        />
      ) : null}
    </div>
  );
}
