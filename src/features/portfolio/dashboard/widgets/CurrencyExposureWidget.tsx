"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";

import { ChartCard } from "@/features/design-system";
import { Button } from "@/features/design-system/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/features/design-system/components/ui/toggle-group";
import type {
  CurrencyExposureChartRow,
  CurrencyExposureDetailsRow,
  CurrencyExposureMode,
  EconomicCurrencyExposureApiResponse,
} from "@/features/portfolio/lib/currency-exposure";
import { getEconomicCurrencyExposure } from "@/features/portfolio/client/get-economic-currency-exposure";
import { cn } from "@/lib/cn";
import { formatCurrencyString, getCurrencyFormatter } from "@/lib/format-currency";

import type { PortfolioSummary } from "../../server/valuation";
import { buildInvestorCurrencyExposure } from "./currency-exposure-view-model";

type Props = Readonly<{
  summary: PortfolioSummary;
  selectedPortfolioId: string | null;
}>;

const percentFormatter = new Intl.NumberFormat("pl-PL", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const BAR_COLORS = [
  "bg-[var(--chart-1)]",
  "bg-[var(--chart-2)]",
  "bg-[var(--chart-3)]",
  "bg-[var(--chart-4)]",
  "bg-[var(--chart-5)]",
  "bg-amber-500",
  "bg-muted-foreground",
] as const;

const formatPercent = (value: number) => `${percentFormatter.format(value)}%`;

const SPECIAL_CURRENCY_LABELS: Record<string, string> = {
  INNE: "Inne",
  OTHER: "Inne",
  PLN: "Polski Złoty (PLN)",
  USD: "Dolar amerykański (USD)",
  EUR: "Euro (EUR)",
};

const currencyDisplayNames =
  typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["pl-PL"], { type: "currency" })
    : null;

const toSentenceCase = (value: string) =>
  value.length > 0 ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

const getCurrencyLabel = (currencyCode: string) => {
  const normalizedCode = currencyCode.trim().toUpperCase();
  const specialLabel = SPECIAL_CURRENCY_LABELS[normalizedCode];
  if (specialLabel) return specialLabel;

  const localizedName = currencyDisplayNames?.of(normalizedCode);
  if (!localizedName) return normalizedCode;

  return `${toSentenceCase(localizedName)} (${normalizedCode})`;
};

const findDetailsForCurrency = (
  details: readonly CurrencyExposureDetailsRow[],
  currencyCode: string
) => details.find((row) => row.currencyCode === currencyCode)?.drivers ?? [];

function ExposureBars({
  rows,
  details,
  baseCurrency,
}: Readonly<{
  rows: readonly CurrencyExposureChartRow[];
  details: readonly CurrencyExposureDetailsRow[];
  baseCurrency: string;
}>) {
  const currencyFormatter = getCurrencyFormatter(baseCurrency);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
        Brak danych do obliczenia ekspozycji walutowej.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {rows.map((row, index) => {
          const color = BAR_COLORS[index] ?? BAR_COLORS[BAR_COLORS.length - 1];
          const valueLabel = currencyFormatter
            ? formatCurrencyString(row.valueBase, currencyFormatter) ?? `${row.valueBase} ${baseCurrency}`
            : `${row.valueBase} ${baseCurrency}`;

          return (
            <div key={row.currencyCode} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-semibold tracking-wide text-foreground">
                  {getCurrencyLabel(row.currencyCode)}
                </span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {formatPercent(row.sharePct)} • {valueLabel}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted/45">
                <div
                  className={cn("h-full rounded-full transition-[width] duration-500 ease-out", color)}
                  style={{ width: `${Math.max(row.sharePct, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Największy wpływ
        </p>
        <div className="space-y-2">
          {rows.map((row) => {
            const drivers = findDetailsForCurrency(details, row.currencyCode);

            return (
              <details
                key={`details-${row.currencyCode}`}
                className="group rounded-md border border-border/70 bg-muted/10"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm text-foreground marker:content-none">
                  <span className="font-mono font-semibold">{getCurrencyLabel(row.currencyCode)}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {formatPercent(row.sharePct)}
                    <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
                  </span>
                </summary>
                <div className="border-t border-border/70 px-3 py-2">
                  {drivers.length > 0 ? (
                    <ul className="space-y-1.5">
                      {drivers.map((driver) => (
                        <li
                          key={`${row.currencyCode}:${driver.instrumentId}`}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-foreground">{driver.symbol}</div>
                            <div className="truncate text-muted-foreground">{driver.name}</div>
                          </div>
                          <div className="text-right font-mono tabular-nums">
                            <div className="text-[11px] text-muted-foreground">
                              {formatPercent(driver.contributionWithinCurrencyPct)} waluty
                            </div>
                            <div className="text-[11px] text-foreground">
                              {formatPercent(driver.contributionPct)} portfela
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">Brak szczegółów dla tej waluty.</p>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CurrencyExposureWidget({ summary, selectedPortfolioId }: Props) {
  const investorData = buildInvestorCurrencyExposure(summary);
  const [mode, setMode] = useState<CurrencyExposureMode>("NOTOWANIA");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [economicResponse, setEconomicResponse] =
    useState<EconomicCurrencyExposureApiResponse | null>(null);

  const activeChart = mode === "GOSPODARCZA" ? economicResponse?.chart ?? [] : investorData.chart;
  const activeDetails =
    mode === "GOSPODARCZA" ? economicResponse?.details ?? [] : investorData.details;

  const calculateEconomicExposure = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getEconomicCurrencyExposure({
        portfolioId: selectedPortfolioId,
      });
      setEconomicResponse(response);
      setMode("GOSPODARCZA");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nie udało się obliczyć ekspozycji gospodarczej."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChartCard
      surface="subtle"
      title={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span>Ekspozycja walutowa</span>
          <ToggleGroup
            className="rounded-md border border-border/70 bg-muted/35 p-1"
            type="single"
            value={mode}
            onValueChange={(value) => {
              if (value === "NOTOWANIA" || value === "GOSPODARCZA") {
                setMode(value);
              }
            }}
          >
            <ToggleGroupItem value="NOTOWANIA" variant="ledger" className="h-8 px-3 text-sm">
              Notowania
            </ToggleGroupItem>
            <ToggleGroupItem
              value="GOSPODARCZA"
              variant="ledger"
              className="h-8 px-3 text-sm"
              disabled={!economicResponse}
            >
              Gospodarcza
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      }
      subtitle="Notowania: waluta instrumentu. Gospodarcza: ekspozycja przychodowa i geograficzna."
    >
      <div className="space-y-4">
        {!economicResponse ? (
          <div className="rounded-md border border-border/70 bg-muted/15 p-3">
            <Button
              className="h-9"
              disabled={isLoading}
              onClick={calculateEconomicExposure}
              type="button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Obliczam...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" aria-hidden />
                  Oblicz ekspozycję gospodarczą
                </>
              )}
            </Button>
            {isLoading ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Analizator sprawdza ekspozycję geograficzną i walutową portfela...
              </p>
            ) : null}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-md border border-loss/25 bg-loss/10 px-3 py-2 text-sm text-loss">
            {errorMessage}
          </div>
        ) : null}

        <ExposureBars rows={activeChart} details={activeDetails} baseCurrency={summary.baseCurrency} />
      </div>
    </ChartCard>
  );
}
