"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, ScanSearch, Sparkles } from "lucide-react";

import { Badge } from "@/features/design-system/components/ui/badge";
import { Button } from "@/features/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/design-system/components/ui/card";
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
        <h1 className="text-3xl font-semibold tracking-tight">Dwie drogi. Jeden portfel.</h1>
        <p className="text-sm text-muted-foreground">
          Wybierz szybszy start albo pełną historię.
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex h-full flex-col border-border/75 transition-shadow duration-200 hover:shadow-[0_20px_48px_-24px_rgb(15_23_42/0.22)]">
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
              <CardTitle className="text-2xl">Aktualny stan portfela (AI)</CardTitle>
              <CardDescription className="max-w-[42ch] text-sm leading-6">
                Wgraj zrzuty z konta maklerskiego. System rozpozna Twoje akcje w kilka
                sekund, bez wpisywania historii.
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

        <Card className="flex h-full flex-col border-border/75 transition-shadow duration-200 hover:shadow-[0_20px_48px_-24px_rgb(15_23_42/0.22)]">
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
                Dodaj transakcje ręcznie, aby odblokować pełną historię, wpływ FX na
                wynik i śledzenie dywidend.
              </CardDescription>
            </div>

            <div className="mt-auto flex">
              <CreatePortfolioDialog
                onCreated={(createdId) => {
                  router.push(`/transactions/new?portfolio=${createdId}`);
                  router.refresh();
                }}
                trigger={({ open, disabled }) => (
                  <Button
                    type="button"
                    className="h-14 min-w-[220px] rounded-xl px-7 text-sm shadow-sm"
                    onClick={open}
                    disabled={disabled}
                  >
                    Dodaj transakcję
                  </Button>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-2 text-center text-sm text-muted-foreground">
        Chcesz najpierw zobaczyć, jak to działa?{" "}
        <button
          type="button"
          className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
        >
          Otwórz portfel demonstracyjny
        </button>
      </div>

      <ScreenshotImportDialog
        open={isScreenshotOpen}
        onOpenChange={setIsScreenshotOpen}
        onBack={() => setIsScreenshotOpen(false)}
      />
    </div>
  );
}
