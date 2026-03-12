"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DemoPortfolioBadge } from "../components/DemoPortfolioBadge";
import { Button } from "@/features/design-system/components/ui/button";
import {
  formatCurrencyString,
  getCurrencyFormatter,
  splitCurrencyLabel,
} from "@/lib/format-currency";
import { parseDecimalString } from "@/lib/decimal";
import { cn } from "@/lib/cn";

type Props = Readonly<{
  portfolioLabel: string;
  isDemo?: boolean;
  addTransactionHref: string;
  baseCurrency: string;
  totalValueBase: string | null;
  dailyChangeBase: string | null;
  asOf: string | null;
  valuationSummary: string;
  valuationTone: "positive" | "warning";
  portfolioSwitcher?: React.ReactNode;
}>;

export function PortfolioNetValueHero({
  portfolioLabel,
  isDemo = false,
  addTransactionHref,
  baseCurrency,
  totalValueBase,
  dailyChangeBase,
  asOf,
  valuationSummary,
  valuationTone,
  portfolioSwitcher,
}: Props) {
  const formatter = getCurrencyFormatter(baseCurrency);
  const formattedTotalValue =
    formatter && totalValueBase
      ? formatCurrencyString(totalValueBase, formatter)
      : null;

  const totalValueLabel =
    formattedTotalValue ?? (totalValueBase ? `${totalValueBase} ${baseCurrency}` : "—");
  const parsedTotalValue = parseDecimalString(totalValueBase);
  const targetAmount = parsedTotalValue ? Number(parsedTotalValue.toString()) : null;
  const [animatedAmount, setAnimatedAmount] = useState<number | null>(targetAmount);
  const rafRef = useRef<number | null>(null);
  const animationStartRef = useRef<number | null>(null);

  const dailyChangeDecimal = parseDecimalString(dailyChangeBase);
  const totalValueDecimal = parseDecimalString(totalValueBase);
  const formattedDailyChange =
    dailyChangeDecimal && formatter
      ? formatCurrencyString(dailyChangeDecimal.abs().toString(), formatter)
      : dailyChangeDecimal
        ? `${dailyChangeDecimal.abs().toString()} ${baseCurrency}`
        : null;
  const dailyChangeLabel =
    dailyChangeDecimal && formattedDailyChange
      ? dailyChangeDecimal.gt(0)
        ? `+${formattedDailyChange}`
        : dailyChangeDecimal.lt(0)
          ? `-${formattedDailyChange}`
          : formattedDailyChange
      : null;
  const dailyChangePercentValue =
    dailyChangeDecimal && totalValueDecimal && !totalValueDecimal.eq(0)
      ? Number(dailyChangeDecimal.div(totalValueDecimal).toString())
      : null;
  const dailyChangePercentLabel =
    dailyChangePercentValue !== null
      ? new Intl.NumberFormat("pl-PL", {
          style: "percent",
          maximumFractionDigits: 2,
        }).format(dailyChangePercentValue)
      : null;
  const dailyChangePercentSigned =
    dailyChangePercentValue !== null && dailyChangePercentValue > 0
      ? `+${dailyChangePercentLabel}`
      : dailyChangePercentLabel;
  const dailyChangeCombined =
    dailyChangeLabel && dailyChangePercentSigned
      ? `${dailyChangeLabel} (${dailyChangePercentSigned})`
      : dailyChangeLabel;
  const dailyChangeTone =
    dailyChangeDecimal && dailyChangeDecimal.gt(0)
      ? "text-[color:var(--profit)]"
    : dailyChangeDecimal
        ? "text-[color:var(--loss)]"
        : "text-muted-foreground";

  useEffect(() => {
    if (targetAmount === null || !Number.isFinite(targetAmount)) {
      return;
    }

    const durationMs = 600;
    animationStartRef.current = null;

    const step = (timestamp: number) => {
      if (animationStartRef.current === null) {
        animationStartRef.current = timestamp;
      }
      const elapsed = timestamp - animationStartRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      setAnimatedAmount(targetAmount * progress);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetAmount]);

  const resolvedAnimatedAmount =
    targetAmount === null || !Number.isFinite(targetAmount) ? targetAmount : animatedAmount;
  const animatedTotalLabel =
    resolvedAnimatedAmount === null || !Number.isFinite(resolvedAnimatedAmount)
      ? totalValueLabel
      : formatter
        ? formatter.format(resolvedAnimatedAmount)
        : `${resolvedAnimatedAmount.toFixed(2)} ${baseCurrency}`;

  const { amount: totalValueAmount, currency: totalValueCurrency } =
    splitCurrencyLabel(animatedTotalLabel);
  const valuationToneClass =
    valuationTone === "warning" ? "text-[color:var(--chart-3)]" : "text-[color:var(--profit)]";
  const metadataItems = [
    valuationSummary,
    "Notowania opóźnione 10 minut",
    asOf ? `Stan na ${asOf}` : null,
  ].filter(Boolean) as string[];

  return (
    <section className="rounded-xl border border-border/60 bg-card/96 px-4 py-4 shadow-[var(--surface-shadow)] sm:px-5 sm:py-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/78">
            Portfel
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {portfolioLabel}
            </h1>
            {isDemo ? <DemoPortfolioBadge className="px-3 py-1.5 text-xs" /> : null}
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Waluta bazowa: {baseCurrency}
          </div>
        </div>
        <div className="flex w-full items-start justify-start lg:w-auto lg:justify-end">
          <Button asChild size="lg" className="h-11 w-full lg:w-auto">
            <Link href={addTransactionHref} scroll={false} data-testid="portfolio-add-transaction-cta">
              Dodaj transakcję
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-5 border-t border-dashed border-border/60 pt-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/82">
          Wartość netto
        </div>
        <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
          <div
            className="font-mono text-3xl font-medium tracking-tight tabular-nums text-foreground sm:text-4xl"
            data-testid="portfolio-net-value"
          >
            <span>{totalValueAmount}</span>
            {totalValueCurrency ? (
              <span className="ml-1.5 text-base font-medium text-muted-foreground/75 sm:text-lg">
                {totalValueCurrency}
              </span>
            ) : null}
          </div>
          <div className="mb-1 flex items-baseline gap-2 text-sm">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
              Dzisiaj
            </span>
            <span className={cn("font-mono text-xs tabular-nums", dailyChangeTone)}>
              {dailyChangeCombined ?? "—"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className={cn("font-medium", valuationToneClass)}>{valuationSummary}</span>
          {metadataItems.slice(1).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>

        {portfolioSwitcher ? <div className="mt-4 max-w-md">{portfolioSwitcher}</div> : null}
      </div>
    </section>
  );
}
