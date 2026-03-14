"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

import { ChangePill } from "@/features/design-system/components/ChangePill";
import { Button } from "@/features/design-system/components/ui/button";
import { cardVariants } from "@/features/design-system/components/ui/card";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";
import { resolveInstrumentVisual } from "@/features/transactions/lib/instrument-visual";
import { cn } from "@/lib/cn";
import { splitCurrencyLabel } from "@/lib/format-currency";

import type { StockScreenerMonitoringItem } from "./stock-screener-monitoring";
import { StockScreenerPreviewChartLazy } from "./StockScreenerPreviewChartLazy";

type Props = Readonly<{
  item: StockScreenerMonitoringItem;
}>;

const formatPrice = (value: string | null, currency: string) => {
  if (!value) return "-";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(numeric);
};

function PriceLabel({
  value,
  currency,
}: Readonly<{ value: string | null; currency: string }>) {
  const label = formatPrice(value, currency);
  const { amount, currency: currencyLabel } = splitCurrencyLabel(label);

  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span>{amount}</span>
      {currencyLabel ? (
        <span className="text-xs font-medium text-muted-foreground/80">
          {currencyLabel}
        </span>
      ) : null}
    </span>
  );
}

export function StockScreenerLeadCard({ item }: Props) {
  const { card } = item;
  const visual = resolveInstrumentVisual({
    symbol: card.symbol,
    name: card.name,
  });
  const isHydrating = card.isHydrating === true;

  return (
    <section className="mt-7">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/75">
            Na radarze
          </p>
          <h2 className="text-xl font-semibold tracking-tight">{item.signalLabel}</h2>
        </div>
        <Button asChild variant="ghost" className="h-9 rounded-sm px-2 text-xs">
          <Link href={`/stocks/${encodeURIComponent(card.providerKey)}`}>
            Otwórz raport
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </Button>
      </div>

      <Link
        href={`/stocks/${encodeURIComponent(card.providerKey)}`}
        className={cn(
          cardVariants(),
          "grid gap-5 rounded-sm border-border/55 bg-card/96 p-5 transition-colors duration-150 hover:border-primary/35 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.15fr)]"
        )}
      >
        <div className="flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <InstrumentLogoImage
                src={card.logoUrl}
                size={44}
                fallbackText={visual.label}
                ticker={visual.logoTicker}
                alt={card.name}
              />
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {item.badges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/85"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="font-mono text-sm font-semibold tracking-tight">
                    {card.symbol}
                  </p>
                  <h3 className="text-2xl font-semibold tracking-tight">{card.name}</h3>
                </div>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {item.isOnDip
                ? "Największy spadek wśród najważniejszych pozycji. Warto sprawdzić, czy to chwilowy szum, czy zmiana tezy."
                : "Najmocniejszy ruch w tym widoku. To dobry punkt startu do szybkiego przeglądu sesji."}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-t border-dashed border-black/10 pt-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                Kurs
              </p>
              <div className="font-mono text-2xl font-semibold tabular-nums">
                {isHydrating ? (
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Ładowanie
                  </span>
                ) : (
                  <PriceLabel value={card.price} currency={card.currency} />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                Ruch
              </p>
              {isHydrating ? (
                <span className="inline-flex h-5 w-20 animate-pulse rounded bg-muted/60" />
              ) : (
                <ChangePill
                  value={item.moveLabel}
                  trend={item.trend}
                  className="rounded-sm px-2 py-0.5 text-[11px]"
                />
              )}
            </div>
          </div>
        </div>

        <div className="min-h-[220px] rounded-sm border border-border/45 bg-muted/12 p-2">
          {isHydrating ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-sm bg-background/60 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              <span className="text-sm">Ładowanie danych spółki...</span>
            </div>
          ) : (
            <StockScreenerPreviewChartLazy
              data={item.previewData}
              currency={card.currency}
            />
          )}
        </div>
      </Link>
    </section>
  );
}
