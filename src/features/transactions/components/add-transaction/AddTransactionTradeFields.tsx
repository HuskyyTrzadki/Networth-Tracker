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
import { cn } from "@/lib/cn";
import { formatNumericInputWithCursor } from "../../lib/format-numeric-input";

import { MoneyInput } from "../MoneyInput";
import { AddTransactionCashSection } from "./AddTransactionCashSection";
import { HistoricalPriceAssistHint } from "./HistoricalPriceAssistHint";
import type { InstrumentPriceOnDateResponse } from "../../client/get-instrument-price-on-date";
import type { FormValues } from "../AddTransactionDialogContent";
import type { CashCurrency } from "../../lib/system-currencies";

type HistoricalPriceAssistState = Readonly<{
  errorMessage: string | null;
  hint: InstrumentPriceOnDateResponse | null;
  isLoading: boolean;
}>;

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

type Props = Readonly<{
  form: UseFormReturn<FormValues>;
  minTradeDate: Date;
  maxTradeDate: Date;
  isCashTab: boolean;
  transactionType: FormValues["type"];
  displayCurrency: string;
  historicalPriceAssist: HistoricalPriceAssistState;
  cashImpactPreview: CashImpactPreviewState;
  cashBalanceOnDate: CashBalanceOnDateState;
  availableCashNow: string;
  availableCashOnTradeDate: string;
  tradeDate: string;
  cashCurrency: string;
  consumeCash: boolean;
  resolvedCashCurrency: CashCurrency;
  onCashCurrencyChange: (nextCurrency: string) => void;
}>;

export function AddTransactionTradeFields({
  form,
  minTradeDate,
  maxTradeDate,
  isCashTab,
  transactionType,
  displayCurrency,
  historicalPriceAssist,
  cashImpactPreview,
  cashBalanceOnDate,
  availableCashNow,
  availableCashOnTradeDate,
  tradeDate,
  cashCurrency,
  consumeCash,
  resolvedCashCurrency,
  onCashCurrencyChange,
}: Props) {
  return (
    <>
      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data transakcji</FormLabel>
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

      <div className={cn("grid gap-4", isCashTab ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isCashTab ? "Kwota" : "Ilość"}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-11 font-mono tabular-nums text-left"
                  inputMode="decimal"
                  onChange={(event) => {
                    const next = formatNumericInputWithCursor(
                      event.target.value,
                      event.target.selectionStart
                    );
                    field.onChange(next.value);
                    if (next.cursor !== null) {
                      requestAnimationFrame(() => {
                        event.target.setSelectionRange(next.cursor, next.cursor);
                      });
                    }
                  }}
                  placeholder="np. 1,5"
                  type="text"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isCashTab ? (
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cena jednostkowa</FormLabel>
                <FormControl>
                  <MoneyInput
                    {...field}
                    className="h-11"
                    currency={displayCurrency}
                    placeholder="np. 100,00"
                  />
                </FormControl>
                <FormMessage />
                <HistoricalPriceAssistHint
                  errorMessage={historicalPriceAssist.errorMessage}
                  hint={historicalPriceAssist.hint}
                  isLoading={historicalPriceAssist.isLoading}
                />
              </FormItem>
            )}
          />
        ) : null}
      </div>

      {!isCashTab ? (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prowizja / opłaty</FormLabel>
                <FormControl>
                  <MoneyInput
                    {...field}
                    className="h-11 text-left"
                    currency={displayCurrency}
                    placeholder="np. 0,00"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <AddTransactionCashSection
            availableCashNow={availableCashNow}
            availableCashOnTradeDate={availableCashOnTradeDate}
            tradeDate={tradeDate}
            cashCurrency={cashCurrency}
            consumeCash={consumeCash}
            transactionType={transactionType}
            cashBalanceOnDateErrorMessage={cashBalanceOnDate.errorMessage}
            fxPreviewErrorMessage={cashImpactPreview.fxPreview.errorMessage}
            form={form}
            handleCashCurrencyChange={onCashCurrencyChange}
            hasInsufficientCash={cashImpactPreview.hasInsufficientCash}
            isCashTab={isCashTab}
            isCashBalanceOnDateLoading={cashBalanceOnDate.isLoading}
            isFxMismatch={cashImpactPreview.isFxMismatch}
            isFxPreviewLoading={cashImpactPreview.fxPreview.isLoading}
            projectedCashAfterLabel={cashImpactPreview.projectedCashAfterLabel}
            projectedCashDeltaLabel={cashImpactPreview.projectedCashDeltaLabel}
            resolvedCashCurrency={resolvedCashCurrency}
          />
        </div>
      ) : null}
    </>
  );
}
