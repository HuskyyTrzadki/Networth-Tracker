"use client";

import type { UseFormReturn } from "react-hook-form";

import { DatePicker } from "@/features/design-system/components/DatePicker";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/design-system/components/ui/form";
import { Input } from "@/features/design-system/components/ui/input";

import { MoneyInput } from "../MoneyInput";
import { formatNumericInputWithCursor } from "../../lib/format-numeric-input";
import { AddTransactionCashSection } from "./AddTransactionCashSection";
import type { FormValues } from "../AddTransactionDialogContent";
import type { CashCurrency } from "../../lib/system-currencies";

type FxPreviewState = Readonly<{
  errorMessage: string | null;
  isLoading: boolean;
}>;

type CashImpactPreviewState = Readonly<{
  fxPreview: FxPreviewState;
  hasInsufficientCash: boolean;
  isFxMismatch: boolean;
  projectedCashAfterLabel: string | null;
  projectedCashDeltaLabel: string | null;
}>;

type CashBalanceOnDateState = Readonly<{
  errorMessage: string | null;
  isLoading: boolean;
}>;

export function AddTransactionCustomTradeFields({
  form,
  minTradeDate,
  maxTradeDate,
  displayCurrency,
  cashImpactPreview,
  cashBalanceOnDate,
  availableCashNow,
  availableCashOnTradeDate,
  tradeDate,
  cashCurrency,
  consumeCash,
  resolvedCashCurrency,
  onCashCurrencyChange,
  isEditMode = false,
}: Readonly<{
  form: UseFormReturn<FormValues>;
  minTradeDate: Date;
  maxTradeDate: Date;
  displayCurrency: string;
  cashImpactPreview: CashImpactPreviewState;
  cashBalanceOnDate: CashBalanceOnDateState;
  availableCashNow: string;
  availableCashOnTradeDate: string;
  tradeDate: string;
  cashCurrency: string;
  consumeCash: boolean;
  resolvedCashCurrency: CashCurrency;
  onCashCurrencyChange: (nextCurrency: string) => void;
  isEditMode?: boolean;
}>) {
  const fieldLabelClass =
    "text-[11px] uppercase tracking-[0.14em] text-muted-foreground";

  return (
    <>
      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={fieldLabelClass}>Data wyceny</FormLabel>
            <FormControl>
              <DatePicker
                maxDate={maxTradeDate}
                minDate={minTradeDate}
                onChange={field.onChange}
                value={field.value}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={fieldLabelClass}>Aktualna wartość</FormLabel>
              <FormControl>
                <MoneyInput
                  {...field}
                  className="h-11"
                  currency={displayCurrency}
                  placeholder="np. 500 000,00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customAnnualRatePct"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={fieldLabelClass}>
                Szacowany wzrost/spadek roczny (%)
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    className="h-11 pr-8 font-mono tabular-nums text-right"
                    disabled={isEditMode}
                    inputMode="decimal"
                    onChange={(event) => {
                      const next = formatNumericInputWithCursor(
                        event.target.value,
                        event.target.selectionStart,
                        { allowNegative: true, maxFractionDigits: 4 }
                      );
                      field.onChange(next.value);
                      if (next.cursor !== null) {
                        requestAnimationFrame(() => {
                          event.target.setSelectionRange(next.cursor, next.cursor);
                        });
                      }
                    }}
                    placeholder="np. 5 lub -5"
                    type="text"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                    %
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <AddTransactionCashSection
        availableCashNow={availableCashNow}
        availableCashOnTradeDate={availableCashOnTradeDate}
        tradeDate={tradeDate}
        cashCurrency={cashCurrency}
        consumeCash={consumeCash}
        transactionType="BUY"
        cashBalanceOnDateErrorMessage={cashBalanceOnDate.errorMessage}
        fxPreviewErrorMessage={cashImpactPreview.fxPreview.errorMessage}
        form={form}
        handleCashCurrencyChange={onCashCurrencyChange}
        hasInsufficientCash={cashImpactPreview.hasInsufficientCash}
        isCashTab={false}
        isCashBalanceOnDateLoading={cashBalanceOnDate.isLoading}
        isFxMismatch={cashImpactPreview.isFxMismatch}
        isFxPreviewLoading={cashImpactPreview.fxPreview.isLoading}
        projectedCashAfterLabel={cashImpactPreview.projectedCashAfterLabel}
        projectedCashDeltaLabel={cashImpactPreview.projectedCashDeltaLabel}
        resolvedCashCurrency={resolvedCashCurrency}
      />
    </>
  );
}
