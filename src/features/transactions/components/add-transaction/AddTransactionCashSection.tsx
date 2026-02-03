"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/design-system/components/ui/form";
import { Label } from "@/features/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/design-system/components/ui/select";

import { MoneyInput } from "../MoneyInput";
import {
  SUPPORTED_CASH_CURRENCIES,
  type CashCurrency,
} from "../../lib/system-currencies";
import type { FormValues } from "../AddTransactionDialogContent";
import type { UseFormReturn } from "react-hook-form";

export function AddTransactionCashSection({
  form,
  consumeCash,
  cashCurrency,
  resolvedCashCurrency,
  isFxMismatch,
  cashDeltaLabel,
  handleCashCurrencyChange,
  isCashTab,
}: Readonly<{
  form: UseFormReturn<FormValues>;
  consumeCash: boolean;
  cashCurrency: string;
  resolvedCashCurrency: CashCurrency;
  isFxMismatch: boolean;
  cashDeltaLabel: string | null;
  handleCashCurrencyChange: (next: string) => void;
  isCashTab: boolean;
}>) {
  if (isCashTab) {
    return null;
  }

  return (
    <div className="space-y-3">
      <FormField
        control={form.control}
        name="consumeCash"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormControl>
              <input
                checked={field.value}
                className="h-4 w-4 rounded border-border text-primary"
                onChange={(event) => {
                  field.onChange(event.target.checked);
                  if (event.target.checked && !cashCurrency) {
                    form.setValue("cashCurrency", resolvedCashCurrency, {
                      shouldValidate: true,
                    });
                  }
                }}
                type="checkbox"
              />
            </FormControl>
            <Label className="text-sm font-medium">Potrąć z gotówki</Label>
          </FormItem>
        )}
      />

      {consumeCash ? (
        <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="cashCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Waluta gotówki</FormLabel>
                  <Select
                    onValueChange={(next) => {
                      field.onChange(next);
                      handleCashCurrencyChange(next);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Wybierz walutę" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUPPORTED_CASH_CURRENCIES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isFxMismatch ? (
              <FormField
                control={form.control}
                name="fxFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opłata FX (opcjonalnie)</FormLabel>
                    <FormControl>
                      <MoneyInput
                        {...field}
                        className="h-11"
                        currency={resolvedCashCurrency}
                        placeholder="np. 0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
          </div>

          <div className="text-xs text-muted-foreground">
            {isFxMismatch
              ? "Rozliczymy gotówkę po kursie FX z cache w momencie zapisu."
              : cashDeltaLabel
                ? `Gotówka zmieni się o ${cashDeltaLabel}.`
                : "Gotówka zostanie rozliczona przy zapisie."}
          </div>
        </div>
      ) : null}
    </div>
  );
}
