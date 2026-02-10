"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/design-system/components/ui/form";
import { Checkbox } from "@/features/design-system/components/ui/checkbox";
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
import { formatMoney } from "./constants";
import type { FormValues } from "../AddTransactionDialogContent";
import type { UseFormReturn } from "react-hook-form";

export function AddTransactionCashSection({
  form,
  consumeCash,
  cashCurrency,
  transactionType,
  resolvedCashCurrency,
  isFxMismatch,
  availableCashNow,
  availableCashOnTradeDate,
  tradeDate,
  projectedCashDeltaLabel,
  projectedCashAfterLabel,
  hasInsufficientCash,
  isCashBalanceOnDateLoading,
  cashBalanceOnDateErrorMessage,
  isFxPreviewLoading,
  fxPreviewErrorMessage,
  handleCashCurrencyChange,
  isCashTab,
}: Readonly<{
  form: UseFormReturn<FormValues>;
  consumeCash: boolean;
  cashCurrency: string;
  transactionType: FormValues["type"];
  resolvedCashCurrency: CashCurrency;
  isFxMismatch: boolean;
  availableCashNow: string;
  availableCashOnTradeDate: string;
  tradeDate: string;
  projectedCashDeltaLabel: string | null;
  projectedCashAfterLabel: string | null;
  hasInsufficientCash: boolean;
  isCashBalanceOnDateLoading: boolean;
  cashBalanceOnDateErrorMessage: string | null;
  isFxPreviewLoading: boolean;
  fxPreviewErrorMessage: string | null;
  handleCashCurrencyChange: (next: string) => void;
  isCashTab: boolean;
}>) {
  const cashSettlementLabel = resolveCashSettlementLabel(transactionType);

  if (isCashTab) {
    return null;
  }

  return (
    <div className="space-y-3">
      <FormField
        control={form.control}
        name="consumeCash"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rozliczenie gotówką</FormLabel>
            <FormControl>
              <div className="flex h-11 items-center gap-3">
                <Checkbox
                  checked={field.value}
                  className="h-5 w-5"
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    field.onChange(isChecked);
                    if (isChecked && !cashCurrency) {
                      // Keep cash currency valid when user enables settlement from cash.
                      form.setValue("cashCurrency", resolvedCashCurrency, {
                        shouldValidate: true,
                      });
                    }
                  }}
                />
                <Label className="m-0 text-base font-medium leading-none">
                  {cashSettlementLabel}
                </Label>
              </div>
            </FormControl>
          </FormItem>
        )}
      />

      {consumeCash ? (
        <div className="space-y-3 rounded-md border border-border/70 bg-muted/20 p-3">
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
                    <FormLabel>Opłata FX</FormLabel>
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

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-3">
              <span>Dostępna gotówka (na dziś)</span>
              <span className="font-mono tabular-nums">
                {formatMoney(availableCashNow, resolvedCashCurrency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Dostępna gotówka (na dzień transakcji)</span>
              <span className="font-mono tabular-nums">
                {formatMoney(availableCashOnTradeDate, resolvedCashCurrency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Zmiana gotówki</span>
              <span className="font-mono tabular-nums">
                {projectedCashDeltaLabel ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2">
              <span>Po transakcji</span>
              <span className="font-mono tabular-nums">
                {projectedCashAfterLabel ?? "—"}
              </span>
            </div>

            {isCashBalanceOnDateLoading ? (
              <p>Pobieram saldo gotówki na dzień {tradeDate}...</p>
            ) : null}

            {cashBalanceOnDateErrorMessage ? (
              <p className="text-destructive">{cashBalanceOnDateErrorMessage}</p>
            ) : null}

            <p>
              Walidacja używa salda na dzień transakcji. Dla kilku operacji z tą
              samą datą najpierw dodaj depozyt gotówki, potem zakup.
            </p>

            {isFxMismatch ? (
              <p>
                {isFxPreviewLoading
                  ? "Pobieram kurs FX do podglądu rozliczenia..."
                  : "Podgląd używa kursu FX z cache. Finalny zapis użyje kursu dostępnego w momencie zapisu."}
              </p>
            ) : null}

            {fxPreviewErrorMessage ? (
              <p className="text-destructive">{fxPreviewErrorMessage}</p>
            ) : null}

            {hasInsufficientCash ? (
              <p className="text-destructive">
                Po tej transakcji gotówka byłaby ujemna na dzień {tradeDate}.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export const resolveCashSettlementLabel = (transactionType: FormValues["type"]) =>
  transactionType === "SELL" ? "Dodaj do gotówki" : "Potrąć z gotówki";
