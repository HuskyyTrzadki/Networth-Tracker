"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";
import { parseISO } from "date-fns";

import { DatePicker } from "@/features/design-system/components/ui/date-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/design-system/components/ui/form";
import { Label } from "@/features/design-system/components/ui/label";
import { Input } from "@/features/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/design-system/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/features/design-system/components/ui/tabs";
import { cn } from "@/lib/cn";

import { InstrumentCombobox } from "../InstrumentCombobox";
import { MoneyInput } from "../MoneyInput";
import { AddTransactionCashSection } from "./AddTransactionCashSection";
import { AddTransactionNotesSummary } from "./AddTransactionNotesSummary";
import { HistoricalPriceAssistHint } from "./HistoricalPriceAssistHint";
import { useHistoricalPriceAssist } from "./useHistoricalPriceAssist";
import type { InstrumentSearchClient } from "../../client/search-instruments";
import type { InstrumentSearchResult } from "../../lib/instrument-search";
import {
  SUPPORTED_CASH_CURRENCIES,
  isSupportedCashCurrency,
  type CashCurrency,
} from "../../lib/system-currencies";
import { ASSET_TABS, buildEmptyBalances, formatMoney, type AssetTab } from "./constants";
import { buildCashDeltaLabel } from "./build-cash-delta-label";
import {
  applyCashCurrencyChange,
  applyCashTabState,
  applyNonCashTabState,
} from "./tab-state";
import { getTradeDateLowerBound } from "../../lib/trade-date";
import type { FormValues } from "../AddTransactionDialogContent";

export function AddTransactionDialogFields({
  form,
  selectedInstrument,
  setSelectedInstrument,
  activeTab,
  setActiveTab,
  searchClient,
  portfolios,
  cashBalancesByPortfolio,
  forcedPortfolioId,
  initialCashCurrency,
}: Readonly<{
  form: UseFormReturn<FormValues>;
  selectedInstrument: InstrumentSearchResult | null;
  setSelectedInstrument: (next: InstrumentSearchResult | null) => void;
  activeTab: AssetTab;
  setActiveTab: (next: AssetTab) => void;
  searchClient?: InstrumentSearchClient;
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  cashBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  forcedPortfolioId: string | null;
  initialCashCurrency: CashCurrency;
}>) {
  const currency = useWatch({ control: form.control, name: "currency" });
  const consumeCash = useWatch({ control: form.control, name: "consumeCash" });
  const cashCurrency = useWatch({ control: form.control, name: "cashCurrency" });
  const portfolioId = useWatch({ control: form.control, name: "portfolioId" });
  const type = useWatch({ control: form.control, name: "type" });
  const quantity = useWatch({ control: form.control, name: "quantity" });
  const price = useWatch({ control: form.control, name: "price" });
  const fee = useWatch({ control: form.control, name: "fee" });
  const date = useWatch({ control: form.control, name: "date" });

  const isCashTab = activeTab === "CASH";
  const resolvedPortfolioId = forcedPortfolioId ?? portfolioId;
  const resolvedCashCurrency: CashCurrency = isSupportedCashCurrency(cashCurrency)
    ? (cashCurrency as CashCurrency)
    : initialCashCurrency;
  const cashBalances = cashBalancesByPortfolio[resolvedPortfolioId] ?? buildEmptyBalances();
  const availableCash = cashBalances[resolvedCashCurrency] ?? "0";
  const displayCurrency = selectedInstrument?.currency ?? currency ?? "";
  const minTradeDate = parseISO(getTradeDateLowerBound());
  const isFxMismatch = consumeCash && Boolean(selectedInstrument) &&
    resolvedCashCurrency !== (selectedInstrument?.currency ?? "");
  const historicalPriceAssist = useHistoricalPriceAssist({
    enabled: !isCashTab,
    form,
    provider: selectedInstrument?.provider ?? null,
    providerKey: selectedInstrument?.providerKey ?? null,
    date,
    price,
  });
  const cashDeltaLabel = buildCashDeltaLabel({
    consumeCash,
    hasInstrument: Boolean(selectedInstrument),
    quantity,
    price,
    fee,
    type,
    displayCurrency,
  });

  const handleTabChange = (nextTab: AssetTab) => {
    setActiveTab(nextTab);

    if (nextTab === "CASH") {
      applyCashTabState(form, setSelectedInstrument, resolvedCashCurrency);
      return;
    }

    applyNonCashTabState(form, setSelectedInstrument);
  };

  const handleCashCurrencyChange = (nextCurrency: string) => {
    applyCashCurrencyChange(form, setSelectedInstrument, nextCurrency, isCashTab);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="portfolioId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Portfel</FormLabel>
              <Select
                disabled={Boolean(forcedPortfolioId)}
                onValueChange={(next) => {
                  field.onChange(next);
                  const nextPortfolio = portfolios.find(
                    (portfolio) => portfolio.id === next
                  );
                  if (
                    nextPortfolio &&
                    isSupportedCashCurrency(nextPortfolio.baseCurrency)
                  ) {
                    form.setValue("cashCurrency", nextPortfolio.baseCurrency, {
                      shouldValidate: true,
                    });
                    if (isCashTab) {
                      handleCashCurrencyChange(nextPortfolio.baseCurrency);
                    }
                  }
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Wybierz portfel" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {portfolios.map((portfolio) => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isCashTab ? "Typ przepływu" : "Typ transakcji"}</FormLabel>
              <FormControl>
                <Tabs
                  onValueChange={(next) => {
                    field.onChange(next as "BUY" | "SELL");
                    if (isCashTab) {
                      form.setValue(
                        "cashflowType",
                        next === "BUY" ? "DEPOSIT" : "WITHDRAWAL",
                        { shouldValidate: true }
                      );
                    }
                  }}
                  value={field.value}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger className="w-full" value="BUY">
                      {isCashTab ? "Wpłata" : "Kupno"}
                    </TabsTrigger>
                    <TabsTrigger className="w-full" value="SELL">
                      {isCashTab ? "Wypłata" : "Sprzedaż"}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <Label className="text-sm font-medium">Kategoria instrumentu</Label>
          <Tabs onValueChange={(next) => handleTabChange(next as AssetTab)} value={activeTab}>
            <TabsList className="mt-2 grid w-full grid-cols-2 gap-2 sm:grid-cols-5">
              {ASSET_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <FormField
          control={form.control}
          name="assetId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isCashTab ? "Waluta" : "Instrument"}</FormLabel>
              <FormControl>
                {isCashTab ? (
                  <Select
                    onValueChange={handleCashCurrencyChange}
                    value={resolvedCashCurrency}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Wybierz walutę" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CASH_CURRENCIES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <InstrumentCombobox
                    allowedTypes={
                      ASSET_TABS.find((tab) => tab.value === activeTab)?.types ??
                      undefined
                    }
                    onChange={(instrument) => {
                      setSelectedInstrument(instrument);
                      field.onChange(instrument.id);
                      form.setValue("currency", instrument.currency, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      if (!isSupportedCashCurrency(form.getValues("cashCurrency"))) {
                        form.setValue("cashCurrency", initialCashCurrency, {
                          shouldValidate: true,
                        });
                      }
                    }}
                    searchClient={searchClient}
                    value={selectedInstrument}
                  />
                )}
              </FormControl>
              {isCashTab ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Dostępne: {formatMoney(availableCash, resolvedCashCurrency)}
                </p>
              ) : null}
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
                    className="h-11 font-mono tabular-nums text-right"
                    inputMode="decimal"
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
                  <HistoricalPriceAssistHint
                    currency={displayCurrency}
                    errorMessage={historicalPriceAssist.errorMessage}
                    hint={historicalPriceAssist.hint}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>

        <div className={cn("grid gap-4", isCashTab ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data transakcji</FormLabel>
                <FormControl>
                  <DatePicker
                    maxDate={new Date()}
                    minDate={minTradeDate}
                    onChange={(nextDate) => {
                      form.setValue("date", nextDate, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isCashTab ? (
            <FormField
              control={form.control}
              name="fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prowizja / opłaty</FormLabel>
                  <FormControl>
                    <MoneyInput
                      {...field}
                      className="h-11"
                      currency={displayCurrency}
                      placeholder="np. 0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>

        <AddTransactionCashSection
          cashCurrency={cashCurrency}
          cashDeltaLabel={cashDeltaLabel}
          consumeCash={consumeCash}
          form={form}
          handleCashCurrencyChange={handleCashCurrencyChange}
          isCashTab={isCashTab}
          isFxMismatch={isFxMismatch}
          resolvedCashCurrency={resolvedCashCurrency}
        />

        <AddTransactionNotesSummary
          displayCurrency={displayCurrency}
          fee={fee}
          form={form}
          price={price}
          quantity={quantity}
          type={type}
        />
      </div>
    </div>
  );
}
