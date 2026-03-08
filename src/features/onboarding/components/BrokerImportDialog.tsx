"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Info,
  Upload,
  X,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/features/design-system/components/ui/alert";
import { Badge } from "@/features/design-system/components/ui/badge";
import { Button } from "@/features/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/design-system/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/features/design-system/components/ui/dialog";
import { XtbImportWorkspace } from "@/features/transactions/components/XtbImportWorkspace";
import { cn } from "@/lib/cn";
import xtbInstructionImage from "../../../../public/onboarding/xtb.webp";
import { BrokerInstructionPlaceholder } from "./BrokerInstructionPlaceholder";
import { BrokerInstructionHero } from "./BrokerInstructionHero";

type BrokerImportTarget = "ibkr" | "xtb";

const brokerImportContent: Record<
  BrokerImportTarget,
  {
    shortLabel: string;
    title: string;
    description: string;
    statusLabel: string;
    stepsTitle: string;
    steps: readonly { title: string; description: string; eyebrow: string }[];
    uploadTitle: string;
    uploadHint: string;
    fileTypesLabel: string;
    fileInputAccept: string;
    pickFileLabel: string;
    readyForNextStep: boolean;
  }
> = {
  ibkr: {
    shortLabel: "IBKR",
    title: "Import historii z Interactive Brokers",
    description:
      "Ten broker zostawiamy jako kolejny etap. Najpierw domykamy poprawny przepływ XTB, a potem dołożymy osobny parser oraz instrukcję eksportu dla IBKR.",
    statusLabel: "Wkrótce",
    stepsTitle: "Co przygotujemy dla IBKR",
    steps: [
      {
        title: "Krok 1",
        eyebrow: "Eksport",
        description: "Dodamy krótką instrukcję wejścia do właściwego raportu i eksportu pliku z IBKR.",
      },
      {
        title: "Krok 2",
        eyebrow: "Zakres",
        description: "Zablokujemy dokładnie jeden wspierany układ kolumn, żeby import nie był zgadywaniem.",
      },
      {
        title: "Krok 3",
        eyebrow: "Walidacja",
        description: "Podepniemy ten broker do tego samego podglądu, walidacji i importu co XTB.",
      },
    ],
    uploadTitle: "Plik z IBKR",
    uploadHint: "Docelowo przyjmiemy tu wspierany eksport z IBKR po potwierdzeniu finalnego formatu.",
    fileTypesLabel: "Docelowy format: CSV z ustalonego raportu IBKR.",
    fileInputAccept: ".csv,text/csv,application/vnd.ms-excel",
    pickFileLabel: "Wybierz plik z IBKR",
    readyForNextStep: false,
  },
  xtb: {
    shortLabel: "XTB",
    title: "Import historii z XTB",
    description:
      "To jest pierwszy broker, którego domykamy. Instrukcja poniżej prowadzi użytkownika od ekranu historii konta do plików Excel gotowych do importu.",
    statusLabel: "Pierwszy broker",
    stepsTitle: "Jak pobrać pliki z XTB",
    steps: [
      {
        title: "Krok 1",
        eyebrow: "Na laptopie",
        description:
          "Otwórz XTB na laptopie i przejdź do Moje transakcje -> Historia konta.",
      },
      {
        title: "Krok 2",
        eyebrow: "Eksport",
        description:
          "Kliknij Eksport (Nowy), wybierz konto oraz zakres dat, który chcesz zaimportować.",
      },
      {
        title: "Krok 3",
        eyebrow: "ZIP i Excel",
        description:
          "Pobierz ZIP, rozpakuj go i przeciągnij do importu tylko te pliki Excel z kontami, które chcesz dodać.",
      },
    ],
    uploadTitle: "Wgraj pliki z XTB",
    uploadHint:
      "XTB zwraca archiwum ZIP z osobnym plikiem Excel dla każdego konta. W kolejnym kroku podepniemy prawdziwe parsowanie tych plików.",
    fileTypesLabel: "Obsługiwany docelowy format: ZIP z eksportu XTB lub rozpakowane pliki Excel.",
    fileInputAccept:
      ".zip,.xlsx,.xls,application/zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel",
    pickFileLabel: "Wybierz ZIP lub plik Excel",
    readyForNextStep: true,
  },
};

export function BrokerImportDialog({
  broker,
  open,
  onOpenChange,
  portfolio,
}: Readonly<{
  broker: BrokerImportTarget;
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  portfolio?: { id: string; name: string; baseCurrency: string };
}>) {
  const router = useRouter();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const content = brokerImportContent[broker];

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSelectedFile(null);
    }
  };

  if (broker === "xtb" && portfolio) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90dvh] max-w-[1200px] overflow-hidden rounded-xl border-border/80 bg-background p-0">
          <DialogTitle className="sr-only">{content.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Import historii transakcji z XTB do istniejącego portfela.
          </DialogDescription>

          <div className="flex max-h-[90dvh] flex-col">
            <header className="flex items-start justify-between gap-4 border-b border-border/70 px-6 py-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                    Import XTB
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
                    {portfolio.name}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                    {portfolio.baseCurrency}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight">{content.title}</h2>
                  <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
                    {content.description}
                  </p>
                </div>
              </div>

              <DialogClose asChild>
                <Button
                  aria-label="Zamknij"
                  className="size-10 rounded-full border border-border/70 p-0"
                  type="button"
                  variant="ghost"
                >
                  <X className="size-5 opacity-70" aria-hidden />
                </Button>
              </DialogClose>
            </header>

            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
              <BrokerInstructionHero
                title={content.stepsTitle}
                description="Zrzut ekranu z widoku Historia konta i przyciskiem Eksport (Nowy) w XTB."
                steps={content.steps}
                imageSrc={xtbInstructionImage}
              />
              <XtbImportWorkspace
                portfolios={[portfolio]}
                initialPortfolioId={portfolio.id}
                forcedPortfolioId={portfolio.id}
                showHeader={false}
                onCompleted={({ portfolioId, runId }) => {
                  router.push(`/portfolio/${portfolioId}?xtbImportRun=${runId}`);
                  onOpenChange(false);
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-[1100px] overflow-hidden rounded-xl border-border/80 bg-background p-0">
        <DialogTitle className="sr-only">{content.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Widok przygotowujący import CSV od brokera z miejscem na instrukcję eksportu.
        </DialogDescription>

        <div className="flex max-h-[90dvh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-border/70 px-6 py-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                  Import CSV
                </Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
                  {content.shortLabel}
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                  {content.statusLabel}
                </Badge>
                {portfolio?.name ? (
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                    {portfolio.name}
                  </Badge>
                ) : null}
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">{content.title}</h2>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  {content.description}
                </p>
              </div>
            </div>

            <DialogClose asChild>
              <Button
                aria-label="Zamknij"
                className="size-10 rounded-full border border-border/70 p-0"
                type="button"
                variant="ghost"
              >
                <X className="size-5 opacity-70" aria-hidden />
              </Button>
            </DialogClose>
          </header>

          <div className="grid flex-1 gap-6 overflow-y-auto px-6 py-6 lg:grid-cols-[minmax(0,1.3fr)_360px]">
            <section className="space-y-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Instrukcja
                </p>
                <h3 className="text-lg font-semibold tracking-tight">
                  {content.stepsTitle}
                </h3>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                {content.steps.map((item) => (
                  <BrokerInstructionPlaceholder
                    key={item.title}
                    eyebrow={item.eyebrow}
                    title={item.title}
                    description={item.description}
                  />
                ))}
              </div>
            </section>

            <Card className="border-border/75 bg-card/96 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex size-12 items-center justify-center rounded-full border border-border/70 bg-muted/30">
                  <FileSpreadsheet className="size-6 text-foreground/75" aria-hidden />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">{content.uploadTitle}</CardTitle>
                  <CardDescription className="text-sm leading-6">
                    {content.uploadHint}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <Alert className="border-border/75 bg-muted/20">
                  <Info className="size-4" aria-hidden />
                  <AlertTitle>
                    {content.readyForNextStep
                      ? "XTB jest pierwszym importem, który domykamy"
                      : "IBKR dołączymy po domknięciu XTB"}
                  </AlertTitle>
                  <AlertDescription>
                    {content.readyForNextStep
                      ? "Układ instrukcji i typów plików jest już dopasowany do eksportu XTB. Właściwe parsowanie, walidacja i podgląd transakcji podepniemy w następnym kroku."
                      : "Nie udajemy jeszcze gotowego importu. Najpierw kończymy poprawny przepływ XTB, a potem dokładamy drugi broker na tej samej architekturze."}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-foreground"
                  >
                    Plik źródłowy
                  </label>
                  <input
                    id={inputId}
                    ref={fileInputRef}
                    type="file"
                    accept={content.fileInputAccept}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setSelectedFile(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 px-5 py-7 text-center transition-colors",
                      "hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2"
                    )}
                  >
                    <div className="flex size-12 items-center justify-center rounded-full border border-border/70 bg-background">
                      <Upload className="size-5 text-muted-foreground" aria-hidden />
                    </div>
                    <p className="mt-3 text-sm font-medium text-foreground">
                      {selectedFile ? "Zmień wybrany plik" : content.pickFileLabel}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {content.fileTypesLabel}
                    </p>
                  </button>
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Status pliku
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {selectedFile
                      ? selectedFile.name
                      : "Nie wybrano jeszcze pliku do importu."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    className="h-11 flex-1 rounded-xl"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    {content.pickFileLabel}
                  </Button>
                  <Button
                    className="h-11 flex-1 rounded-xl"
                    disabled
                    type="button"
                  >
                    Importuj wkrótce
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
