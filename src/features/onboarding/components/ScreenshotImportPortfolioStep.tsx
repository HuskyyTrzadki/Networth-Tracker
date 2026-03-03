"use client";

import { Sparkles } from "lucide-react";

import { AnimatedReveal } from "@/features/design-system/components/AnimatedReveal";
import { Button } from "@/features/design-system/components/ui/button";
import { Input } from "@/features/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/design-system/components/ui/select";
import { portfolioBaseCurrencies } from "@/features/portfolio/lib/base-currency";

export function ScreenshotImportPortfolioStep({
  portfolioName,
  baseCurrency,
  isPortfolioValid,
  onPortfolioNameChange,
  onBaseCurrencyChange,
  onNext,
}: Readonly<{
  portfolioName: string;
  baseCurrency: string;
  isPortfolioValid: boolean;
  onPortfolioNameChange: (value: string) => void;
  onBaseCurrencyChange: (value: string) => void;
  onNext: () => void;
}>) {
  return (
    <AnimatedReveal y={8}>
      <section className="grid gap-6 rounded-xl border border-border/70 bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background">
            <Sparkles className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Nazwij portfel</h3>
            <p className="text-sm text-muted-foreground">
              To będzie Twój nowy portfel startowy. Możesz później zmienić nazwę.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Nazwa portfela
            </label>
            <Input
              className="h-11"
              placeholder="np. Moje inwestycje"
              value={portfolioName}
              onChange={(event) => onPortfolioNameChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Waluta bazowa
            </label>
            <Select value={baseCurrency} onValueChange={onBaseCurrencyChange}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Wybierz" />
              </SelectTrigger>
              <SelectContent>
                {portfolioBaseCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            className="h-11 px-6"
            disabled={!isPortfolioValid}
            onClick={onNext}
          >
            Dalej
          </Button>
        </div>
      </section>
    </AnimatedReveal>
  );
}
