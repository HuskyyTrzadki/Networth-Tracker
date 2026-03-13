"use client";

import dynamic from "next/dynamic";
import type { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/features/design-system/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/design-system/components/ui/select";
import type { InstrumentSearchClient } from "../../client/search-instruments";
import type { FormValues } from "../AddTransactionDialogContent";

type PortfolioOption = Readonly<{ id: string; name: string; baseCurrency: string }>;

const ScreenshotImportWizard = dynamic(
  () =>
    import("@/features/onboarding/components/ScreenshotImportWizard").then((module) => ({
      default: module.ScreenshotImportWizard,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-border/70 bg-card/95 p-4 shadow-[var(--surface-shadow)] sm:p-5">
        <div className="space-y-3">
          <div className="h-4 w-36 animate-pulse rounded-md bg-muted/35" />
          <div className="h-10 animate-pulse rounded-md bg-muted/35" />
          <div className="h-40 animate-pulse rounded-md bg-muted/25" />
        </div>
      </div>
    ),
  }
);

export function AddTransactionScreenshotSection({
  form,
  forcedPortfolioId,
  isPortfolioSwitchPending = false,
  portfolios,
  screenshotPortfolio,
  searchClient,
  onPortfolioSelection,
  onClose,
  onCompleted,
}: Readonly<{
  form: UseFormReturn<FormValues>;
  forcedPortfolioId: string | null;
  isPortfolioSwitchPending?: boolean;
  portfolios: readonly PortfolioOption[];
  screenshotPortfolio: PortfolioOption | null;
  searchClient?: InstrumentSearchClient;
  onPortfolioSelection: (nextPortfolioId: string) => void;
  onClose: () => void;
  onCompleted?: () => void;
}>) {
  return (
    <>
      <div className="border-t border-dashed border-border/60 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/82">
          01
        </p>
        <div className="mt-1 space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Wybierz portfel docelowy</h3>
          <p className="text-sm text-muted-foreground">
            Import przypiszemy do konkretnego portfela jeszcze przed analizą zrzutu.
          </p>
        </div>
      </div>

      <div>
        <FormField
          control={form.control}
          name="portfolioId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Portfel
              </FormLabel>
              <Select
                disabled={Boolean(forcedPortfolioId) || isPortfolioSwitchPending}
                onValueChange={(next) => {
                  field.onChange(next);
                  onPortfolioSelection(next);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Wybierz portfel" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {portfolios.map((portfolio) => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      <ScreenshotImportWizard
        variant="dialog"
        onClose={onClose}
        onCompleted={onCompleted}
        searchClient={searchClient}
        portfolio={screenshotPortfolio ?? undefined}
      />
    </>
  );
}
