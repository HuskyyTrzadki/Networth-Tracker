"use client";

import type { UseFormReturn } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/design-system/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/design-system/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/features/design-system/components/ui/tabs";

import type { FormValues } from "../AddTransactionDialogContent";

export function AddTransactionPortfolioTypeFields({
  form,
  forcedPortfolioId,
  portfolios,
  isCashTab,
  onPortfolioChange,
  onTypeChange,
}: Readonly<{
  form: UseFormReturn<FormValues>;
  forcedPortfolioId: string | null;
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  isCashTab: boolean;
  onPortfolioChange: (nextPortfolioId: string) => void;
  onTypeChange: (nextType: "BUY" | "SELL") => void;
}>) {
  return (
    <>
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
                onPortfolioChange(next);
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
                  const nextType = next as "BUY" | "SELL";
                  field.onChange(nextType);
                  onTypeChange(nextType);
                }}
                value={field.value}
              >
                <TabsList className="grid h-10 w-full grid-cols-2 p-1">
                  <TabsTrigger
                    className="h-8 w-full rounded-sm"
                    value="BUY"
                  >
                    {isCashTab ? "Wpłata" : "Kupno"}
                  </TabsTrigger>
                  <TabsTrigger
                    className="h-8 w-full rounded-sm"
                    value="SELL"
                  >
                    {isCashTab ? "Wypłata" : "Sprzedaż"}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
