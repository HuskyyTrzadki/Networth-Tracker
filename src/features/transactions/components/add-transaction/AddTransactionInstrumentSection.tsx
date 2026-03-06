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
import type { CreatePortfolioInput } from "@/features/portfolio/lib/create-portfolio-schema";
import { customAssetTypeIcons } from "../custom-asset-icons";

type Props = Readonly<{
  form: UseFormReturn<FormValues>;
  forcedPortfolioId: string | null;
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  isCashTab: boolean;
  isCustomTab: boolean;
  activeTab: AssetTab;
  onTabChange: (nextTab: AssetTab) => void;
  isPortfolioSwitchPending?: boolean;
  transactionType: FormValues["type"];
  onPortfolioChange: (nextPortfolioId: string) => void;
  onTypeChange: (nextType: "BUY" | "SELL") => void;
  resolvedCashCurrency: CashCurrency;
  onCashCurrencyChange: (nextCurrency: string) => void;
  selectedInstrument: InstrumentSearchResult | null;
  setSelectedInstrument: (next: InstrumentSearchResult | null) => void;
  searchClient?: InstrumentSearchClient;
  initialCashCurrency: CashCurrency;
  availableCashNow: string | null;
  availableAssetQuantity: string | null;
  isPortfolioBalanceLoading?: boolean;
  isEditMode?: boolean;
  portfolioBalanceErrorMessage?: string | null;
  onOpenScreenshot: () => void;
  createPortfolioFn: (input: CreatePortfolioInput) => Promise<{ id: string }>;
}>;

export function AddTransactionInstrumentSection({
  form,
  forcedPortfolioId,
  portfolios,
  isCashTab,
  isCustomTab,
  activeTab,
  onTabChange,
  isPortfolioSwitchPending = false,
  transactionType,
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
  isPortfolioBalanceLoading = false,
  isEditMode = false,
  portfolioBalanceErrorMessage = null,
  onOpenScreenshot,
  createPortfolioFn,
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
        isPortfolioSwitchPending={isPortfolioSwitchPending}
        onPortfolioChange={onPortfolioChange}
        onTypeChange={onTypeChange}
        onOpenScreenshot={onOpenScreenshot}
        createPortfolioFn={createPortfolioFn}
      />

      <div className="rounded-md border border-dashed border-border/60 bg-background/60 p-3">
        <Label className={fieldLabelClass}>Rodzaj pozycji</Label>
        <Tabs onValueChange={(next) => onTabChange(next as AssetTab)} value={activeTab}>
          <TabsList
            className="mt-2 grid h-10 w-full grid-cols-3 gap-1 rounded-md border border-border/65 bg-background/72 p-1"
            data-testid="transaction-asset-tabs"
          >
            {ASSET_TABS.map((tab) => {
              const Icon = tabIcons[tab.value];
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={isEditMode}
                  className="h-8 rounded-sm px-2 text-[12px] data-[state=active]:border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:ring-0"
                  data-testid={`transaction-asset-tab-${tab.value.toLowerCase()}`}
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
        <div className="space-y-3 rounded-md border border-dashed border-border/65 bg-background/68 p-3.5">
          <FormField
            control={form.control}
            name="customAssetType"
            render={({ field }) => {
              const selectedAssetType =
                field.value && isCustomAssetType(field.value) ? field.value : null;
              const SelectedAssetIcon = selectedAssetType
                ? customAssetTypeIcons[selectedAssetType]
                : null;

              return (
                <FormItem>
                  <FormLabel className={fieldLabelClass}>Typ aktywa</FormLabel>
                  <FormControl>
                    <Select
                      disabled={isEditMode}
                      onValueChange={(next) => {
                        if (!isCustomAssetType(next)) return;
                        field.onChange(next);
                        form.setValue("assetId", `custom:${next}`, {
                          shouldValidate: true,
                        });
                      }}
                      value={field.value ?? ""}
                    >
                      <SelectTrigger className="h-11 border-input/85 bg-background/92">
                        {selectedAssetType && SelectedAssetIcon ? (
                          <span className="inline-flex items-center gap-2">
                            <SelectedAssetIcon
                              className="size-3.5 text-muted-foreground"
                              aria-hidden
                            />
                            <span>{customAssetTypeLabels[selectedAssetType]}</span>
                          </span>
                        ) : (
                          <SelectValue placeholder="Wybierz typ aktywa" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {customAssetTypes.map((assetType) => {
                          const Icon = customAssetTypeIcons[assetType];
                          return (
                            <SelectItem key={assetType} value={assetType}>
                              <span className="inline-flex items-center gap-2">
                                <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                                <span>{customAssetTypeLabels[assetType]}</span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
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
                      className="h-11 border-input/85 bg-background/92"
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
                      <SelectTrigger className="h-11 border-input/85 bg-background/92">
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
            <FormItem className="rounded-md border border-dashed border-border/60 bg-background/68 p-3">
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
                    <SelectTrigger
                      className="h-11 border-input/85 bg-background/92"
                      data-testid="transaction-cash-asset-currency-select"
                    >
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
                  <div className="flex h-11 items-center justify-between rounded-md border border-input/85 bg-background/76 px-3 text-sm">
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
                    triggerTestId="transaction-instrument-combobox"
                  />
                )}
              </FormControl>
              {isCashTab ? (
                <p className="mt-2 border-t border-dashed border-border/55 pt-2 text-[11px] text-muted-foreground">
                  Dostępne (na dziś):{" "}
                  {isPortfolioBalanceLoading
                    ? "Ładuję stan gotówki..."
                    : availableCashNow
                      ? formatMoney(availableCashNow, resolvedCashCurrency)
                      : "—"}
                </p>
              ) : availableAssetQuantity !== null ? (
                <p className="mt-2 border-t border-dashed border-border/55 pt-2 text-[11px] text-muted-foreground">
                  Dostępne do sprzedaży (na teraz): {availableAssetQuantity}
                </p>
              ) : transactionType === "SELL" && isPortfolioBalanceLoading ? (
                <p className="mt-2 border-t border-dashed border-border/55 pt-2 text-[11px] text-muted-foreground">
                  Sprawdzam dostępny stan portfela...
                </p>
              ) : null}
              {transactionType === "SELL" && portfolioBalanceErrorMessage ? (
                <p className="mt-2 rounded-sm border border-[color:var(--loss)]/30 bg-[color:var(--loss)]/8 px-2 py-1 text-[11px] text-[color:var(--loss)]">
                  {portfolioBalanceErrorMessage}
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
