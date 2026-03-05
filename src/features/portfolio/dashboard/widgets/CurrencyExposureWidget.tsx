"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";

import { ChartCard } from "@/features/design-system/components/ChartCard";
import { Button } from "@/features/design-system/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/features/design-system/components/ui/toggle-group";
import type {
  CurrencyExposureChartRow,
  CurrencyExposureDetailsRow,
  CurrencyExposureMode,
} from "@/features/portfolio/lib/currency-exposure";
import { cn } from "@/lib/cn";
import { formatCurrencyString, getCurrencyFormatter } from "@/lib/format-currency";

import type { PortfolioSummary } from "../../server/valuation";
import { buildInvestorCurrencyExposure } from "./currency-exposure-view-model";
import {
  buildCurrencyExposureWidgetViewState,
  parseCurrencyExposureMode,
} from "./currency-exposure-widget-view-state";
import { useEconomicCurrencyExposure } from "./use-economic-currency-exposure";

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
  "bg-[var(--chart-3)]",
  "bg-muted-foreground",
] as const;

const formatPercent = (value: number) => `${percentFormatter.format(value)}%`;
const formatDelta = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "" : ""}${percentFormatter.format(value)} pp`;

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
      <div className="rounded-lg border border-dashed border-border/70 bg-background/68 px-4 py-6 text-sm text-muted-foreground">
        Brak danych.
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
          Wpływ
        </p>
        <div className="space-y-2">
          {rows.map((row) => {
            const drivers = findDetailsForCurrency(details, row.currencyCode);

            return (
              <details
                key={`details-${row.currencyCode}`}
                className="group rounded-md border border-dashed border-border/70 bg-background/68"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm text-foreground marker:content-none">
                  <span className="font-mono font-semibold">{getCurrencyLabel(row.currencyCode)}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {formatPercent(row.sharePct)}
                    <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
                  </span>
                </summary>
                <div className="border-t border-dashed border-border/70 px-3 py-2">
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
                              {formatPercent(driver.contributionWithinCurrencyPct)} w walucie
                            </div>
                            <div className="text-[11px] text-foreground">
                              {formatPercent(driver.contributionPct)} w portfelu
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">Brak szczegółów.</p>
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
  const { isLoading, errorMessage, economicResponse, loadEconomicExposure } =
    useEconomicCurrencyExposure({ selectedPortfolioId });
  const {
    activeChart,
    activeDetails,
    deltaChips,
    deltaReferenceLabel,
    isPendingSourceData,
  } = buildCurrencyExposureWidgetViewState({
    mode,
    investorData,
    economicResponse,
  });

  return (
    <ChartCard
      className="border-border/75 bg-card/94"
      surface="subtle"
      title={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span>Ekspozycja walutowa</span>
          <ToggleGroup
            className="rounded-md border border-border/65 bg-background/70 p-1"
            type="single"
            value={mode}
            onValueChange={(value) => {
              const parsedMode = parseCurrencyExposureMode(value);
              if (!parsedMode) {
                return;
              }

              setMode(parsedMode);
              if (parsedMode === "GOSPODARCZA") {
                void loadEconomicExposure({ allowCachedResponse: true });
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
            >
              Gospodarcza
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      }
      subtitle="Notowania vs gospodarcza"
    >
      <div className="space-y-4">
        {deltaChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
              {deltaReferenceLabel}
            </span>
            {deltaChips.map((chip) => (
              <span
                key={`${mode}:${chip.currencyCode}`}
                className={cn(
                  "inline-flex rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]",
                  chip.delta > 0
                    ? "border-[color:var(--profit)]/40 bg-[color:var(--profit)]/10 text-[color:var(--profit)]"
                    : "border-[color:var(--loss)]/40 bg-[color:var(--loss)]/10 text-[color:var(--loss)]"
                )}
              >
                {chip.currencyCode} {formatDelta(chip.delta)}
              </span>
            ))}
          </div>
        ) : null}

        {mode === "GOSPODARCZA" && isLoading ? (
          <div className="rounded-md border border-dashed border-border/70 bg-background/72 p-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Liczę ekspozycję gospodarczą...
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-md border border-loss/25 bg-loss/10 px-3 py-2 text-sm text-loss">
            <p>{errorMessage}</p>
            {mode === "GOSPODARCZA" ? (
              <Button
                className="mt-2 h-8 rounded-full"
                onClick={() => {
                  void loadEconomicExposure({ allowCachedResponse: false });
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                <Sparkles className="mr-1.5 size-3.5" aria-hidden />
                Spróbuj ponownie
              </Button>
            ) : null}
          </div>
        ) : null}

        {mode === "GOSPODARCZA" && isPendingSourceData ? (
          <div className="rounded-md border border-dashed border-border/70 bg-background/72 px-3 py-3 text-sm">
            <p className="text-foreground">Dane geograficzne w trakcie opracowywania.</p>
            <p className="mt-1 text-muted-foreground">
              Sprawdzimy je w najbliższym dziennym odświeżeniu.
            </p>
          </div>
        ) : null}

        {!isPendingSourceData ? (
          <ExposureBars rows={activeChart} details={activeDetails} baseCurrency={summary.baseCurrency} />
        ) : null}
      </div>
    </ChartCard>
  );
}
