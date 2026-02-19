"use client";

import { format } from "date-fns";
import {
  Car,
  CircleHelp,
  HandCoins,
  House,
  Landmark,
  Laptop,
  LineChart,
  PiggyBank,
  Wallet,
  type LucideIcon,
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
import { ToggleGroup, ToggleGroupItem } from "@/features/design-system/components/ui/toggle-group";
import { cn } from "@/lib/cn";

import { InstrumentCombobox } from "../InstrumentCombobox";
import type { InstrumentSearchClient } from "../../client/search-instruments";
import type { InstrumentSearchResult } from "../../lib/instrument-search";
import { instrumentTypes } from "../../lib/instrument-search";
import {
  customAssetTypes,
  customAssetTypeLabels,
  isCustomAssetType,
  type CustomAssetType,
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
}>;

const customAssetTypeIcons: Readonly<Record<CustomAssetType, LucideIcon>> = {
  REAL_ESTATE: House,
  CAR: Car,
  COMPUTER: Laptop,
  TREASURY_BONDS: Landmark,
  TERM_DEPOSIT: PiggyBank,
  PRIVATE_LOAN: HandCoins,
  OTHER: CircleHelp,
};

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
}: Props) {
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
        portfolios={portfolios}
        isCashTab={isCashTab}
        isCustomTab={isCustomTab}
        onPortfolioChange={onPortfolioChange}
        onTypeChange={onTypeChange}
      />

      <div>
        <Label className="text-sm font-medium">Rodzaj pozycji</Label>
        <Tabs onValueChange={(next) => onTabChange(next as AssetTab)} value={activeTab}>
          <TabsList className="mt-2 grid h-auto w-full grid-cols-3 gap-2">
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

      {isCustomTab ? (
        <div className="space-y-4 rounded-md border border-border/70 bg-muted/20 p-4">
          <FormField
            control={form.control}
            name="customAssetType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Typ aktywa</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    value={field.value ?? ""}
                    onValueChange={(next) => {
                      if (!next) {
                        field.onChange(undefined);
                        form.setValue("assetId", "", { shouldValidate: true });
                        return;
                      }
                      if (!isCustomAssetType(next)) return;

                      field.onChange(next);
                      form.setValue("assetId", `custom:${next}`, { shouldValidate: true });
                    }}
                    className="flex flex-wrap gap-2"
                  >
                    {customAssetTypes.map((assetType) => {
                      const Icon = customAssetTypeIcons[assetType];
                      return (
                        <ToggleGroupItem
                          key={assetType}
                          value={assetType}
                          className={cn(
                            "h-9 rounded-md border border-border/75 bg-background px-3 text-[13px]",
                            "data-[state=on]:border-primary/40 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                          )}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Icon className="size-4" aria-hidden />
                            {customAssetTypeLabels[assetType]}
                          </span>
                        </ToggleGroupItem>
                      );
                    })}
                  </ToggleGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="customName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-11"
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
                  <FormLabel>Waluta</FormLabel>
                  <Select
                    onValueChange={(next) => {
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
      )}
    </>
  );
}
