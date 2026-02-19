"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/design-system/components/ui/form";
import { Textarea } from "@/features/design-system/components/ui/textarea";

import { TransactionLiveSummary } from "../TransactionLiveSummary";
import type { FormValues } from "../AddTransactionDialogContent";
import type { UseFormReturn } from "react-hook-form";
import type { TransactionType } from "../../lib/add-transaction-form-schema";

export function AddTransactionNotesSummary({
  form,
  displayCurrency,
  fee,
  price,
  quantity,
  type,
  variant = "default",
}: Readonly<{
  form: UseFormReturn<FormValues>;
  displayCurrency: string;
  fee: string;
  price: string;
  quantity: string;
  type: TransactionType;
  variant?: "default" | "custom";
}>) {
  const label = variant === "custom" ? "Opis" : "Notatka";
  const placeholder =
    variant === "custom"
      ? "Adres/miasto, metraz, standard, okolica, wszystko co pomoze wycenic…"
      : "Dlaczego to kupiłem? (np. Spadło o 10% po wynikach)";

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                className="min-h-24 resize-none"
                placeholder={placeholder}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <TransactionLiveSummary
        currency={displayCurrency}
        fee={fee}
        price={price}
        quantity={quantity}
        type={type}
      />
    </div>
  );
}
