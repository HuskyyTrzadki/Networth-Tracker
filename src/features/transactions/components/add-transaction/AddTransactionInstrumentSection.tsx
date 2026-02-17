"use client";

import { format } from "date-fns";
import { Coins, Landmark, Wallet } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/design-system/components/ui/form";
import { Label } from "@/features/design-system/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/design-system/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/features/design-system/components/ui/tabs";

import { InstrumentCombobox } from "../InstrumentCombobox";
import type { InstrumentSearchClient } from "../../client/search-instruments";
import type { InstrumentSearchResult } from "../../lib/instrument-search";
import {
  SUPPORTED_CASH_CURRENCIES,
  isSupportedCashCurrency,
  type CashCurrency,
} from "../../lib/system-currencies";
import type { FormValues } from "../AddTransactionDialogContent";
import { ASSET_TABS, type AssetTab, formatMoney } from "./constants";
import { AddTransactionPortfolioTypeFields } from "./AddTransactionPortfolioTypeFields";

type Props = Readonly<{
  form: UseFormReturn<FormValues>;
  forcedPortfolioId: string | null;
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  isCashTab: boolean;
  activeTab: AssetTab;
  onTabChange: (nextTab: AssetTab) => void;
  onPortfolioChange: (nextPortfolioId: string) => void;
  onTypeChange: (nextType: "BUY" | "SELL") => void;
  resolvedCashCurrency: CashCurrency;
  onCashCurrencyChange: (nextCurrency: string) => void;
  selectedInstrument: InstrumentSearchResult | null;
  setSelectedInstrument: (next: InstrumentSearchResult | null) => void;
  searchClient?: InstrumentSearchClient;
  initialCashCurrency: CashCurrency;
  availableCashNow: string;
  availableAssetQuantity: string | null;
}>;

export function AddTransactionInstrumentSection({
  form,
  forcedPortfolioId,
  portfolios,
  isCashTab,
  activeTab,
  onTabChange,
  onPortfolioChange,
  onTypeChange,
  resolvedCashCurrency,
  onCashCurrencyChange,
  selectedInstrument,
  setSelectedInstrument,
  searchClient,
  initialCashCurrency,
  availableCashNow,
  availableAssetQuantity,
}: Props) {
  const tabIcons = {
    EQUITY: Landmark,
    CRYPTOCURRENCY: Coins,
    CASH: Wallet,
  } as const;

  return (
    <>
      <AddTransactionPortfolioTypeFields
        form={form}
        forcedPortfolioId={forcedPortfolioId}
        portfolios={portfolios}
        isCashTab={isCashTab}
        onPortfolioChange={onPortfolioChange}
        onTypeChange={onTypeChange}
      />

      <div>
        <Label className="text-sm font-medium">Kategoria instrumentu</Label>
        <Tabs onValueChange={(next) => onTabChange(next as AssetTab)} value={activeTab}>
          <TabsList className="mt-2 grid h-auto w-full grid-cols-2 gap-2 sm:grid-cols-3">
            {ASSET_TABS.map((tab) => {
              const Icon = tabIcons[tab.value];
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="h-9 rounded-md"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="size-3.5" aria-hidden />
                    <span>{tab.label}</span>
                  </span>
                </TabsTrigger>
              );
            })}
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
                  onValueChange={onCashCurrencyChange}
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
                    form.setValue("date", format(new Date(), "yyyy-MM-dd"), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    form.setValue("quantity", "1", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    form.setValue("price", "", {
                      shouldDirty: true,
                      shouldValidate: false,
                    });
                    form.clearErrors("price");
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
                Dostępne (na dziś): {formatMoney(availableCashNow, resolvedCashCurrency)}
              </p>
            ) : availableAssetQuantity !== null ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Dostępne do sprzedaży (na teraz): {availableAssetQuantity}
              </p>
            ) : null}
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
