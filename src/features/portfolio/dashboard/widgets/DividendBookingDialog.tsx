"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/design-system/components/ui/dialog";
import { Input } from "@/features/design-system/components/ui/input";
import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";
import { parseDecimalInput } from "@/features/transactions/lib/parse-decimal";
import type { DividendInboxItem } from "@/features/portfolio/lib/dividend-inbox";
import { bookDividend } from "@/features/portfolio/client/dividend-inbox";
import { formatCurrencyString, getCurrencyFormatter } from "@/lib/format-currency";
import { cn } from "@/lib/cn";

type Props = Readonly<{
  portfolioId: string;
  item: DividendInboxItem;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onBooked: () => void;
}>;

const formatMoney = (value: string | null, currency: string) => {
  if (!value) return "—";
  const formatter = getCurrencyFormatter(currency);
  return formatter ? formatCurrencyString(value, formatter) ?? `${value} ${currency}` : `${value} ${currency}`;
};

const normalizeDecimalInput = (value: string) =>
  value.trim().replace(/\s+/g, "").replace(",", ".");

export function DividendBookingDialog({
  portfolioId,
  item,
  open,
  onOpenChange,
  onBooked,
}: Props) {
  const [netAmount, setNetAmount] = useState(item.netSuggested ?? item.estimatedGross ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  const submit = async () => {
    const parsed = parseDecimalInput(netAmount);
    if (parsed === null || parsed <= 0) {
      setErrorMessage("Wpisz wartość netto większą od 0.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await bookDividend({
        portfolioId,
        providerKey: item.providerKey,
        symbol: item.symbol,
        eventDate: item.eventDate,
        payoutCurrency: item.payoutCurrency,
        netAmount: normalizeDecimalInput(netAmount),
        dividendEventKey: item.dividendEventKey,
      });

      dispatchAppToast({
        title: "Dywidenda zaksięgowana",
        description: `${item.symbol}: ${normalizeDecimalInput(netAmount)} ${item.payoutCurrency}`,
        tone: "success",
      });

      setIsCelebrating(true);
      setTimeout(() => {
        onOpenChange(false);
        onBooked();
      }, 750);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nie udało się zaksięgować dywidendy.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Zaksięguj dywidendę</DialogTitle>
          <DialogDescription>
            Potwierdź wartość netto z wyciągiem brokera przed zapisem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <dl className="space-y-2 rounded-md border border-border/70 bg-muted/15 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Instrument</dt>
              <dd className="font-medium">{item.symbol}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Data zdarzenia</dt>
              <dd className="font-mono tabular-nums">{item.eventDate}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Szacowana liczba akcji</dt>
              <dd className="font-mono tabular-nums">{item.estimatedShares ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Szacowana kwota brutto</dt>
              <dd className="font-mono tabular-nums">
                {formatMoney(item.estimatedGross, item.payoutCurrency)}
              </dd>
            </div>
          </dl>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="dividend-net-amount">
              Wartość netto
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="dividend-net-amount"
                className="font-mono tabular-nums"
                disabled={isSubmitting}
                inputMode="decimal"
                onChange={(event) => setNetAmount(event.target.value)}
                placeholder="np. 85.00"
                value={netAmount}
              />
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                {item.payoutCurrency}
              </span>
            </div>
            {item.smartDefaultHint ? (
              <p className="text-xs text-muted-foreground">{item.smartDefaultHint}</p>
            ) : null}
            {errorMessage ? (
              <p className="text-xs text-destructive">{errorMessage}</p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="mt-1">
          <Button
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Anuluj
          </Button>
          <Button disabled={isSubmitting} onClick={submit} type="button">
            Zaksięguj
          </Button>
        </DialogFooter>

        <AnimatePresence>
          {isCelebrating ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={cn(
                "pointer-events-none absolute inset-0 grid place-items-center rounded-lg",
                "bg-emerald-500/8 backdrop-blur-[1px]"
              )}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-white/90 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm">
                <Sparkles className="size-4" aria-hidden />
                Zaksięgowano
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
