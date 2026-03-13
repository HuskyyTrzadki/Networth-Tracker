"use client";

import { useRef } from "react";
import type { UseFormReturn } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/design-system/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/features/design-system/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/features/design-system/components/ui/tabs";
import { CreatePortfolioDialog } from "@/features/portfolio/components/CreatePortfolioDialog";
import type { CreatePortfolioInput } from "@/features/portfolio/lib/create-portfolio-schema";

import type { FormValues } from "../AddTransactionDialogContent";

const CREATE_PORTFOLIO_VALUE = "__create_portfolio__";

export function AddTransactionPortfolioTypeFields({
  form,
  forcedPortfolioId,
  isEditMode = false,
  portfolios,
  isCashTab,
  isCustomTab,
  isPortfolioSwitchPending = false,
  onPortfolioChange,
  onTypeChange,
  createPortfolioFn,
}: Readonly<{
  form: UseFormReturn<FormValues>;
  forcedPortfolioId: string | null;
  isEditMode?: boolean;
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  isCashTab: boolean;
  isCustomTab: boolean;
  isPortfolioSwitchPending?: boolean;
  onPortfolioChange: (nextPortfolioId: string) => void;
  onTypeChange: (nextType: "BUY" | "SELL") => void;
  createPortfolioFn: (input: CreatePortfolioInput) => Promise<{ id: string }>;
}>) {
  const fieldLabelClass =
    "text-[11px] uppercase tracking-[0.14em] text-muted-foreground";
  const createDialogControls = useRef<{ open: () => void; disabled: boolean } | null>(
    null
  );

  return (
    <>
      <FormField
        control={form.control}
        name="portfolioId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={fieldLabelClass}>Portfel</FormLabel>
            <Select
              disabled={Boolean(forcedPortfolioId) || isEditMode || isPortfolioSwitchPending}
              onValueChange={(next) => {
                if (next === CREATE_PORTFOLIO_VALUE) {
                  const controls = createDialogControls.current;
                  if (controls && !controls.disabled) {
                    controls.open();
                  }
                  return;
                }
                field.onChange(next);
                onPortfolioChange(next);
              }}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger className="h-10" data-testid="transaction-portfolio-select">
                  <SelectValue placeholder="Wybierz portfel" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {portfolios.map((portfolio) => (
                  <SelectItem key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem
                  value={CREATE_PORTFOLIO_VALUE}
                  className="font-semibold text-primary focus:text-primary"
                >
                  + Stwórz nowy portfel
                </SelectItem>
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
            <FormLabel className={fieldLabelClass}>
              {isCashTab ? "Typ przepływu" : "Typ transakcji"}
            </FormLabel>
            <FormControl>
              {isCustomTab ? (
                <div className="flex h-10 items-center">
                  <span className="rounded-sm border border-border/65 bg-background/90 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground/85">
                    Dodanie
                  </span>
                </div>
              ) : (
                <Tabs
                  onValueChange={(next) => {
                    const nextType = next as "BUY" | "SELL";
                    field.onChange(nextType);
                    onTypeChange(nextType);
                  }}
                  value={field.value}
                >
                  <TabsList className="grid h-10 w-full grid-cols-2 rounded-md border border-border/65 bg-background/70 p-1">
                    <TabsTrigger
                      className="h-8 w-full rounded-sm text-[12px] data-[state=active]:border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:ring-0"
                      value="BUY"
                      data-testid="transaction-type-buy"
                    >
                      {isCashTab ? "Wpłata" : "Kupno"}
                    </TabsTrigger>
                    <TabsTrigger
                      className="h-8 w-full rounded-sm text-[12px] data-[state=active]:border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:ring-0"
                      value="SELL"
                      data-testid="transaction-type-sell"
                    >
                      {isCashTab ? "Wypłata" : "Sprzedaż"}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <CreatePortfolioDialog
        createPortfolioFn={createPortfolioFn}
        onCreated={() => undefined}
        trigger={({ open, disabled }) => {
          createDialogControls.current = { open, disabled };
          return null;
        }}
      />
    </>
  );
}
