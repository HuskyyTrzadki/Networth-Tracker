"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PortfolioAreaChart } from "@/features/design-system";
import { Tabs, TabsList, TabsTrigger } from "@/features/design-system/components/ui/tabs";
import { cn } from "@/lib/cn";
import { getCurrencyFormatter } from "@/lib/format-currency";

import type { SnapshotCurrency } from "../../server/snapshots/supported-currencies";
import type { SnapshotScope, SnapshotSeries } from "../../server/snapshots/types";

const currencyLabels: Record<SnapshotCurrency, string> = {
  PLN: "PLN",
  USD: "USD",
  EUR: "EUR",
};

type Props = Readonly<{
  scope: SnapshotScope;
  portfolioId: string | null;
  hasHoldings: boolean;
  hasSnapshots: boolean;
  seriesByCurrency: Readonly<Record<SnapshotCurrency, SnapshotSeries>>;
}>;

export function PortfolioValueOverTimeChart({
  scope,
  portfolioId,
  hasHoldings,
  hasSnapshots,
  seriesByCurrency,
}: Props) {
  const [currency, setCurrency] = useState<SnapshotCurrency>("PLN");
  const [bootstrapped, setBootstrapped] = useState(false);
  const router = useRouter();

  const shouldBootstrap = hasHoldings && !hasSnapshots && !bootstrapped;

  useEffect(() => {
    if (!shouldBootstrap) return;

    const payload =
      scope === "PORTFOLIO"
        ? { scope, portfolioId }
        : { scope };

    void fetch("/api/portfolio-snapshots/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).finally(() => {
      setBootstrapped(true);
      router.refresh();
    });
  }, [portfolioId, router, scope, shouldBootstrap]);

  const series = seriesByCurrency[currency];
  const hasPoints = series.points.length > 0;
  const latestMeta = series.latestMeta;
  const showPartial = hasPoints && Boolean(latestMeta?.isPartial);
  const formatter = getCurrencyFormatter(currency);
  const valueFormatter = formatter
    ? (value: number) => formatter.format(value)
    : undefined;
  const labelFormatter = (label: string) =>
    new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "short",
    }).format(new Date(label));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={currency} onValueChange={(value) => setCurrency(value as SnapshotCurrency)}>
          <TabsList>
            {Object.entries(currencyLabels).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {showPartial && latestMeta ? (
          <div className="text-xs text-muted-foreground">
            Częściowa wycena: brak cen dla {latestMeta.missingQuotes} pozycji,
            brak FX dla {latestMeta.missingFx} pozycji.
          </div>
        ) : null}
      </div>
      {hasPoints ? (
        <PortfolioAreaChart
          data={series.points}
          height={240}
          valueFormatter={valueFormatter}
          labelFormatter={labelFormatter}
        />
      ) : (
        <div
          className={cn(
            "grid h-[240px] place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground",
            shouldBootstrap ? "animate-pulse" : ""
          )}
        >
          {hasHoldings
            ? "Tworzymy pierwszy punkt wartości portfela."
            : "Dodaj transakcje, aby zobaczyć wykres."}
        </div>
      )}
    </div>
  );
}
