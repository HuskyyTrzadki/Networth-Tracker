"use client";

import { format } from "date-fns";
import {
  House,
  LineChart,
  Wallet,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/design-system/components/ui/form";
import { Label } from "@/features/design-system/components/ui/label";
import { Input } from "@/features/design-system/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/design-system/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/features/design-system/components/ui/tabs";

import { InstrumentCombobox } from "../InstrumentCombobox";
import type { InstrumentSearchClient } from "../../client/search-instruments";
import type { InstrumentSearchResult } from "../../lib/instrument-search";
import { instrumentTypes } from "../../lib/instrument-search";
import {
  customAssetTypes,
  customAssetTypeLabels,
  isCustomAssetType,
} from "../../lib/custom-asset-types";
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
  isCustomTab: boolean;
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
  isEditMode?: boolean;
}>;

export function AddTransactionInstrumentSection({
  form,
  forcedPortfolioId,
  portfolios,
  isCashTab,
  isCustomTab,
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
  isEditMode = false,
}: Props) {
  const fieldLabelClass =
    "text-[11px] uppercase tracking-[0.14em] text-muted-foreground";
  const tabIcons = {
    MARKET: LineChart,
    CASH: Wallet,
    CUSTOM: House,
  } as const;

  return (
    <>
      <AddTransactionPortfolioTypeFields
        form={form}
        forcedPortfolioId={forcedPortfolioId}
        isEditMode={isEditMode}
        portfolios={portfolios}
        isCashTab={isCashTab}
        isCustomTab={isCustomTab}
        onPortfolioChange={onPortfolioChange}
        onTypeChange={onTypeChange}
      />

      <div>
        <Label className={fieldLabelClass}>Rodzaj pozycji</Label>
        <Tabs onValueChange={(next) => onTabChange(next as AssetTab)} value={activeTab}>
          <TabsList className="mt-2 grid h-10 w-full grid-cols-3 gap-1 rounded-md border border-border/70 bg-muted/45 p-1">
            {ASSET_TABS.map((tab) => {
              const Icon = tabIcons[tab.value];
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={isEditMode}
                  className="h-8 rounded-sm px-2 text-[12px] data-[state=active]:border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:ring-0"
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

      {isCustomTab ? (
        <div className="space-y-3 rounded-md border border-border/70 bg-muted/20 p-3.5">
          <FormField
            control={form.control}
            name="customAssetType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={fieldLabelClass}>Typ aktywa</FormLabel>
                <FormControl>
                  <Select
                    disabled={isEditMode}
                    onValueChange={(next) => {
                      if (!isCustomAssetType(next)) return;
                      field.onChange(next);
                      form.setValue("assetId", `custom:${next}`, { shouldValidate: true });
                    }}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Wybierz typ aktywa" />
                    </SelectTrigger>
                    <SelectContent>
                      {customAssetTypes.map((assetType) => (
                        <SelectItem key={assetType} value={assetType}>
                          {customAssetTypeLabels[assetType]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="customName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={fieldLabelClass}>Nazwa</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-11"
                      disabled={isEditMode}
                      placeholder="np. Mieszkanie, auto, lokata"
                      type="text"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={fieldLabelClass}>Waluta</FormLabel>
                  <Select
                    disabled={isEditMode}
                    onValueChange={(next) => {
                      if (isEditMode) return;
                      field.onChange(next);
                      form.setValue("currency", next, { shouldValidate: true });
                    }}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
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
          </div>
        </div>
      ) : (
        <FormField
          control={form.control}
          name="assetId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={fieldLabelClass}>
                {isCashTab ? "Waluta" : "Instrument"}
              </FormLabel>
              <FormControl>
                {isCashTab ? (
                  <Select
                    disabled={isEditMode}
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
                ) : isEditMode ? (
                  <div className="flex h-11 items-center justify-between rounded-md border border-input bg-muted/35 px-3 text-sm">
                    <span className="font-mono tabular-nums">
                      {selectedInstrument?.ticker ?? selectedInstrument?.symbol ?? "—"}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {selectedInstrument?.name ?? "Instrument"}
                    </span>
                  </div>
                ) : (
                  <InstrumentCombobox
                    allowedTypes={instrumentTypes.filter((type) => type !== "CURRENCY")}
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
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Dostępne (na dziś): {formatMoney(availableCashNow, resolvedCashCurrency)}
                </p>
              ) : availableAssetQuantity !== null ? (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Dostępne do sprzedaży (na teraz): {availableAssetQuantity}
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}
