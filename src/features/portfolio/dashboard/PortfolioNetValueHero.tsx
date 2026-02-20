"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import {
  formatCurrencyString,
  getCurrencyFormatter,
  splitCurrencyLabel,
} from "@/lib/format-currency";
import { Badge } from "@/features/design-system/components/ui/badge";
import { parseDecimalString } from "@/lib/decimal";

type Props = Readonly<{
  portfolioLabel: string;
  baseCurrency: string;
  totalValueBase: string | null;
  isPartial: boolean;
  asOf: string | null;
}>;

export function PortfolioNetValueHero({
  portfolioLabel,
  baseCurrency,
  totalValueBase,
  isPartial,
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
  const quoteAsOfLabel = asOf
    ? new Intl.DateTimeFormat("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(asOf))
    : null;
  const fxAsOfLabel = asOf
    ? new Intl.DateTimeFormat("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(asOf))
    : null;

  return (
    <section className="rounded-lg border border-border/85 bg-card px-4 py-4 shadow-[var(--surface-shadow)] sm:px-5 sm:py-5">
      <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/75">
        {portfolioLabel}
      </div>
      <div className="mt-3 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/85">
        Wartość netto
      </div>
      <LazyMotion features={domAnimation}>
        <m.div
          className="mb-5 mt-1 font-mono text-3xl font-medium tracking-tight tabular-nums text-foreground sm:text-4xl"
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
      </LazyMotion>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="rounded-md px-2 py-0.5 text-[11px]" variant="stamp">
          Notowania z {quoteAsOfLabel ?? "—"}
        </Badge>
        <Badge className="rounded-md px-2 py-0.5 text-[11px]" variant="stamp">
          Kurs FX z dnia {fxAsOfLabel ?? "—"}
        </Badge>
      </div>
      {isPartial ? (
        <p className="mt-2 font-sans text-[13px] text-muted-foreground">
          Częściowa wycena: część instrumentów nie ma aktualnych notowań lub FX.
        </p>
      ) : null}
    </section>
  );
}
