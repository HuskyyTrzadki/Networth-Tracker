"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import {
  formatCurrencyString,
  getCurrencyFormatter,
  splitCurrencyLabel,
} from "@/lib/format-currency";
import { parseDecimalString } from "@/lib/decimal";
import { cn } from "@/lib/cn";

type Props = Readonly<{
  portfolioLabel: string;
  baseCurrency: string;
  totalValueBase: string | null;
  dailyChangeBase: string | null;
  asOf: string | null;
}>;

export function PortfolioNetValueHero({
  portfolioLabel,
  baseCurrency,
  totalValueBase,
  dailyChangeBase,
  asOf,
}: Props) {
  const prefersReducedMotion = useReducedMotion() ?? false;
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
    if (prefersReducedMotion || targetAmount === null || !Number.isFinite(targetAmount)) {
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
  }, [prefersReducedMotion, targetAmount]);

  const animatedTotalLabel = useMemo(() => {
    const resolvedAmount =
      prefersReducedMotion || targetAmount === null || !Number.isFinite(targetAmount)
        ? targetAmount
        : animatedAmount;

    if (resolvedAmount === null || !Number.isFinite(resolvedAmount)) {
      return totalValueLabel;
    }

    if (formatter) {
      return formatter.format(resolvedAmount);
    }

    return `${resolvedAmount.toFixed(2)} ${baseCurrency}`;
  }, [
    animatedAmount,
    baseCurrency,
    formatter,
    prefersReducedMotion,
    targetAmount,
    totalValueLabel,
  ]);

  const { amount: totalValueAmount, currency: totalValueCurrency } =
    splitCurrencyLabel(animatedTotalLabel);

  return (
    <section className="rounded-lg border border-border/72 bg-card/94 px-4 py-4 shadow-[var(--surface-shadow)] sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-sm border border-border/65 bg-background/72 px-2 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-[0.11em] text-muted-foreground/80">
          {portfolioLabel}
        </div>
        <div className="inline-flex rounded-sm border border-border/60 bg-background/72 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-muted-foreground/90">
          {baseCurrency}
        </div>
      </div>
      <div className="mt-3 border-t border-dashed border-border/60 pt-2 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/85">
        Wartość netto
      </div>
      <LazyMotion features={domAnimation}>
        <div className="mb-4 mt-1 flex flex-wrap items-end gap-3">
          <m.div
            className="font-mono text-3xl font-medium tracking-tight tabular-nums text-foreground sm:text-4xl"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          >
            <span>{totalValueAmount}</span>
            {totalValueCurrency ? (
              <span className="ml-1.5 text-base font-medium text-muted-foreground/75 sm:text-lg">
                {totalValueCurrency}
              </span>
            ) : null}
          </m.div>
        </div>
      </LazyMotion>
      <div className="grid gap-2 border-t border-dashed border-border/60 pt-2 sm:grid-cols-2">
        <div className="rounded-sm border border-border/60 bg-background/70 px-2.5 py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
            Stan na
          </p>
          <p className="mt-0.5 font-mono text-xs tabular-nums text-foreground/90">
            {asOf ? asOf : "—"}
          </p>
        </div>
        <div className="rounded-sm border border-border/60 bg-background/70 px-2.5 py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
            Zmiana dzienna
          </p>
          <p className={cn("mt-0.5 font-mono text-xs tabular-nums", dailyChangeTone)}>
            {dailyChangeCombined ?? "—"}
          </p>
        </div>
      </div>
    </section>
  );
}
